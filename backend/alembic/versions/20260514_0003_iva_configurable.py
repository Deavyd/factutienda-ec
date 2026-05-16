"""iva configurable

Revision ID: 20260514_0003
Revises: 20260514_0002
Create Date: 2026-05-14 13:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0003"
down_revision: str | None = "20260514_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tarifas_iva",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=80), nullable=False),
        sa.Column("porcentaje", sa.Numeric(5, 2), nullable=False),
        sa.Column("codigo_sri", sa.String(length=5), nullable=False),
        sa.Column("descripcion", sa.String(length=255), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("fecha_vigencia_desde", sa.Date(), nullable=False),
        sa.Column("fecha_vigencia_hasta", sa.Date(), nullable=True),
        sa.Column("es_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tarifas_iva")),
    )

    op.add_column("productos", sa.Column("tarifa_iva_id", sa.Integer(), nullable=True))
    op.add_column("productos", sa.Column("incluye_iva", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.create_index(op.f("ix_productos_tarifa_iva_id"), "productos", ["tarifa_iva_id"], unique=False)

    op.add_column("detalle_facturas", sa.Column("tarifa_iva_id", sa.Integer(), nullable=True))
    op.add_column("detalle_facturas", sa.Column("porcentaje_iva_aplicado", sa.Numeric(5, 2), server_default="0", nullable=False))
    op.add_column("detalle_facturas", sa.Column("valor_iva", sa.Numeric(12, 2), server_default="0", nullable=False))
    op.create_index(op.f("ix_detalle_facturas_tarifa_iva_id"), "detalle_facturas", ["tarifa_iva_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_detalle_facturas_tarifa_iva_id"), table_name="detalle_facturas")
    op.drop_column("detalle_facturas", "valor_iva")
    op.drop_column("detalle_facturas", "porcentaje_iva_aplicado")
    op.drop_column("detalle_facturas", "tarifa_iva_id")

    op.drop_index(op.f("ix_productos_tarifa_iva_id"), table_name="productos")
    op.drop_column("productos", "incluye_iva")
    op.drop_column("productos", "tarifa_iva_id")

    op.drop_table("tarifas_iva")
