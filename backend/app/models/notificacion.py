from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Notificacion(Base, TimestampMixin):
    __tablename__ = "notificaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    tipo: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    mensaje: Mapped[str] = mapped_column(String(500), nullable=False)
    prioridad: Mapped[str] = mapped_column(String(10), default="MEDIA", nullable=False)
    leida: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    referencia_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    referencia_tipo: Mapped[str | None] = mapped_column(String(30), nullable=True)
