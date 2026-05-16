from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_superadmin
from app.models.tarifa_iva import TarifaIva
from app.models.usuario import Usuario

router = APIRouter(prefix="/tarifas-iva", tags=["tarifas-iva"])


class TarifaIn(BaseModel):
    nombre: str
    porcentaje: Decimal
    codigo_sri: str
    descripcion: str | None = None
    activo: bool = True
    fecha_vigencia_desde: date
    fecha_vigencia_hasta: date | None = None
    es_default: bool = False


@router.get("")
def listar(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return db.query(TarifaIva).order_by(TarifaIva.id.asc()).all()


@router.post("")
def crear(payload: TarifaIn, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    if payload.es_default:
        db.query(TarifaIva).update({TarifaIva.es_default: False})
    t = TarifaIva(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.put("/{tarifa_id}")
def editar(tarifa_id: int, payload: TarifaIn, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    t = db.query(TarifaIva).filter(TarifaIva.id == tarifa_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    if payload.es_default:
        db.query(TarifaIva).update({TarifaIva.es_default: False})
    for k, v in payload.model_dump().items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.put("/{tarifa_id}/default")
def marcar_default(tarifa_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    t = db.query(TarifaIva).filter(TarifaIva.id == tarifa_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    db.query(TarifaIva).update({TarifaIva.es_default: False})
    t.es_default = True
    db.commit()
    return {"id": tarifa_id, "es_default": True}
