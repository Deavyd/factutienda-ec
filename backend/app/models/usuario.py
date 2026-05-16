from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Usuario(Base, TimestampMixin):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False, index=True)
    establecimiento_id: Mapped[int | None] = mapped_column(
        ForeignKey("establecimientos.id"), nullable=True, index=True
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombres: Mapped[str] = mapped_column(String(120), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(120), nullable=False)
    rol: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ultimo_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    empresa: Mapped["Empresa"] = relationship(back_populates="usuarios")
    establecimiento: Mapped["Establecimiento | None"] = relationship(back_populates="usuarios")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="usuario")
    kardex_movimientos: Mapped[list["Kardex"]] = relationship(back_populates="usuario")
    compras: Mapped[list["Compra"]] = relationship(back_populates="usuario")
    notas_credito: Mapped[list["NotaCredito"]] = relationship(back_populates="usuario")
