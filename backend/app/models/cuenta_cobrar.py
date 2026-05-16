from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class CuentaCobrar(Base, TimestampMixin):
    __tablename__ = "cuentas_cobrar"

    id: Mapped[int] = mapped_column(primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False, index=True)
    monto_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    monto_pagado: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    monto_pendiente: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fecha_vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(15), default="PENDIENTE", nullable=False)
