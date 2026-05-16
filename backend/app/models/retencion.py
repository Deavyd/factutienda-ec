from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Retencion(Base, TimestampMixin):
    __tablename__ = "retenciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"), nullable=False, index=True)
    numero_retencion: Mapped[str] = mapped_column(String(25), nullable=False, index=True)
    tipo_identificacion_agente: Mapped[str] = mapped_column(String(5), nullable=False)
    identificacion_agente: Mapped[str] = mapped_column(String(20), nullable=False)
    razon_social_agente: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    detalles: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    total_retenido: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(15), default="REGISTRADA", nullable=False)
    archivo_xml: Mapped[str | None] = mapped_column(String(255), nullable=True)

    factura: Mapped["Factura"] = relationship()
