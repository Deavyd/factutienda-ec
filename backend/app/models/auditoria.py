from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Auditoria(Base):
    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    usuario_nombre: Mapped[str | None] = mapped_column(String(255), nullable=True)
    accion: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    modulo: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    registro_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    datos_antes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    datos_despues: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    resultado: Mapped[str] = mapped_column(String(20), default="EXITOSO", nullable=False)
    detalle_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
