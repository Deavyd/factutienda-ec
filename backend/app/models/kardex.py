from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Kardex(Base, TimestampMixin):
    __tablename__ = "kardex"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    establecimiento_id: Mapped[int | None] = mapped_column(
        ForeignKey("establecimientos.id"), nullable=True, index=True
    )
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True, index=True)
    unidad_id: Mapped[int | None] = mapped_column(ForeignKey("unidades_medida.id"), nullable=True, index=True)

    tipo_movimiento: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    origen: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    documento_referencia: Mapped[str | None] = mapped_column(String(50), nullable=True)

    cantidad: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    cantidad_en_unidad_venta: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0"), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    saldo_anterior: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    saldo_nuevo: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)

    producto: Mapped["Producto"] = relationship(back_populates="kardex_movimientos")
    establecimiento: Mapped["Establecimiento | None"] = relationship(back_populates="kardex_movimientos")
    usuario: Mapped["Usuario | None"] = relationship(back_populates="kardex_movimientos")
