from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class MovimientoCaja(Base, TimestampMixin):
    __tablename__ = "movimientos_caja"

    id: Mapped[int] = mapped_column(primary_key=True)
    turno_caja_id: Mapped[int] = mapped_column(ForeignKey("turnos_caja.id"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(12), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    referencia_id: Mapped[str | None] = mapped_column(String(60), nullable=True)

    turno: Mapped["TurnoCaja"] = relationship(back_populates="movimientos")
