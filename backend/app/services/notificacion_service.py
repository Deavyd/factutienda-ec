from __future__ import annotations

import logging
from datetime import date

from sqlalchemy.orm import Session

from app.models.factura import Factura
from app.models.lote import Lote
from app.models.notificacion import Notificacion
from app.models.producto import Producto

logger = logging.getLogger(__name__)


def crear_notificacion(
    tipo: str,
    titulo: str,
    mensaje: str,
    prioridad: str,
    usuario_id: int | None,
    referencia_id: int | None,
    referencia_tipo: str | None,
    db: Session,
) -> None:
    try:
        db.add(
            Notificacion(
                usuario_id=usuario_id,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                prioridad=prioridad,
                referencia_id=referencia_id,
                referencia_tipo=referencia_tipo,
            )
        )
        db.commit()
    except Exception:
        logger.exception("Error creando notificacion")


def get_notificaciones_usuario(usuario_id: int, solo_no_leidas: bool, db: Session) -> list[Notificacion]:
    q = db.query(Notificacion).filter(
        (Notificacion.usuario_id == usuario_id) | (Notificacion.usuario_id.is_(None))
    )
    if solo_no_leidas:
        q = q.filter(Notificacion.leida.is_(False))
    return q.order_by(Notificacion.id.desc()).limit(50).all()


def marcar_leida(notificacion_id: int, db: Session) -> None:
    n = db.query(Notificacion).filter(Notificacion.id == notificacion_id).first()
    if n:
        n.leida = True
        db.commit()


def verificar_y_notificar_stock(db: Session) -> None:
    productos = db.query(Producto).filter(Producto.maneja_inventario.is_(True), Producto.activo.is_(True), Producto.stock_actual <= Producto.stock_minimo).all()
    for p in productos:
        existe = db.query(Notificacion).filter(
            Notificacion.tipo == "STOCK_MINIMO", Notificacion.referencia_id == p.id, Notificacion.leida.is_(False)
        ).first()
        if not existe:
            crear_notificacion("STOCK_MINIMO", f"Stock bajo: {p.nombre}", f"Quedan {p.stock_actual} unidades. Stock minimo: {p.stock_minimo}", "ALTA", None, p.id, "producto", db)


def verificar_y_notificar_vencimientos(db: Session) -> None:
    hoy = date.today()
    lotes = db.query(Lote).filter(Lote.activo.is_(True), Lote.cantidad_actual > 0, Lote.fecha_vencimiento <= hoy.replace(day=hoy.day + 7)).all()
    for l in lotes:
        existe = db.query(Notificacion).filter(
            Notificacion.tipo == "VENCIMIENTO", Notificacion.referencia_id == l.id, Notificacion.leida.is_(False)
        ).first()
        if not existe:
            crear_notificacion("VENCIMIENTO", f"Lote proximo a vencer: {l.codigo_lote}", f"Vence {l.fecha_vencimiento}, cantidad: {l.cantidad_actual}", "ALTA", None, l.id, "lote", db)


def verificar_facturas_sri_pendientes(db: Session) -> None:
    facturas = db.query(Factura).filter(Factura.sri_estado.in_(["PENDIENTE", "CONTINGENCIA"])).limit(20).all()
    for f in facturas:
        crear_notificacion("SRI_ERROR", f"Factura pendiente SRI: {f.numero_comprobante}", f"Estado: {f.sri_estado}", "MEDIA", None, f.id, "factura", db)
