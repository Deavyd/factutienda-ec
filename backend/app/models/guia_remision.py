from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class GuiaRemision(Base, TimestampMixin):
    __tablename__ = "guias_remision"

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    establecimiento_origen_id: Mapped[int] = mapped_column(ForeignKey("establecimientos.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)

    numero: Mapped[str] = mapped_column(String(17), nullable=False, index=True)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_inicio_transporte: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin_transporte: Mapped[date] = mapped_column(Date, nullable=False)

    transportista_ruc: Mapped[str] = mapped_column(String(13), nullable=False, index=True)
    transportista_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    placa_vehiculo: Mapped[str | None] = mapped_column(String(10), nullable=True)
    punto_partida: Mapped[str] = mapped_column(String(255), nullable=False)
    punto_llegada: Mapped[str] = mapped_column(String(255), nullable=False)
    motivo_traslado: Mapped[str] = mapped_column(String(20), nullable=False)

    establecimiento_destino_id: Mapped[int | None] = mapped_column(ForeignKey("establecimientos.id"), nullable=True, index=True)
    factura_id: Mapped[int | None] = mapped_column(ForeignKey("facturas.id"), nullable=True, index=True)

    clave_acceso: Mapped[str | None] = mapped_column(String(49), nullable=True)
    estado_sri: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    xml_autorizado: Mapped[str | None] = mapped_column(String(255), nullable=True)

    detalles: Mapped[list["DetalleGuia"]] = relationship(back_populates="guia", cascade="all, delete-orphan")
