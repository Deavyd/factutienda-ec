"""lotes y productos compuestos

Revision ID: 20260514_0006
Revises: 20260514_0005
Create Date: 2026-05-14 16:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0006"
down_revision: str | None = "20260514_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lotes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=False),
        sa.Column("codigo_lote", sa.String(60), nullable=False),
        sa.Column("fecha_fabricacion", sa.Date(), nullable=False),
        sa.Column("fecha_vencimiento", sa.Date(), nullable=False),
        sa.Column("cantidad_inicial", sa.Numeric(14, 4), nullable=False),
        sa.Column("cantidad_actual", sa.Numeric(14, 4), nullable=False),
        sa.Column("costo_unitario", sa.Numeric(12, 4), nullable=False),
        sa.Column("proveedor_id", sa.Integer(), nullable=True),
        sa.Column("compra_id", sa.Integer(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("alertado", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_lotes")),
    )
    op.create_index("ix_lotes_codigo_lote", "lotes", ["codigo_lote"], unique=False)
    op.create_index("ix_lotes_producto_id", "lotes", ["producto_id"], unique=False)

    op.create_table(
        "productos_compuestos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("producto_padre_id", sa.Integer(), nullable=False),
        sa.Column("producto_hijo_id", sa.Integer(), nullable=False),
        sa.Column("cantidad", sa.Numeric(14, 4), nullable=False),
        sa.Column("unidad_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_productos_compuestos")),
        sa.UniqueConstraint("producto_padre_id", "producto_hijo_id", name="uq_compuesto_padre_hijo"),
    )

    op.add_column("productos", sa.Column("maneja_lotes", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("productos", sa.Column("dias_alerta_vencimiento", sa.Integer(), server_default="30", nullable=False))
    op.add_column("productos", sa.Column("tipo_producto", sa.String(20), server_default="SIMPLE", nullable=False))


def downgrade() -> None:
    op.drop_column("productos", "tipo_producto")
    op.drop_column("productos", "dias_alerta_vencimiento")
    op.drop_column("productos", "maneja_lotes")
    op.drop_table("productos_compuestos")
    op.drop_table("lotes")
