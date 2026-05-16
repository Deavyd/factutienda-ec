from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.cuenta_cobrar import CuentaCobrar
from app.models.cuenta_pagar import CuentaPagar
from app.models.pago_cuenta import PagoCuenta
from app.models.usuario import Usuario

router = APIRouter(prefix="/cuentas", tags=["cuentas"])


class AbonoReq(BaseModel):
    monto: Decimal
    forma_pago: str
    referencia: str | None = None


@router.get("/cobrar")
def cuentas_cobrar(vencidas: bool = False, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    q = db.query(CuentaCobrar)
    if vencidas:
        q = q.filter(CuentaCobrar.fecha_vencimiento < date.today())
    return q.all()


@router.get("/pagar")
def cuentas_pagar(vencidas: bool = False, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    q = db.query(CuentaPagar)
    if vencidas:
        q = q.filter(CuentaPagar.fecha_vencimiento < date.today())
    return q.all()


@router.post("/cobrar/{cuenta_id}/pagar")
def pagar_cobrar(cuenta_id: int, payload: AbonoReq, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    c = db.query(CuentaCobrar).filter(CuentaCobrar.id == cuenta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    if payload.monto > c.monto_pendiente:
        raise HTTPException(status_code=400, detail="Abono excede pendiente")
    c.monto_pagado += payload.monto
    c.monto_pendiente -= payload.monto
    c.estado = "PAGADA" if c.monto_pendiente == 0 else "PARCIAL"
    db.add(PagoCuenta(cuenta_id=cuenta_id, tipo_cuenta="COBRAR", fecha_pago=date.today(), monto=payload.monto, forma_pago=payload.forma_pago, referencia=payload.referencia, usuario_id=user.id))
    db.commit()
    return {"id": c.id, "estado": c.estado, "pendiente": c.monto_pendiente}


@router.post("/pagar/{cuenta_id}/pagar")
def pagar_pagar(cuenta_id: int, payload: AbonoReq, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    c = db.query(CuentaPagar).filter(CuentaPagar.id == cuenta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    if payload.monto > c.monto_pendiente:
        raise HTTPException(status_code=400, detail="Abono excede pendiente")
    c.monto_pagado += payload.monto
    c.monto_pendiente -= payload.monto
    c.estado = "PAGADA" if c.monto_pendiente == 0 else "PARCIAL"
    db.add(PagoCuenta(cuenta_id=cuenta_id, tipo_cuenta="PAGAR", fecha_pago=date.today(), monto=payload.monto, forma_pago=payload.forma_pago, referencia=payload.referencia, usuario_id=user.id))
    db.commit()
    return {"id": c.id, "estado": c.estado, "pendiente": c.monto_pendiente}


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    total_cobrar = sum((c.monto_pendiente for c in db.query(CuentaCobrar).all()), Decimal("0"))
    total_pagar = sum((c.monto_pendiente for c in db.query(CuentaPagar).all()), Decimal("0"))
    vencido_cobrar = sum((c.monto_pendiente for c in db.query(CuentaCobrar).filter(CuentaCobrar.fecha_vencimiento < date.today()).all()), Decimal("0"))
    vencido_pagar = sum((c.monto_pendiente for c in db.query(CuentaPagar).filter(CuentaPagar.fecha_vencimiento < date.today()).all()), Decimal("0"))
    return {
        "total_por_cobrar": total_cobrar,
        "total_por_pagar": total_pagar,
        "vencido_cobrar": vencido_cobrar,
        "vencido_pagar": vencido_pagar,
    }
