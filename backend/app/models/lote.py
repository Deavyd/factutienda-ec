from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Lote(Base, TimestampMixin):
    __tablename__ = "lotes"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    codigo_lote: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    fecha_fabricacion: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    cantidad_inicial: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    cantidad_actual: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("personas.id"), nullable=True, index=True)
    compra_id: Mapped[int | None] = mapped_column(ForeignKey("compras.id"), nullable=True, index=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alertado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
