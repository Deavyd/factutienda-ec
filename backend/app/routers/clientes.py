from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_admin
from app.models.persona import Persona
from app.models.usuario import Usuario
from app.schemas.persona import PersonaCreate, PersonaOut, PersonaUpdate

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[PersonaOut])
def listar(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    return db.query(Persona).filter(Persona.empresa_id == user.empresa_id, Persona.tipo.in_(["cliente", "ambos"])).order_by(Persona.razon_social.asc()).all()


@router.get("/{pid}", response_model=PersonaOut)
def get(pid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    p = db.query(Persona).filter(Persona.id == pid, Persona.empresa_id == user.empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return p


@router.post("", response_model=PersonaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: PersonaCreate, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    if payload.empresa_id != user.empresa_id:
        raise HTTPException(status_code=403, detail="Empresa no autorizada")
    data = payload.model_dump()
    data.setdefault("tipo", "cliente")
    p = Persona(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{pid}", response_model=PersonaOut)
def editar(pid: int, payload: PersonaUpdate, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    p = db.query(Persona).filter(Persona.id == pid, Persona.empresa_id == user.empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{pid}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(pid: int, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    p = db.query(Persona).filter(Persona.id == pid, Persona.empresa_id == user.empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(p)
    db.commit()
