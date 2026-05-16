"""categorias, proformas y nuevos modulos CRUD

Revision ID: 20260514_0010
Revises: 20260514_0009
Create Date: 2026-05-14 20:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0010"
down_revision: str | None = "20260514_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "categorias_producto",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(120), nullable=False),
        sa.Column("descripcion", sa.String(255), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_categorias_producto")),
    )
    op.add_column("productos", sa.Column("categoria_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_productos_categoria_id"), "productos", ["categoria_id"], unique=False)

    op.create_table(
        "proformas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("cliente_id", sa.Integer(), nullable=False),
        sa.Column("numero", sa.String(20), nullable=False),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("fecha_validez", sa.Date(), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("iva_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("estado", sa.String(15), nullable=False),
        sa.Column("observacion", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_proformas")),
    )

    op.create_table(
        "detalle_proformas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proforma_id", sa.Integer(), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=False),
        sa.Column("descripcion", sa.String(255), nullable=False),
        sa.Column("cantidad", sa.Numeric(14, 4), nullable=False),
        sa.Column("precio_unitario", sa.Numeric(12, 4), nullable=False),
        sa.Column("descuento", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_linea", sa.Numeric(12, 2), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_detalle_proformas")),
    )


def downgrade() -> None:
    op.drop_table("detalle_proformas")
    op.drop_table("proformas")
    op.drop_index(op.f("ix_productos_categoria_id"), table_name="productos")
    op.drop_column("productos", "categoria_id")
    op.drop_table("categorias_producto")
