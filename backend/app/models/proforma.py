from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Proforma(Base, TimestampMixin):
    __tablename__ = "proformas"

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False, index=True)
    numero: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_validez: Mapped[date] = mapped_column(Date, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    iva_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(15), default="PENDIENTE", nullable=False)
    observacion: Mapped[str | None] = mapped_column(String(500), nullable=True)

    detalles: Mapped[list["DetalleProforma"]] = relationship(back_populates="proforma", cascade="all, delete-orphan")
