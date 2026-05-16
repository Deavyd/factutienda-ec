from __future__ import annotations

import io
from decimal import Decimal

from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.models.movimiento_caja import MovimientoCaja
from app.models.turno_caja import TurnoCaja


def validar_turno_abierto(usuario_id: int, db: Session) -> TurnoCaja:
    turno = db.query(TurnoCaja).filter(TurnoCaja.usuario_id == usuario_id, TurnoCaja.estado == "ABIERTO").first()
    if not turno:
        raise ValueError("No hay turno abierto")
    return turno


def calcular_arqueo(turno_id: int, db: Session) -> dict:
    turno = db.query(TurnoCaja).filter(TurnoCaja.id == turno_id).first()
    if not turno:
        raise ValueError("Turno no encontrado")
    movs = db.query(MovimientoCaja).filter(MovimientoCaja.turno_caja_id == turno_id).all()
    ventas = sum((m.monto for m in movs if m.tipo == "VENTA"), Decimal("0"))
    gastos = sum((m.monto for m in movs if m.tipo in {"GASTO", "RETIRO"}), Decimal("0"))
    deps = sum((m.monto for m in movs if m.tipo == "DEPOSITO"), Decimal("0"))
    esperado = turno.monto_apertura + ventas + deps - gastos
    real = turno.monto_cierre_real or Decimal("0")
    return {
        "ventas_efectivo": ventas,
        "ventas_tarjeta": Decimal("0"),
        "total_esperado": esperado,
        "total_real": real,
        "diferencia": real - esperado if turno.monto_cierre_real is not None else Decimal("0"),
    }


def reporte_cierre_pdf(turno_id: int, db: Session) -> bytes:
    data = calcular_arqueo(turno_id, db)
    out = io.BytesIO()
    c = canvas.Canvas(out)
    c.drawString(40, 800, f"Cierre de caja turno {turno_id}")
    y = 770
    for k, v in data.items():
        c.drawString(40, y, f"{k}: {v}")
        y -= 20
    c.save()
    return out.getvalue()
