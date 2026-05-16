from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_admin
from app.models.unidad_medida import UnidadMedida
from app.models.usuario import Usuario
from app.services.conversion_service import convertir_cantidad

router = APIRouter(prefix="/unidades", tags=["unidades"])


class UnidadIn(BaseModel):
    nombre: str
    abreviatura: str
    tipo: str
    factor_conversion: Decimal
    es_base: bool = False
    activo: bool = True


class ConvReq(BaseModel):
    cantidad: Decimal
    unidad_origen_id: int
    unidad_destino_id: int


@router.get("")
def listar(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return db.query(UnidadMedida).filter(UnidadMedida.activo.is_(True)).all()


@router.get("/tipos")
def tipos(_: Usuario = Depends(get_current_user)):
    return ["PESO", "VOLUMEN", "LONGITUD", "UNIDAD"]


@router.get("/{unidad_id}")
def get_unidad(unidad_id: int, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    u = db.query(UnidadMedida).filter(UnidadMedida.id == unidad_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    return u


@router.post("")
def crear(payload: UnidadIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    u = UnidadMedida(**payload.model_dump())
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.put("/{unidad_id}")
def editar(unidad_id: int, payload: UnidadIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    u = db.query(UnidadMedida).filter(UnidadMedida.id == unidad_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    for k, v in payload.model_dump().items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{unidad_id}")
def desactivar(unidad_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    u = db.query(UnidadMedida).filter(UnidadMedida.id == unidad_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    u.activo = False
    db.commit()
    return {"ok": True}


@router.post("/convertir")
def convertir(payload: ConvReq, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return {"cantidad_convertida": convertir_cantidad(payload.cantidad, payload.unidad_origen_id, payload.unidad_destino_id, db)}
