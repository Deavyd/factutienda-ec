from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ProductoCompuesto(Base, TimestampMixin):
    __tablename__ = "productos_compuestos"
    __table_args__ = (UniqueConstraint("producto_padre_id", "producto_hijo_id", name="uq_compuesto_padre_hijo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_padre_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    producto_hijo_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unidad_id: Mapped[int | None] = mapped_column(ForeignKey("unidades_medida.id"), nullable=True, index=True)
