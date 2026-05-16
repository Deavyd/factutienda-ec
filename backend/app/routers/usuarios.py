from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_superadmin
from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=list[UsuarioOut])
def listar(db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    return db.query(Usuario).order_by(Usuario.id.asc()).all()


@router.get("/{uid}", response_model=UsuarioOut)
def get(uid: int, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    u = db.query(Usuario).filter(Usuario.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return u


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear(payload: UsuarioCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    data = payload.model_dump()
    data["password_hash"] = get_password_hash(data.pop("password"))
    u = Usuario(**data)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.put("/{uid}", response_model=UsuarioOut)
def editar(uid: int, payload: UsuarioUpdate, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    u = db.query(Usuario).filter(Usuario.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        data["password_hash"] = get_password_hash(data.pop("password"))
    for k, v in data.items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(uid: int, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)):
    u = db.query(Usuario).filter(Usuario.id == uid).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u.activo = False
    db.commit()
