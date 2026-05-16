from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.guia_remision import GuiaRemision
from app.services.sri_service import consultar_autorizacion, enviar_comprobante
from app.utils.firma import firmar_xml
from app.utils.xml_generator import generar_xml_guia_remision

logger = logging.getLogger(__name__)
settings = get_settings()


def procesar_guia_sri(guia_id: int, db: Session) -> dict:
    guia = db.query(GuiaRemision).filter(GuiaRemision.id == guia_id).first()
    if not guia:
        raise ValueError("Guia no encontrada")

    now = datetime.now()
    base = Path("data/comprobantes") / f"{now.year}" / f"{now.month:02d}"
    try:
        guia.estado_sri = "PENDIENTE_ENVIO"
        data = {
            "infoTributaria": {
                "ambiente": str(settings.AMBIENTE_SRI),
                "tipoEmision": "1",
                "razonSocial": settings.SRI_RAZON_SOCIAL,
                "ruc": settings.SRI_RUC,
                "claveAcceso": guia.clave_acceso or "",
                "codDoc": "06",
                "estab": str(guia.establecimiento_origen_id).zfill(3),
                "ptoEmi": "001",
                "secuencial": guia.numero[-9:],
                "dirMatriz": settings.SRI_DIR_MATRIZ,
            },
            "infoGuia": {
                "fechaEmision": guia.fecha_emision.strftime("%d/%m/%Y"),
                "fechaInicioTransporte": guia.fecha_inicio_transporte.strftime("%d/%m/%Y"),
                "fechaFinTransporte": guia.fecha_fin_transporte.strftime("%d/%m/%Y"),
                "transportistaRuc": guia.transportista_ruc,
                "transportistaNombre": guia.transportista_nombre,
                "placaVehiculo": guia.placa_vehiculo or "",
                "puntoPartida": guia.punto_partida,
                "puntoLlegada": guia.punto_llegada,
                "motivoTraslado": guia.motivo_traslado,
                "facturaId": str(guia.factura_id or ""),
            },
            "detalles": [
                {
                    "productoId": str(d.producto_id),
                    "cantidad": str(d.cantidad),
                    "unidadId": str(d.unidad_id or ""),
                    "descripcion": d.descripcion,
                }
                for d in guia.detalles
            ],
        }

        xml = generar_xml_guia_remision(data)
        p_xml = base / f"guia_{guia_id}_original.xml"
        p_xml.parent.mkdir(parents=True, exist_ok=True)
        p_xml.write_text(xml, encoding="utf-8")

        guia.estado_sri = "ENVIADA_SRI"
        xml_firmado = firmar_xml(xml, settings.SRI_CERT_PATH, settings.SRI_CERT_PASSWORD)
        rec = enviar_comprobante(xml_firmado)
        guia.estado_sri = rec.get("estado", "ERROR")
        if rec.get("estado") == "RECIBIDA" and guia.clave_acceso:
            aut = consultar_autorizacion(guia.clave_acceso)
            guia.estado_sri = aut.get("estado", "PENDIENTE")
        db.commit()
        return {"estado": guia.estado_sri}
    except Exception as exc:
        guia.estado_sri = "CONTINGENCIA"
        db.commit()
        logger.exception("Error procesando guia SRI")
        raise exc
