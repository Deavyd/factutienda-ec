from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ListaPrecio(Base, TimestampMixin):
    __tablename__ = "listas_precio"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_calculo: Mapped[str] = mapped_column(String(30), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    es_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
