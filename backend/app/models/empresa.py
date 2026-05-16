from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, Enum, Numeric, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Empresa(Base, TimestampMixin):
    __tablename__ = "empresas"

    id: Mapped[int] = mapped_column(primary_key=True)
    razon_social: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    nombre_comercial: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ruc: Mapped[str] = mapped_column(String(13), unique=True, nullable=False, index=True)
    direccion_matriz: Mapped[str] = mapped_column(String(255), nullable=False)
    obligado_contabilidad: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ambiente_sri: Mapped[int] = mapped_column(SmallInteger, default=2, nullable=False)
    regimen: Mapped[str] = mapped_column(
        Enum("GENERAL", "RIMPE", "RIMPE_NEGOCIO_POPULAR", name="regimen_empresa"),
        default="GENERAL",
        nullable=False,
    )
    cobra_propina: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    porcentaje_propina: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("10.00"), nullable=False)
    maneja_ice: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tipo_negocio: Mapped[str] = mapped_column(String(30), default="COMERCIO", nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    establecimientos: Mapped[list["Establecimiento"]] = relationship(
        back_populates="empresa", cascade="all, delete-orphan"
    )
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="empresa")
    personas: Mapped[list["Persona"]] = relationship(back_populates="empresa")
    productos: Mapped[list["Producto"]] = relationship(back_populates="empresa")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="empresa")
    compras: Mapped[list["Compra"]] = relationship(back_populates="empresa")
    notas_credito: Mapped[list["NotaCredito"]] = relationship(back_populates="empresa")
