"""SRI 2026 corrections - RIMPE, ICE, propina, error handling

Revision ID: 20260514_0009
Revises: 20260514_0008
Create Date: 2026-05-14 19:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0009"
down_revision: str | None = "20260514_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("empresas", sa.Column("regimen", sa.String(30), server_default="GENERAL", nullable=False))
    op.add_column("empresas", sa.Column("cobra_propina", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("empresas", sa.Column("porcentaje_propina", sa.Numeric(5, 2), server_default="10.00", nullable=False))
    op.add_column("empresas", sa.Column("maneja_ice", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("empresas", sa.Column("tipo_negocio", sa.String(30), server_default="COMERCIO", nullable=False))

    op.add_column("productos", sa.Column("codigo_auxiliar", sa.String(50), nullable=True))
    op.add_column("productos", sa.Column("tiene_ice", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("productos", sa.Column("tarifa_ice", sa.Numeric(5, 2), server_default="0", nullable=False))
    op.add_column("productos", sa.Column("valor_ice_unitario", sa.Numeric(12, 4), server_default="0", nullable=False))

    op.add_column("facturas", sa.Column("guia_remision_numero", sa.String(20), nullable=True))
    op.add_column("facturas", sa.Column("es_comercial_negociable", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("facturas", sa.Column("propina_porcentaje", sa.Numeric(5, 2), server_default="0", nullable=False))
    op.add_column("facturas", sa.Column("propina_valor", sa.Numeric(12, 2), server_default="0", nullable=False))
    op.add_column("facturas", sa.Column("codigo_error_sri", sa.String(30), nullable=True))
    op.add_column("facturas", sa.Column("accion_requerida", sa.String(120), nullable=True))
    op.add_column("facturas", sa.Column("requiere_intervencion_manual", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("facturas", sa.Column("motivo_contingencia", sa.String(30), nullable=True))

    op.add_column("detalle_facturas", sa.Column("codigo_auxiliar", sa.String(50), nullable=True))
    op.add_column("detalle_facturas", sa.Column("valor_ice", sa.Numeric(12, 2), server_default="0", nullable=False))
    op.add_column("detalle_facturas", sa.Column("tipo_tarifa_iva", sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column("detalle_facturas", "tipo_tarifa_iva")
    op.drop_column("detalle_facturas", "valor_ice")
    op.drop_column("detalle_facturas", "codigo_auxiliar")
    op.drop_column("facturas", "motivo_contingencia")
    op.drop_column("facturas", "requiere_intervencion_manual")
    op.drop_column("facturas", "accion_requerida")
    op.drop_column("facturas", "codigo_error_sri")
    op.drop_column("facturas", "propina_valor")
    op.drop_column("facturas", "propina_porcentaje")
    op.drop_column("facturas", "es_comercial_negociable")
    op.drop_column("facturas", "guia_remision_numero")
    op.drop_column("productos", "valor_ice_unitario")
    op.drop_column("productos", "tarifa_ice")
    op.drop_column("productos", "tiene_ice")
    op.drop_column("productos", "codigo_auxiliar")
    op.drop_column("empresas", "tipo_negocio")
    op.drop_column("empresas", "maneja_ice")
    op.drop_column("empresas", "porcentaje_propina")
    op.drop_column("empresas", "cobra_propina")
    op.drop_column("empresas", "regimen")
