from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class FormaPagoFactura(Base, TimestampMixin):
    __tablename__ = "formas_pago_factura"

    id: Mapped[int] = mapped_column(primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(25), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    referencia: Mapped[str | None] = mapped_column(String(120), nullable=True)

    factura: Mapped["Factura"] = relationship()
