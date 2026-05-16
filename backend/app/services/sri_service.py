from __future__ import annotations

import base64
import logging
import time
from datetime import datetime
from pathlib import Path

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session
from zeep import Client
from zeep.transports import Transport

from app.core.config import get_settings
from app.exceptions import SRIConexionError, SRIRechazoError
from app.models.factura import Factura
from app.utils.firma import firmar_xml
from app.utils.xml_generator import generar_xml_factura

logger = logging.getLogger(__name__)
settings = get_settings()


ERROR_NO_REINTENTAR = {
    "Clave acceso registrada",
    "Secuencial registrado",
    "Clave de acceso en procesamiento",
}
ERROR_BLOQUEO_CONTRIBUYENTE = {
    "Establecimiento Cerrado",
    "Autorizacion suspendida",
    "RUC clausurado",
    "RUC sin autorizacion de emision",
    "Acuerdo de medios electronicos no aceptado",
}
ERROR_CORRECCION_REQUERIDA = {
    "ARCHIVO NO CUMPLE ESTRUCTURA XML",
    "Error en la estructura de clave acceso",
    "Firma invalida",
    "Existe error en los calculos",
}


def interpretar_error_sri(codigo: str | None, mensaje: str) -> dict[str, str | bool]:
    text = f"{codigo or ''} {mensaje or ''}".lower()
    manual_fix = {
        "archivo no cumple estructura xml": "Revisar XML y corregir estructura; no reintentar automatico",
        "error en la estructura de clave acceso": "Regenerar clave de acceso y reenviar",
        "firma invalida": "Verificar certificado/firma y notificar admin",
        "existe error en los calculos": "Recalcular totales y regenerar XML",
    }
    no_retry = {
        "clave acceso registrada": "Comprobante ya enviado; consultar autorizacion",
        "secuencial registrado": "Duplicado detectado; marcar como DUPLICADO",
        "clave de acceso en procesamiento": "Esperar y consultar autorizacion; no reenviar",
    }
    blocked = {
        "establecimiento cerrado": "BLOQUEADO: establecimiento cerrado",
        "autorizacion suspendida": "BLOQUEADO: autorizacion suspendida",
        "ruc clausurado": "BLOQUEADO: RUC clausurado",
        "ruc sin autorizacion de emision": "BLOQUEADO: RUC sin autorizacion de emision",
        "acuerdo de medios electronicos no aceptado": "BLOQUEADO: acuerdo de medios no aceptado",
    }

    for key, action in manual_fix.items():
        if key in text:
            return {"codigo": codigo or "CORRECCION", "accion": action, "reintentar": False, "intervencion_manual": True}
    for key, action in no_retry.items():
        if key in text:
            return {"codigo": codigo or "NO_REINTENTAR", "accion": action, "reintentar": False, "intervencion_manual": False}
    for key, action in blocked.items():
        if key in text:
            return {"codigo": codigo or "BLOQUEADO", "accion": action, "reintentar": False, "intervencion_manual": True}

    return {"codigo": codigo or "DESCONOCIDO", "accion": "Revisar mensajes SRI", "reintentar": True, "intervencion_manual": False}


def _wsdl_recepcion() -> str:
    return settings.SRI_WS_RECEPCION_PROD if settings.AMBIENTE_SRI == 2 else settings.SRI_WS_RECEPCION_PRUEBAS


def _wsdl_autorizacion() -> str:
    return settings.SRI_WS_AUTORIZACION_PROD if settings.AMBIENTE_SRI == 2 else settings.SRI_WS_AUTORIZACION_PRUEBAS


