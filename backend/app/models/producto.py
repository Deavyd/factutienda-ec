from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Producto(Base, TimestampMixin):
    __tablename__ = "productos"
    __table_args__ = (UniqueConstraint("empresa_id", "codigo_interno", name="uq_prod_empresa_codigo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("categorias_producto.id"), nullable=True, index=True)
    codigo_interno: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    codigo_auxiliar: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    codigo_barras: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    precio_sin_iva: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    tarifa_iva_id: Mapped[int | None] = mapped_column(ForeignKey("tarifas_iva.id"), nullable=True, index=True)
    incluye_iva: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    unidad_compra_id: Mapped[int | None] = mapped_column(ForeignKey("unidades_medida.id"), nullable=True, index=True)
    unidad_venta_id: Mapped[int | None] = mapped_column(ForeignKey("unidades_medida.id"), nullable=True, index=True)
    factor_conversion: Mapped[Decimal] = mapped_column(Numeric(14, 6), default=Decimal("1"), nullable=False)
    precio_compra: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    precio_venta: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    costo_unitario_venta: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    margen_ganancia: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=Decimal("0"), nullable=False)
    stock_en_unidad_venta: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0"), nullable=False)
    costo_promedio: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    stock_actual: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0"), nullable=False)
    stock_minimo: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0"), nullable=False)
    maneja_inventario: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    maneja_lotes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dias_alerta_vencimiento: Mapped[int] = mapped_column(default=30, nullable=False)
    tipo_producto: Mapped[str] = mapped_column(String(20), default="SIMPLE", nullable=False)
    tiene_ice: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tarifa_ice: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)
    valor_ice_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    empresa: Mapped["Empresa"] = relationship(back_populates="productos")
    unidad_compra: Mapped["UnidadMedida | None"] = relationship(foreign_keys=[unidad_compra_id])
    unidad_venta: Mapped["UnidadMedida | None"] = relationship(foreign_keys=[unidad_venta_id])
    tarifa_iva: Mapped["TarifaIva | None"] = relationship()
    detalles_factura: Mapped[list["DetalleFactura"]] = relationship(back_populates="producto")
    kardex_movimientos: Mapped[list["Kardex"]] = relationship(back_populates="producto")
