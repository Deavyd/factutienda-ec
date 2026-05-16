from __future__ import annotations

from datetime import date
from decimal import Decimal
import logging

from sqlalchemy.orm import Session

from app.exceptions import StockInsuficienteError
from app.models.kardex import Kardex
from app.models.producto import Producto

logger = logging.getLogger(__name__)


def verificar_stock_disponible(producto_id: int, cantidad: Decimal, db: Session) -> bool:
    logger.debug("Verificando stock producto=%s cantidad=%s", producto_id, cantidad)
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    return bool(producto and (not producto.maneja_inventario or producto.stock_en_unidad_venta >= cantidad))


def registrar_kardex(
    producto_id: int,
    tipo: str,
    cantidad: Decimal,
    costo: Decimal,
    referencia: str,
    db: Session,
) -> None:
    logger.info("Registrando kardex producto=%s tipo=%s cantidad=%s", producto_id, tipo, cantidad)
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise ValueError("Producto no encontrado")

    saldo_anterior = producto.stock_en_unidad_venta
    if tipo in {"VENTA", "AJUSTE"}:
        producto.stock_en_unidad_venta -= cantidad
    else:
        producto.stock_en_unidad_venta += cantidad
    producto.stock_actual = producto.stock_en_unidad_venta

    db.add(
        Kardex(
            producto_id=producto_id,
            tipo_movimiento=tipo,
            origen=tipo,
            documento_referencia=referencia,
            cantidad=cantidad,
            unidad_id=producto.unidad_venta_id,
            cantidad_en_unidad_venta=cantidad,
            costo_unitario=costo,
            saldo_anterior=saldo_anterior,
            saldo_nuevo=producto.stock_en_unidad_venta,
        )
    )


def descontar_stock(detalle_factura: list[dict], db: Session) -> None:
    logger.info("Descontando stock para %s items", len(detalle_factura))
    for item in detalle_factura:
        producto_id = int(item["producto_id"])
        cantidad = Decimal(str(item["cantidad"]))
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        assert producto is not None
        if producto.maneja_lotes:
            from app.services.lote_service import descontar_stock_lote
            descontar_stock_lote(producto_id, cantidad, db)
            producto.stock_en_unidad_venta -= cantidad
            producto.stock_actual = producto.stock_en_unidad_venta
            costo_prom = producto.costo_promedio or Decimal("0")
        else:
            if not verificar_stock_disponible(producto_id, cantidad, db):
                raise StockInsuficienteError(f"Stock insuficiente para producto {producto_id}")
            registrar_kardex(producto_id, "VENTA", cantidad, producto.costo_promedio, "FACTURA", db)
        if producto.tipo_producto == "COMPUESTO":
            from app.services.lote_service import descontar_componentes_combo
            descontar_componentes_combo(producto_id, cantidad, db)


def get_kardex_producto(producto_id: int, fecha_inicio: date, fecha_fin: date, db: Session) -> list[Kardex]:
    logger.debug("Consultando kardex producto=%s rango=%s..%s", producto_id, fecha_inicio, fecha_fin)
    return (
        db.query(Kardex)
        .filter(Kardex.producto_id == producto_id)
        .filter(Kardex.created_at >= fecha_inicio)
        .filter(Kardex.created_at <= fecha_fin)
        .order_by(Kardex.created_at.asc())
        .all()
    )


def alertas_stock_minimo(db: Session) -> list[Producto]:
    logger.debug("Consultando alertas de stock minimo")
    return (
        db.query(Producto)
        .filter(Producto.maneja_inventario.is_(True))
        .filter(Producto.stock_actual <= Producto.stock_minimo)
        .all()
    )
