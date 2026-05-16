from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DetalleGuia(Base):
    __tablename__ = "detalle_guias"

    id: Mapped[int] = mapped_column(primary_key=True)
    guia_id: Mapped[int] = mapped_column(ForeignKey("guias_remision.id"), nullable=False, index=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unidad_id: Mapped[int | None] = mapped_column(ForeignKey("unidades_medida.id"), nullable=True, index=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)

    guia: Mapped["GuiaRemision"] = relationship(back_populates="detalles")
