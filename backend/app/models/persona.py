from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Persona(Base, TimestampMixin):
    __tablename__ = "personas"
    __table_args__ = (
        UniqueConstraint("empresa_id", "identificacion", name="uq_persona_empresa_identificacion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    tipo_identificacion: Mapped[str] = mapped_column(String(20), nullable=False)
    identificacion: Mapped[str] = mapped_column(String(13), nullable=False, index=True)
    razon_social: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    nombre_comercial: Mapped[str | None] = mapped_column(String(255), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    lista_precio_id: Mapped[int | None] = mapped_column(ForeignKey("listas_precio.id"), nullable=True, index=True)
    limite_credito: Mapped[float] = mapped_column(default=0, nullable=False)
    dias_credito: Mapped[int] = mapped_column(default=0, nullable=False)
    bloqueado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    motivo_bloqueo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    empresa: Mapped["Empresa"] = relationship(back_populates="personas")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="cliente")
    compras: Mapped[list["Compra"]] = relationship(back_populates="proveedor")
    notas_credito: Mapped[list["NotaCredito"]] = relationship(back_populates="cliente")
