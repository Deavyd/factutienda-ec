from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.persona import Persona
from app.models.usuario import Usuario
from app.schemas.persona import PersonaCreate, PersonaOut, PersonaUpdate

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("", response_model=list[PersonaOut])
def list_personas(
    tipo: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[Persona]:
    query = db.query(Persona).filter(Persona.empresa_id == current_user.empresa_id)
    if tipo:
        query = query.filter(Persona.tipo == tipo)
    return query.all()


@router.get("/{persona_id}", response_model=PersonaOut)
def get_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Persona:
    persona = db.query(Persona).filter(Persona.id == persona_id, Persona.empresa_id == current_user.empresa_id).first()
    if not persona:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona no encontrada")
    return persona


@router.post("", response_model=PersonaOut, status_code=status.HTTP_201_CREATED)
def create_persona(
    payload: PersonaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Persona:
    if payload.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Empresa no autorizada")

    persona = Persona(**payload.model_dump())
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.put("/{persona_id}", response_model=PersonaOut)
def update_persona(
    persona_id: int,
    payload: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Persona:
    persona = db.query(Persona).filter(Persona.id == persona_id, Persona.empresa_id == current_user.empresa_id).first()
    if not persona:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona no encontrada")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(persona, key, value)

    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    persona = db.query(Persona).filter(Persona.id == persona_id, Persona.empresa_id == current_user.empresa_id).first()
    if not persona:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona no encontrada")

    db.delete(persona)
    db.commit()
