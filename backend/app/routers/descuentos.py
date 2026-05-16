from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.descuento import Descuento
from app.models.usuario import Usuario
from app.services.precio_service import calcular_descuentos

router = APIRouter(prefix="/descuentos", tags=["descuentos"])


class DescuentoIn(BaseModel):
    nombre: str
    descripcion: str | None = None
    tipo: str
    valor: Decimal
    aplica_a: str
    producto_id: int | None = None
    cantidad_minima: Decimal = Decimal("0")
    fecha_inicio: date
    fecha_fin: date
    activo: bool = True
    acumulable: bool = False


@router.get("")
def listar(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(Descuento).order_by(Descuento.id.desc()).all()


@router.post("")
def crear(payload: DescuentoIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    d = Descuento(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/{descuento_id}")
def editar(descuento_id: int, payload: DescuentoIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    d = db.query(Descuento).filter(Descuento.id == descuento_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Descuento no encontrado")
    for k, v in payload.model_dump().items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{descuento_id}")
def eliminar(descuento_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    d = db.query(Descuento).filter(Descuento.id == descuento_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Descuento no encontrado")
    d.activo = False
    db.commit()
    return {"ok": True}


@router.get("/aplicables")
def aplicables(
    producto_id: int,
    cantidad: Decimal,
    total: Decimal = Query(alias="total"),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return calcular_descuentos(producto_id, cantidad, total, db)
