from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class NotaCredito(Base, TimestampMixin):
    __tablename__ = "notas_credito"
    __table_args__ = (
        UniqueConstraint(
            "establecimiento_id",
            "punto_emision_id",
            "secuencial",
            name="uq_nota_credito_secuencial",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    establecimiento_id: Mapped[int] = mapped_column(
        ForeignKey("establecimientos.id"), nullable=False, index=True
    )
    punto_emision_id: Mapped[int] = mapped_column(ForeignKey("puntos_emision.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False, index=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"), nullable=False, index=True)

    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    secuencial: Mapped[str] = mapped_column(String(9), nullable=False)
    numero_comprobante: Mapped[str] = mapped_column(String(17), nullable=False)
    clave_acceso: Mapped[str | None] = mapped_column(String(49), nullable=True)
    motivo: Mapped[str] = mapped_column(String(300), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sri_estado: Mapped[str] = mapped_column(String(30), nullable=False, default="pendiente")

    empresa: Mapped["Empresa"] = relationship(back_populates="notas_credito")
    punto_emision: Mapped["PuntoEmision"] = relationship(back_populates="notas_credito")
    usuario: Mapped["Usuario"] = relationship(back_populates="notas_credito")
    cliente: Mapped["Persona"] = relationship(back_populates="notas_credito")
    factura: Mapped["Factura"] = relationship()
