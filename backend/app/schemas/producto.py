from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductoBase(BaseModel):
    codigo_interno: str
    codigo_auxiliar: str | None = None
    codigo_barras: str | None = None
    nombre: str
    descripcion: str | None = None
    precio_sin_iva: Decimal
    tarifa_iva_id: int | None = None
    incluye_iva: bool = False
    tiene_ice: bool = False
    tarifa_ice: Decimal = Decimal("0")
    valor_ice_unitario: Decimal = Decimal("0")
    unidad_compra_id: int | None = None
    unidad_venta_id: int | None = None
    factor_conversion: Decimal = Decimal("1")
    precio_compra: Decimal = Decimal("0")
    precio_venta: Decimal = Decimal("0")
    costo_unitario_venta: Decimal = Decimal("0")
    margen_ganancia: Decimal = Decimal("0")
    stock_en_unidad_venta: Decimal = Decimal("0")
    costo_promedio: Decimal = Decimal("0")
    stock_actual: Decimal = Decimal("0")
    stock_minimo: Decimal = Decimal("0")
    maneja_inventario: bool = True
    maneja_lotes: bool = False
    dias_alerta_vencimiento: int = 30
    tipo_producto: str = "SIMPLE"
    activo: bool = True


class ProductoCreate(ProductoBase):
    empresa_id: int


class ProductoUpdate(BaseModel):
    codigo_interno: str | None = None
    codigo_auxiliar: str | None = None
    codigo_barras: str | None = None
    nombre: str | None = None
    descripcion: str | None = None
    precio_sin_iva: Decimal | None = None
    tarifa_iva_id: int | None = None
    incluye_iva: bool | None = None
    tiene_ice: bool | None = None
    tarifa_ice: Decimal | None = None
    valor_ice_unitario: Decimal | None = None
    unidad_compra_id: int | None = None
    unidad_venta_id: int | None = None
    factor_conversion: Decimal | None = None
    precio_compra: Decimal | None = None
    precio_venta: Decimal | None = None
    costo_unitario_venta: Decimal | None = None
    margen_ganancia: Decimal | None = None
    stock_en_unidad_venta: Decimal | None = None
    costo_promedio: Decimal | None = None
    stock_actual: Decimal | None = None
    stock_minimo: Decimal | None = None
    maneja_inventario: bool | None = None
    maneja_lotes: bool | None = None
    dias_alerta_vencimiento: int | None = None
    tipo_producto: str | None = None
    activo: bool | None = None


class ProductoOut(ProductoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    unidad_compra: dict | None = None
    unidad_venta: dict | None = None
    stock_en_unidad_compra: Decimal | None = None
    created_at: datetime
    updated_at: datetime
