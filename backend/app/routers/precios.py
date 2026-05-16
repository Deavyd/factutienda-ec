from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.lista_precio import ListaPrecio
from app.models.precio_producto import PrecioProducto
from app.models.usuario import Usuario

router = APIRouter(prefix="/precios", tags=["precios"])


class ListaPrecioIn(BaseModel):
    nombre: str
    descripcion: str | None = None
    tipo_calculo: str
    valor: Decimal
    activo: bool = True
    es_default: bool = False


class PrecioProductoIn(BaseModel):
    lista_precio_id: int
    precio: Decimal
    activo: bool = True


@router.get("/listas-precio")
def listas(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(ListaPrecio).order_by(ListaPrecio.id.asc()).all()


@router.post("/listas-precio")
def crear_lista(payload: ListaPrecioIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    if payload.es_default:
        db.query(ListaPrecio).update({ListaPrecio.es_default: False})
    lp = ListaPrecio(**payload.model_dump())
    db.add(lp)
    db.commit()
    db.refresh(lp)
    return lp


@router.put("/listas-precio/{lista_id}")
def editar_lista(lista_id: int, payload: ListaPrecioIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    lp = db.query(ListaPrecio).filter(ListaPrecio.id == lista_id).first()
    if not lp:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    if payload.es_default:
        db.query(ListaPrecio).update({ListaPrecio.es_default: False})
    for k, v in payload.model_dump().items():
        setattr(lp, k, v)
    db.commit()
    db.refresh(lp)
    return lp


@router.post("/productos/{producto_id}/precios")
def asignar_precio(producto_id: int, payload: PrecioProductoIn, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    pp = db.query(PrecioProducto).filter(PrecioProducto.producto_id == producto_id, PrecioProducto.lista_precio_id == payload.lista_precio_id).first()
    if pp:
        pp.precio = payload.precio
        pp.activo = payload.activo
    else:
        pp = PrecioProducto(producto_id=producto_id, lista_precio_id=payload.lista_precio_id, precio=payload.precio, activo=payload.activo)
        db.add(pp)
    db.commit()
    db.refresh(pp)
    return pp


@router.get("/productos/{producto_id}/precios")
def ver_precios(producto_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(PrecioProducto).filter(PrecioProducto.producto_id == producto_id).all()
