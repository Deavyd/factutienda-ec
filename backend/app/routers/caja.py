from __future__ import annotations

import base64
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_cajero
from app.models.movimiento_caja import MovimientoCaja
from app.models.turno_caja import TurnoCaja
from app.models.usuario import Usuario
from app.services.caja_service import calcular_arqueo, reporte_cierre_pdf, validar_turno_abierto

router = APIRouter(prefix="/caja", tags=["caja"])


class AbrirReq(BaseModel):
    punto_emision_id: int
    monto_apertura: Decimal


class CerrarReq(BaseModel):
    turno_id: int
    monto_cierre_real: Decimal
    observaciones: str | None = None


class MovReq(BaseModel):
    tipo: str
    monto: Decimal
    descripcion: str
    referencia_id: str | None = None


@router.post("/abrir")
def abrir(payload: AbrirReq, db: Session = Depends(get_db), user: Usuario = Depends(require_cajero)):
    exists = db.query(TurnoCaja).filter(TurnoCaja.usuario_id == user.id, TurnoCaja.estado == "ABIERTO").first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe turno abierto")
    turno = TurnoCaja(usuario_id=user.id, punto_emision_id=payload.punto_emision_id, fecha_apertura=datetime.now(timezone.utc), monto_apertura=payload.monto_apertura, estado="ABIERTO")
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return turno


@router.post("/cerrar")
def cerrar(payload: CerrarReq, db: Session = Depends(get_db), user: Usuario = Depends(require_cajero)):
    turno = db.query(TurnoCaja).filter(TurnoCaja.id == payload.turno_id, TurnoCaja.usuario_id == user.id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    turno.fecha_cierre = datetime.now(timezone.utc)
    turno.monto_cierre_real = payload.monto_cierre_real
    turno.observaciones = payload.observaciones
    turno.estado = "CERRADO"
    db.commit()
    arqueo = calcular_arqueo(turno.id, db)
    pdf = reporte_cierre_pdf(turno.id, db)
    return {"turno_id": turno.id, "arqueo": arqueo, "reporte_base64": base64.b64encode(pdf).decode("utf-8")}


@router.get("/turno-actual")
def turno_actual(db: Session = Depends(get_db), user: Usuario = Depends(require_cajero)):
    try:
        return validar_turno_abierto(user.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/arqueo/{turno_id}")
def arqueo(turno_id: int, db: Session = Depends(get_db), user: Usuario = Depends(require_cajero)):
    _ = user
    return calcular_arqueo(turno_id, db)


@router.post("/movimiento")
def movimiento(payload: MovReq, db: Session = Depends(get_db), user: Usuario = Depends(require_cajero)):
    try:
        turno = validar_turno_abierto(user.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if payload.tipo not in {"GASTO", "RETIRO", "DEPOSITO", "VENTA"}:
        raise HTTPException(status_code=400, detail="Tipo invalido")
    mov = MovimientoCaja(turno_caja_id=turno.id, tipo=payload.tipo, monto=payload.monto, descripcion=payload.descripcion, referencia_id=payload.referencia_id)
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@router.get("/turnos")
def historial_turnos(limit: int = 50, db: Session = Depends(get_db), user: Usuario = Depends(require_cajero)):
    rows = (
        db.query(TurnoCaja)
        .filter(TurnoCaja.usuario_id == user.id)
        .order_by(TurnoCaja.id.desc())
        .limit(limit)
        .all()
    )
    return rows
