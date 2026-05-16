from __future__ import annotations

import logging
from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.kardex import Kardex
from app.models.lote import Lote
from app.models.producto import Producto
from app.models.producto_compuesto import ProductoCompuesto

logger = logging.getLogger(__name__)


def get_lotes_disponibles(producto_id: int, db: Session) -> list[Lote]:
    hoy = date.today()
    return (
        db.query(Lote)
        .filter(
            Lote.producto_id == producto_id,
            Lote.activo.is_(True),
            Lote.cantidad_actual > 0,
            Lote.fecha_vencimiento >= hoy,
        )
        .order_by(Lote.fecha_vencimiento.asc())
        .all()
    )


def descontar_stock_lote(producto_id: int, cantidad: Decimal, db: Session) -> list[dict]:
    lotes = get_lotes_disponibles(producto_id, db)
    faltante = cantidad
    usados: list[dict] = []

    for l in lotes:
        if faltante <= 0:
            break
        tomado = min(l.cantidad_actual, faltante)
        l.cantidad_actual -= tomado
        faltante -= tomado
        usados.append({"lote_id": l.id, "codigo_lote": l.codigo_lote, "cantidad": tomado, "costo_unitario": l.costo_unitario})
        if l.cantidad_actual == 0:
            l.activo = False

    if faltante > 0:
        raise ValueError(f"Stock insuficiente en lotes para producto {producto_id}")
    return usados


def verificar_vencimientos_proximos(db: Session) -> list[dict]:
    hoy = date.today()
    productos = db.query(Producto).filter(Producto.maneja_lotes.is_(True), Producto.activo.is_(True)).all()
    alerts: list[dict] = []
    for p in productos:
        delta = p.dias_alerta_vencimiento
        limite = hoy.replace(day=1)
        from datetime import timedelta
        limite = hoy + timedelta(days=delta)
        lotes = (
            db.query(Lote)
            .filter(Lote.producto_id == p.id, Lote.activo.is_(True), Lote.cantidad_actual > 0, Lote.fecha_vencimiento <= limite)
            .all()
        )
        for l in lotes:
            alerts.append(
                {
                    "producto_id": p.id,
                    "producto": p.nombre,
                    "lote_id": l.id,
                    "codigo_lote": l.codigo_lote,
                    "cantidad_actual": l.cantidad_actual,
                    "fecha_vencimiento": l.fecha_vencimiento,
                    "dias_restantes": (l.fecha_vencimiento - hoy).days,
                }
            )
    return alerts


def calcular_costo_promedio_ponderado(producto_id: int, db: Session) -> Decimal:
    total_costo = db.query(func.sum(Lote.cantidad_actual * Lote.costo_unitario)).filter(Lote.producto_id == producto_id, Lote.activo.is_(True)).scalar() or 0
    total_cantidad = db.query(func.sum(Lote.cantidad_actual)).filter(Lote.producto_id == producto_id, Lote.activo.is_(True)).scalar() or 0
    if total_cantidad == 0:
        return Decimal("0")
    return Decimal(str(total_costo)) / Decimal(str(total_cantidad))


def descontar_componentes_combo(producto_compuesto_id: int, cantidad: Decimal, db: Session) -> None:
    componentes = db.query(ProductoCompuesto).filter(ProductoCompuesto.producto_padre_id == producto_compuesto_id).all()
    for c in componentes:
        total_necesario = c.cantidad * cantidad
        prod = db.query(Producto).filter(Producto.id == c.producto_hijo_id).first()
        if not prod:
            raise ValueError(f"Componente {c.producto_hijo_id} no encontrado")
        if prod.maneja_lotes:
            descontar_stock_lote(prod.id, total_necesario, db)
        else:
            if prod.stock_en_unidad_venta < total_necesario:
                raise ValueError(f"Stock insuficiente de {prod.nombre} para combo")
            prod.stock_en_unidad_venta -= total_necesario
            prod.stock_actual = prod.stock_en_unidad_venta
        db.add(
            Kardex(
                producto_id=prod.id,
                tipo_movimiento="AJUSTE",
                origen="COMBO",
                documento_referencia=f"COMBO-{producto_compuesto_id}",
                cantidad=total_necesario,
                costo_unitario=prod.costo_promedio,
                saldo_anterior=prod.stock_en_unidad_venta + total_necesario if not prod.maneja_lotes else Decimal("0"),
                saldo_nuevo=prod.stock_en_unidad_venta,
            )
        )
