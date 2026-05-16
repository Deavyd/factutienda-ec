"""precios y descuentos

Revision ID: 20260514_0004
Revises: 20260514_0003
Create Date: 2026-05-14 14:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0004"
down_revision: str | None = "20260514_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "listas_precio",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(80), nullable=False),
        sa.Column("descripcion", sa.String(255), nullable=True),
        sa.Column("tipo_calculo", sa.String(30), nullable=False),
        sa.Column("valor", sa.Numeric(12, 4), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("es_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_listas_precio")),
    )
    op.create_table(
        "precios_producto",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=False),
        sa.Column("lista_precio_id", sa.Integer(), nullable=False),
        sa.Column("precio", sa.Numeric(12, 4), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_precios_producto")),
        sa.UniqueConstraint("producto_id", "lista_precio_id", name="uq_precio_producto_lista"),
    )
    op.create_table(
        "descuentos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("descripcion", sa.String(255), nullable=True),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("valor", sa.Numeric(12, 4), nullable=False),
        sa.Column("aplica_a", sa.String(20), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=True),
        sa.Column("cantidad_minima", sa.Numeric(12, 4), nullable=False),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("acumulable", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_descuentos")),
    )
    op.add_column("personas", sa.Column("lista_precio_id", sa.Integer(), nullable=True))
    op.add_column("personas", sa.Column("limite_credito", sa.Float(), server_default="0", nullable=False))
    op.add_column("personas", sa.Column("dias_credito", sa.Integer(), server_default="0", nullable=False))
    op.add_column("personas", sa.Column("bloqueado", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("personas", sa.Column("motivo_bloqueo", sa.String(255), nullable=True))
    op.create_index(op.f("ix_personas_lista_precio_id"), "personas", ["lista_precio_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_personas_lista_precio_id"), table_name="personas")
    op.drop_column("personas", "motivo_bloqueo")
    op.drop_column("personas", "bloqueado")
    op.drop_column("personas", "dias_credito")
    op.drop_column("personas", "limite_credito")
    op.drop_column("personas", "lista_precio_id")
    op.drop_table("descuentos")
    op.drop_table("precios_producto")
    op.drop_table("listas_precio")
