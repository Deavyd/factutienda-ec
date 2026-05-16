from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id: Mapped[int] = mapped_column(primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"), nullable=False, index=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    codigo_principal: Mapped[str] = mapped_column(String(50), nullable=False)
    codigo_auxiliar: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    descuento: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    tarifa_iva_id: Mapped[int | None] = mapped_column(ForeignKey("tarifas_iva.id"), nullable=True, index=True)
    porcentaje_iva_aplicado: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)
    base_imponible: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    iva_tarifa: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    iva_valor: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    valor_iva: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    valor_ice: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    tipo_tarifa_iva: Mapped[str | None] = mapped_column(String(10), nullable=True)
    total_linea: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    factura: Mapped["Factura"] = relationship(back_populates="detalles")
    producto: Mapped["Producto"] = relationship(back_populates="detalles_factura")
