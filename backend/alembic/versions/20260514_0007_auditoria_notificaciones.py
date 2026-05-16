"""auditoria y notificaciones

Revision ID: 20260514_0007
Revises: 20260514_0006
Create Date: 2026-05-14 17:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0007"
down_revision: str | None = "20260514_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "auditoria",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("usuario_nombre", sa.String(255), nullable=True),
        sa.Column("accion", sa.String(30), nullable=False),
        sa.Column("modulo", sa.String(30), nullable=False),
        sa.Column("registro_id", sa.Integer(), nullable=True),
        sa.Column("datos_antes", sa.JSON(), nullable=True),
        sa.Column("datos_despues", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resultado", sa.String(20), nullable=False),
        sa.Column("detalle_error", sa.String(500), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_auditoria")),
    )
    op.create_table(
        "notificaciones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("tipo", sa.String(30), nullable=False),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("mensaje", sa.String(500), nullable=False),
        sa.Column("prioridad", sa.String(10), nullable=False),
        sa.Column("leida", sa.Boolean(), nullable=False),
        sa.Column("referencia_id", sa.Integer(), nullable=True),
        sa.Column("referencia_tipo", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notificaciones")),
    )


def downgrade() -> None:
    op.drop_table("notificaciones")
    op.drop_table("auditoria")
