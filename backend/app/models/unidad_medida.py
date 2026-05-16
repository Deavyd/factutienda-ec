from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class UnidadMedida(Base, TimestampMixin):
    __tablename__ = "unidades_medida"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    abreviatura: Mapped[str] = mapped_column(String(12), nullable=False, unique=True, index=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    factor_conversion: Mapped[Decimal] = mapped_column(Numeric(14, 6), nullable=False, default=Decimal("1"))
    es_base: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