def enviar_comprobante(xml_firmado: str) -> dict:
    """Envia comprobante firmado al WS de recepcion SRI."""
    payload = base64.b64encode(xml_firmado.encode("utf-8")).decode("utf-8")
    attempts = [2, 4, 8]
    last_error: Exception | None = None

    for backoff in attempts:
        try:
            client = Client(_wsdl_recepcion(), transport=Transport(timeout=30))
            result = client.service.validarComprobante(payload)
            estado = getattr(result, "estado", "DESCONOCIDO")
            mensajes = []
            if getattr(result, "comprobantes", None) and result.comprobantes.comprobante:
                comp = result.comprobantes.comprobante[0]
                mensajes = [getattr(m, "mensaje", "") for m in getattr(comp, "mensajes", [])]
            return {"estado": estado, "mensajes": mensajes}
        except Exception as exc:
            logger.exception("Fallo envio a SRI, reintento en %ss", backoff)
            last_error = exc
            time.sleep(backoff)

    raise SRIConexionError("No se pudo enviar comprobante al SRI") from last_error


def consultar_autorizacion(clave_acceso: str) -> dict:
    """Consulta autorizacion por clave de acceso."""
    for _ in range(5):
        try:
            client = Client(_wsdl_autorizacion(), transport=Transport(timeout=30))
            result = client.service.autorizacionComprobante(clave_acceso)
            autorizaciones = getattr(result, "autorizaciones", None)
            if autorizaciones and autorizaciones.autorizacion:
                aut = autorizaciones.autorizacion[0]
                estado = getattr(aut, "estado", "EN_PROCESO")
                return {
                    "estado": estado,
                    "numero_autorizacion": getattr(aut, "numeroAutorizacion", None),
                    "fecha_autorizacion": getattr(aut, "fechaAutorizacion", None),
                    "xml_autorizado": getattr(aut, "comprobante", None),
                    "mensajes": [getattr(m, "mensaje", "") for m in getattr(aut, "mensajes", [])],
                }
            time.sleep(3)
        except Exception:
            logger.exception("Error consultando autorizacion")
            time.sleep(3)
    return {"estado": "EN_PROCESO", "numero_autorizacion": None, "fecha_autorizacion": None, "xml_autorizado": None}


def _save_text(base: Path, name: str, content: str) -> str:
    base.mkdir(parents=True, exist_ok=True)
    path = base / name
    path.write_text(content, encoding="utf-8")
    return str(path)


