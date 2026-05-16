from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_admin
from app.models.categoria_producto import CategoriaProducto
from app.models.usuario import Usuario

router = APIRouter(prefix="/categorias", tags=["categorias"])


class CategoriaIn(BaseModel):
    nombre: str
    descripcion: str | None = None
    activo: bool = True


class CategoriaUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    activo: bool | None = None


@router.get("")
def listar(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    return db.query(CategoriaProducto).filter(CategoriaProducto.empresa_id == user.empresa_id).order_by(CategoriaProducto.nombre.asc()).all()


@router.get("/{cid}")
def get(cid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    c = db.query(CategoriaProducto).filter(CategoriaProducto.id == cid, CategoriaProducto.empresa_id == user.empresa_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return c


@router.post("", status_code=status.HTTP_201_CREATED)
def crear(payload: CategoriaIn, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    c = CategoriaProducto(empresa_id=user.empresa_id, **payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/{cid}")
def editar(cid: int, payload: CategoriaUpdate, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    c = db.query(CategoriaProducto).filter(CategoriaProducto.id == cid, CategoriaProducto.empresa_id == user.empresa_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{cid}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(cid: int, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    c = db.query(CategoriaProducto).filter(CategoriaProducto.id == cid, CategoriaProducto.empresa_id == user.empresa_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    db.delete(c)
    db.commit()
