from __future__ import annotations

import logging
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria

logger = logging.getLogger(__name__)


def registrar_auditoria(
    usuario_id: int | None,
    accion: str,
    modulo: str,
    registro_id: int | None,
    datos_antes: dict | None,
    datos_despues: dict | None,
    request=None,
    db: Session | None = None,
) -> None:
    if not db:
        return
    try:
        ip = request.client.host if request else None
        ua = request.headers.get("user-agent") if request else None
        db.add(
            Auditoria(
                usuario_id=usuario_id,
                usuario_nombre=None,
                accion=accion,
                modulo=modulo,
                registro_id=registro_id,
                datos_antes=datos_antes,
                datos_despues=datos_despues,
                ip_address=ip,
                user_agent=ua,
                resultado="EXITOSO",
            )
        )
        db.commit()
    except Exception:
        logger.exception("Error registrando auditoria")


def get_auditoria(filtros: dict, db: Session) -> list[Auditoria]:
    q = db.query(Auditoria)
    if "usuario_id" in filtros:
        q = q.filter(Auditoria.usuario_id == filtros["usuario_id"])
    if "modulo" in filtros:
        q = q.filter(Auditoria.modulo == filtros["modulo"])
    if "accion" in filtros:
        q = q.filter(Auditoria.accion == filtros["accion"])
    if "fecha_inicio" in filtros:
        q = q.filter(Auditoria.created_at >= filtros["fecha_inicio"])
    if "fecha_fin" in filtros:
        q = q.filter(Auditoria.created_at <= filtros["fecha_fin"])
    return q.order_by(Auditoria.id.desc()).limit(500).all()
