from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class TarifaIva(Base, TimestampMixin):
    __tablename__ = "tarifas_iva"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    codigo_sri: Mapped[str] = mapped_column(String(5), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_vigencia_desde: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_vigencia_hasta: Mapped[date | None] = mapped_column(Date, nullable=True)
    es_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
