from __future__ import annotations

import base64
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_password_hash
from app.models.empresa import Empresa
from app.models.establecimiento import Establecimiento
from app.models.punto_emision import PuntoEmision
from app.models.usuario import Usuario
from app.services.setup_service import sistema_configurado, test_conexion_sri, validar_certificado_p12

router = APIRouter(prefix="/setup", tags=["setup"])


def _ensure_open_setup(db: Session) -> None:
    if sistema_configurado(db):
        raise HTTPException(status_code=403, detail="Sistema ya configurado")


class EmpresaReq(BaseModel):
    ruc: str
    razon_social: str
    nombre_comercial: str | None = None
    direccion: str


@router.get("/estado")
def estado(db: Session = Depends(get_db)) -> dict:
    return {"configurado": sistema_configurado(db), "pasos_completados": []}


@router.post("/empresa")
def setup_empresa(payload: EmpresaReq, db: Session = Depends(get_db)) -> dict:
    _ensure_open_setup(db)
    emp = Empresa(ruc=payload.ruc, razon_social=payload.razon_social, nombre_comercial=payload.nombre_comercial, direccion_matriz=payload.direccion, obligado_contabilidad=True, ambiente_sri=1, activo=True)
    db.add(emp)
    db.commit()
    return {"empresa_id": emp.id}


@router.post("/establecimiento")
def setup_establecimiento(payload: dict, db: Session = Depends(get_db)) -> dict:
    _ensure_open_setup(db)
    emp = db.query(Empresa).first()
    est = Establecimiento(empresa_id=emp.id, codigo=payload["codigo"], nombre=payload["nombre"], direccion=payload["direccion"], activo=True)
    db.add(est)
    db.commit()
    return {"establecimiento_id": est.id}


@router.post("/punto-emision")
def setup_punto(payload: dict, db: Session = Depends(get_db)) -> dict:
    _ensure_open_setup(db)
    p = PuntoEmision(establecimiento_id=payload["establecimiento_id"], codigo=payload["codigo"], descripcion=payload.get("descripcion"), activo=True, secuencial_factura=1, secuencial_nota_credito=1)
    db.add(p)
    db.commit()
    return {"punto_emision_id": p.id}


class AdminReq(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    confirmar_password: str


@router.post("/usuario-admin")
def setup_admin(payload: AdminReq, db: Session = Depends(get_db)) -> dict:
    _ensure_open_setup(db)
    if payload.password != payload.confirmar_password:
        raise HTTPException(status_code=400, detail="Password no coincide")
    emp = db.query(Empresa).first()
    est = db.query(Establecimiento).first()
    user = Usuario(
        empresa_id=emp.id,
        establecimiento_id=est.id if est else None,
        username=payload.email.split("@")[0],
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        nombres=payload.nombre,
        apellidos="",
        rol="SUPERADMIN",
        activo=True,
    )
    db.add(user)
    db.commit()
    return {"usuario_id": user.id}


@router.post("/firma-electronica")
def setup_firma(payload: dict, db: Session = Depends(get_db)) -> dict:
    _ = db
    p12_bytes = base64.b64decode(payload["p12_base64"])
    data = validar_certificado_p12(p12_bytes, payload["password"])
    out = Path("data/firma.p12")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(p12_bytes)
    return data


@router.post("/ambiente-sri")
def setup_ambiente(payload: dict, db: Session = Depends(get_db)) -> dict:
    emp = db.query(Empresa).first()
    if emp:
        emp.ambiente_sri = int(payload["ambiente"])
        db.commit()
    return {"ok": True}


@router.get("/test-sri")
def setup_test_sri(ambiente: str = "1", db: Session = Depends(get_db)) -> dict:
    _ = db
    return test_conexion_sri(ambiente)
