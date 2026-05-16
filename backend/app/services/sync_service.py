from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.cola_sincronizacion import ColaSincronizacion

logger = logging.getLogger(__name__)


def agregar_a_cola(tipo: str, datos: dict, punto_emision_id: int | None, db: Session) -> ColaSincronizacion:
    item = ColaSincronizacion(
        tipo_operacion=tipo,
        datos_json=datos,
        estado="PENDIENTE",
        punto_emision_id=punto_emision_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def procesar_cola(db: Session) -> dict:
    pendientes = db.query(ColaSincronizacion).filter(ColaSincronizacion.estado == "PENDIENTE").order_by(ColaSincronizacion.id.asc()).all()
    procesadas = 0
    errores = 0
    for item in pendientes:
        try:
            item.estado = "PROCESANDO"
            db.commit()
            if item.tipo_operacion == "FACTURA":
                from app.services.sri_service import procesar_factura_sri
                procesar_factura_sri(item.datos_json["factura_id"], db)
            elif item.tipo_operacion == "NOTA_CREDITO":
                pass
            item.estado = "COMPLETADO"
            item.procesado_at = datetime.utcnow().isoformat()
            procesadas += 1
            db.commit()
        except Exception as exc:
            item.estado = "ERROR"
            item.error_detalle = str(exc)[:500]
            item.intentos += 1
            errores += 1
            db.commit()
    return {"procesadas": procesadas, "errores": errores, "pendientes": len(pendientes) - procesadas - errores}


def reintentar_errores(db: Session) -> None:
    errores = db.query(ColaSincronizacion).filter(
        ColaSincronizacion.estado == "ERROR",
        ColaSincronizacion.intentos < ColaSincronizacion.max_intentos,
    ).all()
    for item in errores:
        item.estado = "PENDIENTE"
        item.intentos += 1
    db.commit()


def get_estado_sync(punto_emision_id: int | None, db: Session) -> dict:
    q = db.query(ColaSincronizacion)
    if punto_emision_id:
        q = q.filter(ColaSincronizacion.punto_emision_id == punto_emision_id)
    pend = q.filter(ColaSincronizacion.estado == "PENDIENTE").count()
    err = q.filter(ColaSincronizacion.estado == "ERROR").count()
    return {"pendientes": pend, "errores": err}
