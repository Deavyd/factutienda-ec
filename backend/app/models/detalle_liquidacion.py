from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DetalleLiquidacion(Base):
    __tablename__ = "detalle_liquidaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    liquidacion_id: Mapped[int] = mapped_column(ForeignKey("liquidaciones_compra.id"), nullable=False, index=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unidad: Mapped[str] = mapped_column(String(50), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    descuento: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    iva: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)

    liquidacion: Mapped["LiquidacionCompra"] = relationship(back_populates="detalles")
