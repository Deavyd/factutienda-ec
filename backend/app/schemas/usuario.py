from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UsuarioCreate(BaseModel):
    empresa_id: int
    establecimiento_id: int | None = None
    username: str
    email: EmailStr
    password: str
    nombres: str
    apellidos: str
    rol: str = "CAJERO"
    activo: bool = True


class UsuarioUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    nombres: str | None = None
    apellidos: str | None = None
    rol: str | None = None
    establecimiento_id: int | None = None
    activo: bool | None = None


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    establecimiento_id: int | None
    username: str
    email: str
    nombres: str
    apellidos: str
    rol: str
    activo: bool
    ultimo_login: datetime | None
    created_at: datetime
    updated_at: datetime
