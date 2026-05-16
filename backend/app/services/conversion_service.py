from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.kardex import Kardex
from app.models.producto import Producto
from app.models.unidad_medida import UnidadMedida


def convertir_cantidad(cantidad: Decimal, unidad_origen_id: int, unidad_destino_id: int, db: Session) -> Decimal:
    origen = db.query(UnidadMedida).filter(UnidadMedida.id == unidad_origen_id, UnidadMedida.activo.is_(True)).first()
    destino = db.query(UnidadMedida).filter(UnidadMedida.id == unidad_destino_id, UnidadMedida.activo.is_(True)).first()
    if not origen or not destino:
        raise ValueError("Unidad no encontrada")
    if origen.tipo != destino.tipo:
        raise ValueError("No se puede convertir unidades de tipos distintos")
    base = cantidad * origen.factor_conversion
    return base / destino.factor_conversion


def calcular_costo_unitario_venta(precio_compra: Decimal, factor_conversion: Decimal) -> Decimal:
    if factor_conversion == 0:
        raise ValueError("factor_conversion no puede ser cero")
    return precio_compra / factor_conversion


def calcular_margen(precio_venta: Decimal, costo_unitario: Decimal) -> Decimal:
    if costo_unitario == 0:
        return Decimal("0")
    return ((precio_venta - costo_unitario) / costo_unitario) * Decimal("100")


def calcular_precio_venta_sugerido(costo_unitario: Decimal, margen_deseado: Decimal) -> Decimal:
    return costo_unitario * (Decimal("1") + (margen_deseado / Decimal("100")))


def stock_en_unidad_compra(stock_venta: Decimal, factor_conversion: Decimal) -> Decimal:
    if factor_conversion == 0:
        raise ValueError("factor_conversion no puede ser cero")
    return stock_venta / factor_conversion


def actualizar_stock_por_compra(producto_id: int, cantidad_comprada: Decimal, unidad_compra_id: int, db: Session) -> Decimal:
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise ValueError("Producto no encontrado")
    if not producto.unidad_venta_id:
        raise ValueError("Producto sin unidad de venta")
    cantidad_venta = convertir_cantidad(cantidad_comprada, unidad_compra_id, producto.unidad_venta_id, db)
    producto.stock_en_unidad_venta += cantidad_venta
    producto.stock_actual = producto.stock_en_unidad_venta
    db.add(
        Kardex(
            producto_id=producto.id,
            unidad_id=producto.unidad_venta_id,
            tipo_movimiento="AJUSTE",
            origen="COMPRA",
            documento_referencia="COMPRA",
            cantidad=cantidad_venta,
            cantidad_en_unidad_venta=cantidad_venta,
            costo_unitario=producto.costo_promedio,
            saldo_anterior=producto.stock_en_unidad_venta - cantidad_venta,
            saldo_nuevo=producto.stock_en_unidad_venta,
        )
    )
    return cantidad_venta
