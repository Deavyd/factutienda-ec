"""SRI 2026 final rules: anulacion y regimen constraints

Revision ID: 20260515_0011
Revises: 20260514_0010
Create Date: 2026-05-15 10:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260515_0011"
down_revision: str | None = "20260514_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("facturas", sa.Column("fecha_limite_anulacion", sa.Date(), nullable=True))

    op.execute(
        """
        UPDATE empresas
        SET regimen = 'GENERAL'
        WHERE regimen NOT IN ('GENERAL', 'RIMPE', 'RIMPE_NEGOCIO_POPULAR') OR regimen IS NULL
        """
    )
    op.create_check_constraint(
        "ck_empresas_regimen_valid",
        "empresas",
        "regimen IN ('GENERAL', 'RIMPE', 'RIMPE_NEGOCIO_POPULAR')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_empresas_regimen_valid", "empresas", type_="check")
    op.drop_column("facturas", "fecha_limite_anulacion")
