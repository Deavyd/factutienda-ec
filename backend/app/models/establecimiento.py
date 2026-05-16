from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Establecimiento(Base, TimestampMixin):
    __tablename__ = "establecimientos"
    __table_args__ = (UniqueConstraint("empresa_id", "codigo", name="uq_estab_empresa_codigo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    codigo: Mapped[str] = mapped_column(String(3), nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    direccion: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    empresa: Mapped["Empresa"] = relationship(back_populates="establecimientos")
    puntos_emision: Mapped[list["PuntoEmision"]] = relationship(
        back_populates="establecimiento", cascade="all, delete-orphan"
    )
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="establecimiento")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="establecimiento")
    kardex_movimientos: Mapped[list["Kardex"]] = relationship(back_populates="establecimiento")
