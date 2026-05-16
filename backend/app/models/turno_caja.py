from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TurnoCaja(Base, TimestampMixin):
    __tablename__ = "turnos_caja"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    punto_emision_id: Mapped[int] = mapped_column(ForeignKey("puntos_emision.id"), nullable=False, index=True)
    fecha_apertura: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    monto_apertura: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    monto_cierre_real: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    estado: Mapped[str] = mapped_column(String(10), default="ABIERTO", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(String(255), nullable=True)

    movimientos: Mapped[list["MovimientoCaja"]] = relationship(back_populates="turno", cascade="all, delete-orphan")
