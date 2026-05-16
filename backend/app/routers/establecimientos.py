from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.establecimiento import Establecimiento
from app.models.punto_emision import PuntoEmision
from app.models.usuario import Usuario
from app.schemas.establecimiento import (
    EstablecimientoCreate,
    EstablecimientoOut,
    EstablecimientoUpdate,
    PuntoEmisionCreate,
    PuntoEmisionOut,
    PuntoEmisionUpdate,
)

router = APIRouter(prefix="/establecimientos", tags=["establecimientos"])


@router.get("", response_model=list[EstablecimientoOut])
def list_establecimientos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[Establecimiento]:
    return db.query(Establecimiento).filter(Establecimiento.empresa_id == current_user.empresa_id).all()


@router.post("", response_model=EstablecimientoOut, status_code=status.HTTP_201_CREATED)
def create_establecimiento(
    payload: EstablecimientoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Establecimiento:
    if payload.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Empresa no autorizada")
    obj = Establecimiento(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{establecimiento_id}", response_model=EstablecimientoOut)
def update_establecimiento(
    establecimiento_id: int,
    payload: EstablecimientoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Establecimiento:
    obj = (
        db.query(Establecimiento)
        .filter(Establecimiento.id == establecimiento_id, Establecimiento.empresa_id == current_user.empresa_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{establecimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_establecimiento(
    establecimiento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    obj = (
        db.query(Establecimiento)
        .filter(Establecimiento.id == establecimiento_id, Establecimiento.empresa_id == current_user.empresa_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
    db.delete(obj)
    db.commit()


@router.get("/{establecimiento_id}/puntos-emision", response_model=list[PuntoEmisionOut])
def list_puntos_emision(
    establecimiento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[PuntoEmision]:
    est = (
        db.query(Establecimiento)
        .filter(Establecimiento.id == establecimiento_id, Establecimiento.empresa_id == current_user.empresa_id)
        .first()
    )
    if not est:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
    return db.query(PuntoEmision).filter(PuntoEmision.establecimiento_id == establecimiento_id).all()


@router.post("/puntos-emision", response_model=PuntoEmisionOut, status_code=status.HTTP_201_CREATED)
def create_punto_emision(
    payload: PuntoEmisionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> PuntoEmision:
    est = (
        db.query(Establecimiento)
        .filter(Establecimiento.id == payload.establecimiento_id, Establecimiento.empresa_id == current_user.empresa_id)
        .first()
    )
    if not est:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
    obj = PuntoEmision(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/puntos-emision/{punto_id}", response_model=PuntoEmisionOut)
def update_punto_emision(
    punto_id: int,
    payload: PuntoEmisionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> PuntoEmision:
    obj = db.query(PuntoEmision).filter(PuntoEmision.id == punto_id).first()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Punto de emision no encontrado")
    est = db.query(Establecimiento).filter(Establecimiento.id == obj.establecimiento_id).first()
    if not est or est.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/puntos-emision/{punto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_punto_emision(
    punto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    obj = db.query(PuntoEmision).filter(PuntoEmision.id == punto_id).first()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Punto de emision no encontrado")
    est = db.query(Establecimiento).filter(Establecimiento.id == obj.establecimiento_id).first()
    if not est or est.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    db.delete(obj)
    db.commit()
