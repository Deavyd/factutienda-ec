from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class PuntoEmision(Base, TimestampMixin):
    __tablename__ = "puntos_emision"
    __table_args__ = (
        UniqueConstraint("establecimiento_id", "codigo", name="uq_punto_establecimiento_codigo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    establecimiento_id: Mapped[int] = mapped_column(
        ForeignKey("establecimientos.id"), nullable=False, index=True
    )
    codigo: Mapped[str] = mapped_column(String(3), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(150), nullable=True)
    secuencial_factura: Mapped[int] = mapped_column(default=1, nullable=False)
    secuencial_nota_credito: Mapped[int] = mapped_column(default=1, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    establecimiento: Mapped["Establecimiento"] = relationship(back_populates="puntos_emision")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="punto_emision")
    notas_credito: Mapped[list["NotaCredito"]] = relationship(back_populates="punto_emision")
