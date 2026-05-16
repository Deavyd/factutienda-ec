from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_bodeguero
from app.models.lote import Lote
from app.models.usuario import Usuario
from app.services.lote_service import verificar_vencimientos_proximos

router = APIRouter(prefix="/lotes", tags=["lotes"])


class LoteIn(BaseModel):
    producto_id: int
    codigo_lote: str
    fecha_fabricacion: date
    fecha_vencimiento: date
    cantidad_inicial: Decimal
    costo_unitario: Decimal
    proveedor_id: int | None = None
    compra_id: int | None = None


class LoteAjuste(BaseModel):
    cantidad: Decimal


@router.get("")
def listar(
    producto_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_bodeguero),
):
    q = db.query(Lote).filter(Lote.activo.is_(True))
    if producto_id:
        q = q.filter(Lote.producto_id == producto_id)
    return q.order_by(Lote.fecha_vencimiento.asc()).all()


@router.post("")
def crear(payload: LoteIn, db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    l = Lote(
        producto_id=payload.producto_id,
        codigo_lote=payload.codigo_lote,
        fecha_fabricacion=payload.fecha_fabricacion,
        fecha_vencimiento=payload.fecha_vencimiento,
        cantidad_inicial=payload.cantidad_inicial,
        cantidad_actual=payload.cantidad_inicial,
        costo_unitario=payload.costo_unitario,
        proveedor_id=payload.proveedor_id,
        compra_id=payload.compra_id,
        activo=True,
    )
    db.add(l)
    db.commit()
    db.refresh(l)
    return l


@router.put("/{lote_id}")
def editar(lote_id: int, payload: LoteIn, db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    l = db.query(Lote).filter(Lote.id == lote_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    for k, v in payload.model_dump().items():
        setattr(l, k, v)
    db.commit()
    db.refresh(l)
    return l


@router.post("/{lote_id}/ajustar")
def ajustar(lote_id: int, payload: LoteAjuste, db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    l = db.query(Lote).filter(Lote.id == lote_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    l.cantidad_actual = payload.cantidad
    if l.cantidad_actual <= 0:
        l.activo = False
    db.commit()
    return {"id": l.id, "cantidad_actual": l.cantidad_actual}


@router.get("/proximos-vencer")
def proximos_vencer(dias: int = 30, db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    return verificar_vencimientos_proximos(db)


@router.get("/vencidos")
def vencidos(db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    return db.query(Lote).filter(Lote.activo.is_(True), Lote.fecha_vencimiento < date.today()).all()
