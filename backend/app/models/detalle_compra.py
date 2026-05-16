from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DetalleCompra(Base):
    __tablename__ = "detalle_compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    compra_id: Mapped[int] = mapped_column(ForeignKey("compras.id"), nullable=False, index=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    unidad_id: Mapped[int | None] = mapped_column(ForeignKey("unidades_medida.id"), nullable=True, index=True)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    cantidad_unidad_compra: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0"), nullable=False)
    cantidad_convertida_venta: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0"), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    total_linea: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    compra: Mapped["Compra"] = relationship(back_populates="detalles")
    producto: Mapped["Producto"] = relationship()
