from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CompraDetalleIn(BaseModel):
    producto_id: int
    cantidad: Decimal
    costo_unitario: Decimal


class CompraCreate(BaseModel):
    empresa_id: int
    proveedor_id: int
    fecha_emision: date
    detalles: list[CompraDetalleIn]


class CompraUpdate(BaseModel):
    proveedor_id: int | None = None
    fecha_emision: date | None = None


class CompraDetalleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    cantidad: Decimal
    costo_unitario: Decimal
    total_linea: Decimal


class CompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    proveedor_id: int
    usuario_id: int
    fecha_emision: date
    numero_documento: str
    subtotal: Decimal
    iva_total: Decimal
    total: Decimal
    estado: str
    created_at: datetime
    detalles: list[CompraDetalleOut] = []
