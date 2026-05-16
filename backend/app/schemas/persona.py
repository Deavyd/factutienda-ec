from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class PersonaBase(BaseModel):
    tipo: str
    tipo_identificacion: str
    identificacion: str
    razon_social: str
    nombre_comercial: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    email: EmailStr | None = None
    activo: bool = True


class PersonaCreate(PersonaBase):
    empresa_id: int


class PersonaUpdate(BaseModel):
    tipo: str | None = None
    tipo_identificacion: str | None = None
    identificacion: str | None = None
    razon_social: str | None = None
    nombre_comercial: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    email: EmailStr | None = None
    activo: bool | None = None


class PersonaOut(PersonaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    created_at: datetime
    updated_at: datetime
