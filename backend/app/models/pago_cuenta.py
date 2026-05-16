from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class PagoCuenta(Base, TimestampMixin):
    __tablename__ = "pagos_cuenta"

    id: Mapped[int] = mapped_column(primary_key=True)
    cuenta_id: Mapped[int] = mapped_column(nullable=False, index=True)
    tipo_cuenta: Mapped[str] = mapped_column(String(10), nullable=False)
    fecha_pago: Mapped[date] = mapped_column(Date, nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    forma_pago: Mapped[str] = mapped_column(String(30), nullable=False)
    referencia: Mapped[str | None] = mapped_column(String(120), nullable=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
