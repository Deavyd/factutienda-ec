from __future__ import annotations

import logging
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.liquidacion_compra import LiquidacionCompra
from app.services.sri_service import consultar_autorizacion, enviar_comprobante
from app.utils.firma import firmar_xml
from app.utils.xml_generator import generar_xml_liquidacion

logger = logging.getLogger(__name__)
settings = get_settings()


def procesar_liquidacion_sri(liquidacion_id: int, db: Session) -> dict:
    liq = db.query(LiquidacionCompra).filter(LiquidacionCompra.id == liquidacion_id).first()
    if not liq:
        raise ValueError("Liquidacion no encontrada")

    now = datetime.now()
    base = Path("data/comprobantes") / f"{now.year}" / f"{now.month:02d}"
    try:
        liq.estado_sri = "PENDIENTE_ENVIO"
        data = {
            "infoTributaria": {
                "ambiente": str(settings.AMBIENTE_SRI),
                "tipoEmision": "1",
                "razonSocial": settings.SRI_RAZON_SOCIAL,
                "ruc": settings.SRI_RUC,
                "claveAcceso": liq.clave_acceso or "",
                "codDoc": "03",
                "estab": str(liq.establecimiento_id).zfill(3),
                "ptoEmi": str(liq.punto_emision_id).zfill(3),
                "secuencial": liq.numero[-9:],
                "dirMatriz": settings.SRI_DIR_MATRIZ,
            },
            "infoLiquidacion": {
                "fechaEmision": liq.fecha_emision.strftime("%d/%m/%Y"),
                "provNombre": liq.proveedor_nombre,
                "provCedula": liq.proveedor_cedula,
                "provDireccion": liq.proveedor_direccion or "",
                "totalSinImpuestos": str(liq.subtotal_0 + liq.subtotal_15),
                "totalDescuento": "0.00",
                "importeTotal": str(liq.total),
                "moneda": "DOLAR",
            },
            "detalles": [
                {
                    "descripcion": d.descripcion,
                    "cantidad": str(d.cantidad),
                    "unidad": d.unidad,
                    "precioUnitario": str(d.precio_unitario),
                    "descuento": str(d.descuento),
                }
                for d in liq.detalles
            ],
        }

        xml = generar_xml_liquidacion(data)
        p_xml = base / f"liquidacion_{liquidacion_id}_original.xml"
        p_xml.parent.mkdir(parents=True, exist_ok=True)
        p_xml.write_text(xml, encoding="utf-8")

        liq.estado_sri = "ENVIADA_SRI"
        xml_firmado = firmar_xml(xml, settings.SRI_CERT_PATH, settings.SRI_CERT_PASSWORD)
        rec = enviar_comprobante(xml_firmado)
        liq.estado_sri = rec.get("estado", "ERROR")
        if rec.get("estado") == "RECIBIDA" and liq.clave_acceso:
            aut = consultar_autorizacion(liq.clave_acceso)
            liq.estado_sri = aut.get("estado", "PENDIENTE")
            liq.numero_autorizacion = aut.get("numero_autorizacion")
        db.commit()
        return {"estado": liq.estado_sri}
    except Exception as exc:
        liq.estado_sri = "CONTINGENCIA"
        db.commit()
        logger.exception("Error procesando liquidacion SRI")
        raise exc
