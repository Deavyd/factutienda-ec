from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DetalleFacturaIn(BaseModel):
    producto_id: int
    cantidad: Decimal
    precio_unitario: Decimal
    descuento: Decimal = Decimal("0")
    iva_tarifa: Decimal = Decimal("12.00")


class DetalleFacturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    factura_id: int
    producto_id: int
    codigo_principal: str
    descripcion: str
    cantidad: Decimal
    precio_unitario: Decimal
    descuento: Decimal
    base_imponible: Decimal
    iva_tarifa: Decimal
    iva_valor: Decimal
    total_linea: Decimal


class FacturaCreate(BaseModel):
    empresa_id: int
    establecimiento_id: int
    punto_emision_id: int
    cliente_id: int
    fecha_emision: date
    detalles: list[DetalleFacturaIn]
    formas_pago: list[dict] | None = None
    lista_precio_id: int | None = None
    venta_credito: bool = False


class FacturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    establecimiento_id: int
    punto_emision_id: int
    usuario_id: int
    cliente_id: int
    fecha_emision: date
    secuencial: str
    numero_comprobante: str
    clave_acceso: str | None
    subtotal_sin_impuestos: Decimal
    subtotal_0: Decimal
    subtotal_12: Decimal
    descuento_total: Decimal
    iva_total: Decimal
    total: Decimal
    estado: str
    sri_estado: str
    sri_autorizacion: str | None
    created_at: datetime
    updated_at: datetime
    detalles: list[DetalleFacturaOut] = []
