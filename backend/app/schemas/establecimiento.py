from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EstablecimientoBase(BaseModel):
    codigo: str
    nombre: str
    direccion: str
    telefono: str | None = None
    activo: bool = True


class EstablecimientoCreate(EstablecimientoBase):
    empresa_id: int


class EstablecimientoUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    activo: bool | None = None


class EstablecimientoOut(EstablecimientoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    created_at: datetime
    updated_at: datetime


class PuntoEmisionBase(BaseModel):
    codigo: str
    descripcion: str | None = None
    secuencial_factura: int = 1
    secuencial_nota_credito: int = 1
    activo: bool = True


class PuntoEmisionCreate(PuntoEmisionBase):
    establecimiento_id: int


class PuntoEmisionUpdate(BaseModel):
    codigo: str | None = None
    descripcion: str | None = None
    secuencial_factura: int | None = None
    secuencial_nota_credito: int | None = None
    activo: bool | None = None


class PuntoEmisionOut(PuntoEmisionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    establecimiento_id: int
    created_at: datetime
    updated_at: datetime
