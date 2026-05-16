from __future__ import annotations

from decimal import Decimal

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.retencion import Retencion

RETENCION_RENTA = {
    "HONORARIOS_PROFESIONALES": Decimal("10"),
    "SERVICIOS": Decimal("2"),
    "BIENES": Decimal("1"),
    "ARRENDAMIENTO": Decimal("8"),
}

RETENCION_IVA = {
    "SERVICIOS": Decimal("70"),
    "BIENES": Decimal("30"),
    "HONORARIOS": Decimal("100"),
    "LIQUIDACION_COMPRA": Decimal("100"),
}


def calcular_valor_retencion(base: Decimal, porcentaje: Decimal) -> Decimal:
    return (base * porcentaje) / Decimal("100")


def reporte_retenciones_mes(anio: int, mes: int, db: Session) -> dict:
    rows = (
        db.query(Retencion)
        .filter(extract("year", Retencion.fecha_emision) == anio)
        .filter(extract("month", Retencion.fecha_emision) == mes)
        .all()
    )
    total = sum((r.total_retenido for r in rows), Decimal("0"))
    return {"anio": anio, "mes": mes, "cantidad": len(rows), "total_retenido": total}