def procesar_factura_sri(factura_id: int, db: Session) -> dict:
    """Orquesta generacion XML, firma, envio, autorizacion y RIDE."""
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise ValueError("Factura no encontrada")

    now = datetime.now()
    base = Path("data/comprobantes") / f"{now.year}" / f"{now.month:02d}"
    try:
        factura.sri_estado = "PENDIENTE_ENVIO"
        tipo_emision = "2" if factura.sri_estado == "CONTINGENCIA" else str(settings.SRI_EMISION)
        factura_data = {
            "infoTributaria": {
                "ambiente": str(settings.AMBIENTE_SRI),
                "tipoEmision": tipo_emision,
                "razonSocial": factura.empresa.razon_social,
                "nombreComercial": factura.empresa.nombre_comercial or "",
                "ruc": factura.empresa.ruc,
                "claveAcceso": factura.clave_acceso or "",
                "codDoc": "01",
                "estab": factura.establecimiento.codigo,
                "ptoEmi": factura.punto_emision.codigo,
                "secuencial": factura.secuencial,
                "dirMatriz": factura.empresa.direccion_matriz,
            },
            "infoFactura": {
                "fechaEmision": factura.fecha_emision.strftime("%d/%m/%Y"),
                "dirEstablecimiento": factura.establecimiento.direccion,
                "obligadoContabilidad": "SI" if factura.empresa.obligado_contabilidad else "NO",
                "tipoIdentificacionComprador": "04",
                "razonSocialComprador": factura.cliente.razon_social,
                "identificacionComprador": factura.cliente.identificacion,
                "totalSinImpuestos": str(factura.subtotal_sin_impuestos),
                "totalDescuento": str(factura.descuento_total),
                "formaPago": "01",
            },
            "detalles": [
                {
                    "codigoPrincipal": d.codigo_principal,
                    "descripcion": d.descripcion,
                    "cantidad": str(d.cantidad),
                    "precioUnitario": str(d.precio_unitario),
                    "descuento": str(d.descuento),
                    "ivaTarifa": str(d.iva_tarifa),
                }
                for d in factura.detalles
            ],
            "infoAdicional": {
                "email": factura.cliente.email or "",
                "direccion": factura.cliente.direccion or "",
            },
        }
        xml_original = generar_xml_factura(factura_data)
        p_xml = _save_text(base, f"factura_{factura.id}_original.xml", xml_original)

        factura.sri_estado = "ENVIADA_SRI"
        xml_firmado = firmar_xml(xml_original, settings.SRI_CERT_PATH, settings.SRI_CERT_PASSWORD)
        p_firmado = _save_text(base, f"factura_{factura.id}_firmado.xml", xml_firmado)

        recepcion = enviar_comprobante(xml_firmado)
        factura.sri_estado = recepcion["estado"]
        _save_text(base, f"factura_{factura.id}_recepcion.json", str(recepcion))
        if recepcion["estado"] == "DEVUELTA":
            mensajes = recepcion.get("mensajes") or ["Comprobante devuelto por SRI"]
            parsed = interpretar_error_sri(None, " | ".join(mensajes))
            factura.codigo_error_sri = str(parsed.get("codigo"))
            factura.accion_requerida = str(parsed.get("accion"))
            factura.requiere_intervencion_manual = bool(parsed.get("intervencion_manual"))
            raise SRIRechazoError("Comprobante devuelto por SRI")

        autorizacion = consultar_autorizacion(factura.clave_acceso or "")
        factura.sri_estado = autorizacion["estado"]
        if autorizacion["xml_autorizado"]:
            p_aut = _save_text(base, f"factura_{factura.id}_autorizado.xml", autorizacion["xml_autorizado"])
        else:
            p_aut = ""

        ride_path = ""
        if autorizacion["estado"] == "AUTORIZADO":
            ride_path = generar_ride(autorizacion["xml_autorizado"] or xml_firmado, factura.id)
            if settings.NOTIF_ENVIAR_EMAIL and factura.cliente and factura.cliente.email:
                try:
                    from app.services.email_service import enviar_factura_email
                    enviar_factura_email(factura.id, factura.cliente.email, db)
                except Exception:
                    logger.exception("Fallo envio email post-autorizacion")
            if settings.NOTIF_ENVIAR_WHATSAPP and factura.cliente and factura.cliente.telefono:
                try:
                    from app.services.whatsapp_service import enviar_factura_whatsapp
                    enviar_factura_whatsapp(factura.id, factura.cliente.telefono, db)
                except Exception:
                    logger.exception("Fallo envio WhatsApp post-autorizacion")

        db.commit()
        return {
            "estado": factura.sri_estado,
            "xml_original": p_xml,
            "xml_firmado": p_firmado,
            "xml_autorizado": p_aut,
            "ride": ride_path,
        }
    except SRIRechazoError:
        db.commit()
        raise
    except Exception as exc:
        logger.warning("SRI prefiere transmision inmediata 2026; contingencia solo excepcional")
        factura.sri_estado = "CONTINGENCIA"
        factura.motivo_contingencia = factura.motivo_contingencia or "OTRO"
        db.commit()
        raise SRIConexionError("Falla de conexion/proceso SRI") from exc


def generar_ride(xml_autorizado: str, factura_id: int) -> str:
    """Genera un RIDE basico en PDF con QR."""
    now = datetime.now()
    out_dir = Path("data/rides") / f"{now.year}" / f"{now.month:02d}"
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / f"ride_{factura_id}.pdf"

    c = canvas.Canvas(str(pdf_path))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, 800, f"RIDE Factura #{factura_id}")
    c.setFont("Helvetica", 9)
    c.drawString(40, 780, "Documento autorizado SRI")
    c.drawString(40, 760, f"Fecha: {now.isoformat()}")
    c.drawString(40, 740, "Resumen XML autorizado")
    c.drawString(40, 725, xml_autorizado[:180].replace("\n", " "))

    qr = QrCodeWidget(str(factura_id))
    bounds = qr.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    drawing = Drawing(100, 100, transform=[100.0 / width, 0, 0, 100.0 / height, 0, 0])
    drawing.add(qr)
    drawing.drawOn(c, 430, 700)

    c.save()
    return str(pdf_path)
