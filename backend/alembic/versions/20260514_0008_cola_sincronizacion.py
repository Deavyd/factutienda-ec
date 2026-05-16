"""cola de sincronizacion

Revision ID: 20260514_0008
Revises: 20260514_0007
Create Date: 2026-05-14 18:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0008"
down_revision: str | None = "20260514_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cola_sincronizacion",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tipo_operacion", sa.String(30), nullable=False),
        sa.Column("datos_json", sa.JSON(), nullable=False),
        sa.Column("estado", sa.String(20), nullable=False),
        sa.Column("intentos", sa.Integer(), nullable=False),
        sa.Column("max_intentos", sa.Integer(), nullable=False),
        sa.Column("error_detalle", sa.String(500), nullable=True),
        sa.Column("punto_emision_id", sa.Integer(), nullable=True),
        sa.Column("procesado_at", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cola_sincronizacion")),
    )


def downgrade() -> None:
    op.drop_table("cola_sincronizacion")
