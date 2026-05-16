from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class LiquidacionCompra(Base, TimestampMixin):
    __tablename__ = "liquidaciones_compra"

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    establecimiento_id: Mapped[int] = mapped_column(ForeignKey("establecimientos.id"), nullable=False, index=True)
    punto_emision_id: Mapped[int] = mapped_column(ForeignKey("puntos_emision.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)

    numero: Mapped[str] = mapped_column(String(17), nullable=False, index=True)
    proveedor_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    proveedor_cedula: Mapped[str] = mapped_column(String(13), nullable=False, index=True)
    proveedor_direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)

    subtotal_0: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    subtotal_15: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    iva: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    clave_acceso: Mapped[str | None] = mapped_column(String(49), nullable=True)
    estado_sri: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    xml_autorizado: Mapped[str | None] = mapped_column(String(255), nullable=True)
    numero_autorizacion: Mapped[str | None] = mapped_column(String(80), nullable=True)

    detalles: Mapped[list["DetalleLiquidacion"]] = relationship(back_populates="liquidacion", cascade="all, delete-orphan")
