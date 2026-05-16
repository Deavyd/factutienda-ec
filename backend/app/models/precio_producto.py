from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class PrecioProducto(Base, TimestampMixin):
    __tablename__ = "precios_producto"
    __table_args__ = (UniqueConstraint("producto_id", "lista_precio_id", name="uq_precio_producto_lista"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    lista_precio_id: Mapped[int] = mapped_column(ForeignKey("listas_precio.id"), nullable=False, index=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
