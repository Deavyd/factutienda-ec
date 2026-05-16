"""liquidaciones y guias de remision

Revision ID: 20260514_0005
Revises: 20260514_0004
Create Date: 2026-05-14 15:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0005"
down_revision: str | None = "20260514_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "liquidaciones_compra",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_id", sa.Integer(), nullable=False),
        sa.Column("punto_emision_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("numero", sa.String(17), nullable=False),
        sa.Column("proveedor_nombre", sa.String(255), nullable=False),
        sa.Column("proveedor_cedula", sa.String(13), nullable=False),
        sa.Column("proveedor_direccion", sa.String(255), nullable=True),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("subtotal_0", sa.Numeric(12, 2), nullable=False),
        sa.Column("subtotal_15", sa.Numeric(12, 2), nullable=False),
        sa.Column("iva", sa.Numeric(12, 2), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("clave_acceso", sa.String(49), nullable=True),
        sa.Column("estado_sri", sa.String(20), nullable=False),
        sa.Column("xml_autorizado", sa.String(255), nullable=True),
        sa.Column("numero_autorizacion", sa.String(80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_liquidaciones_compra")),
    )
    op.create_index("ix_liquidaciones_numero", "liquidaciones_compra", ["numero"], unique=False)

    op.create_table(
        "detalle_liquidaciones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("liquidacion_id", sa.Integer(), nullable=False),
        sa.Column("descripcion", sa.String(255), nullable=False),
        sa.Column("cantidad", sa.Numeric(14, 4), nullable=False),
        sa.Column("unidad", sa.String(50), nullable=False),
        sa.Column("precio_unitario", sa.Numeric(12, 4), nullable=False),
        sa.Column("descuento", sa.Numeric(12, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("iva", sa.Numeric(12, 2), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_detalle_liquidaciones")),
    )

    op.create_table(
        "guias_remision",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_origen_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("numero", sa.String(17), nullable=False),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("fecha_inicio_transporte", sa.Date(), nullable=False),
        sa.Column("fecha_fin_transporte", sa.Date(), nullable=False),
        sa.Column("transportista_ruc", sa.String(13), nullable=False),
        sa.Column("transportista_nombre", sa.String(255), nullable=False),
        sa.Column("placa_vehiculo", sa.String(10), nullable=True),
        sa.Column("punto_partida", sa.String(255), nullable=False),
        sa.Column("punto_llegada", sa.String(255), nullable=False),
        sa.Column("motivo_traslado", sa.String(20), nullable=False),
        sa.Column("establecimiento_destino_id", sa.Integer(), nullable=True),
        sa.Column("factura_id", sa.Integer(), nullable=True),
        sa.Column("clave_acceso", sa.String(49), nullable=True),
        sa.Column("estado_sri", sa.String(20), nullable=False),
        sa.Column("xml_autorizado", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_guias_remision")),
    )

    op.create_table(
        "detalle_guias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("guia_id", sa.Integer(), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=False),
        sa.Column("cantidad", sa.Numeric(14, 4), nullable=False),
        sa.Column("unidad_id", sa.Integer(), nullable=True),
        sa.Column("descripcion", sa.String(255), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_detalle_guias")),
    )


def downgrade() -> None:
    op.drop_table("detalle_guias")
    op.drop_table("guias_remision")
    op.drop_table("detalle_liquidaciones")
    op.drop_table("liquidaciones_compra")
