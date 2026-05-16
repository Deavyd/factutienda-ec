from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

DIAS_ANULACION_SRI_LINEA = 90


class Factura(Base, TimestampMixin):
    __tablename__ = "facturas"
    __table_args__ = (
        UniqueConstraint("establecimiento_id", "punto_emision_id", "secuencial", name="uq_factura_secuencial"),
        Index("ix_facturas_fecha_emision", "fecha_emision"),
        Index("ix_facturas_clave_acceso", "clave_acceso"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    establecimiento_id: Mapped[int] = mapped_column(
        ForeignKey("establecimientos.id"), nullable=False, index=True
    )
    punto_emision_id: Mapped[int] = mapped_column(ForeignKey("puntos_emision.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False, index=True)

    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    secuencial: Mapped[str] = mapped_column(String(9), nullable=False)
    numero_comprobante: Mapped[str] = mapped_column(String(17), nullable=False, index=True)
    clave_acceso: Mapped[str | None] = mapped_column(String(49), nullable=True)

    subtotal_sin_impuestos: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal_0: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    subtotal_12: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    descuento_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    iva_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    ambiente_sri: Mapped[int] = mapped_column(nullable=False, default=2)
    guia_remision_numero: Mapped[str | None] = mapped_column(String(20), nullable=True)
    es_comercial_negociable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    propina_porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)
    propina_valor: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    codigo_error_sri: Mapped[str | None] = mapped_column(String(30), nullable=True)
    accion_requerida: Mapped[str | None] = mapped_column(String(120), nullable=True)
    requiere_intervencion_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    motivo_contingencia: Mapped[str | None] = mapped_column(String(30), nullable=True)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="borrador", index=True)
    sri_estado: Mapped[str] = mapped_column(String(30), nullable=False, default="pendiente", index=True)
    sri_autorizacion: Mapped[str | None] = mapped_column(String(80), nullable=True)
    fecha_limite_anulacion: Mapped[date | None] = mapped_column(Date, nullable=True)

    empresa: Mapped["Empresa"] = relationship(back_populates="facturas")
    establecimiento: Mapped["Establecimiento"] = relationship(back_populates="facturas")
    punto_emision: Mapped["PuntoEmision"] = relationship(back_populates="facturas")
    usuario: Mapped["Usuario"] = relationship(back_populates="facturas")
    cliente: Mapped["Persona"] = relationship(back_populates="facturas")
    detalles: Mapped[list["DetalleFactura"]] = relationship(
        back_populates="factura", cascade="all, delete-orphan"
    )

    @property
    def puede_anularse(self) -> bool:
        if self.cliente and self.cliente.identificacion == "9999999999999":
            return False
        referencia = self.fecha_limite_anulacion
        if referencia is None and self.fecha_emision:
            referencia = self.fecha_emision + timedelta(days=DIAS_ANULACION_SRI_LINEA)
        return bool(referencia and date.today() <= referencia)
