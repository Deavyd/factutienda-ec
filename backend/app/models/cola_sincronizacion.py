from __future__ import annotations

from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ColaSincronizacion(Base, TimestampMixin):
    __tablename__ = "cola_sincronizacion"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_operacion: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    datos_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False, index=True)
    intentos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_intentos: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    error_detalle: Mapped[str | None] = mapped_column(String(500), nullable=True)
    punto_emision_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    procesado_at: Mapped[str | None] = mapped_column(String(30), nullable=True)
