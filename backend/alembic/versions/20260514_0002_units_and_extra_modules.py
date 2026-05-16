"""units and extra modules

Revision ID: 20260514_0002
Revises: 20260514_0001
Create Date: 2026-05-14 12:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0002"
down_revision: str | None = "20260514_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "unidades_medida",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=80), nullable=False),
        sa.Column("abreviatura", sa.String(length=12), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("factor_conversion", sa.Numeric(14, 6), nullable=False),
        sa.Column("es_base", sa.Boolean(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_unidades_medida")),
    )
    op.create_index(op.f("ix_unidades_medida_abreviatura"), "unidades_medida", ["abreviatura"], unique=True)
    op.create_index(op.f("ix_unidades_medida_tipo"), "unidades_medida", ["tipo"], unique=False)

    op.add_column("productos", sa.Column("unidad_compra_id", sa.Integer(), nullable=True))
    op.add_column("productos", sa.Column("unidad_venta_id", sa.Integer(), nullable=True))
    op.add_column("productos", sa.Column("factor_conversion", sa.Numeric(14, 6), nullable=False, server_default="1"))
    op.add_column("productos", sa.Column("precio_compra", sa.Numeric(12, 4), nullable=False, server_default="0"))
    op.add_column("productos", sa.Column("precio_venta", sa.Numeric(12, 4), nullable=False, server_default="0"))
    op.add_column("productos", sa.Column("costo_unitario_venta", sa.Numeric(12, 4), nullable=False, server_default="0"))
    op.add_column("productos", sa.Column("margen_ganancia", sa.Numeric(8, 4), nullable=False, server_default="0"))
    op.add_column("productos", sa.Column("stock_en_unidad_venta", sa.Numeric(14, 4), nullable=False, server_default="0"))
    op.create_index(op.f("ix_productos_unidad_compra_id"), "productos", ["unidad_compra_id"], unique=False)
    op.create_index(op.f("ix_productos_unidad_venta_id"), "productos", ["unidad_venta_id"], unique=False)

    op.add_column("detalle_compras", sa.Column("unidad_id", sa.Integer(), nullable=True))
    op.add_column("detalle_compras", sa.Column("cantidad_unidad_compra", sa.Numeric(14, 4), nullable=False, server_default="0"))
    op.add_column("detalle_compras", sa.Column("cantidad_convertida_venta", sa.Numeric(14, 4), nullable=False, server_default="0"))
    op.create_index(op.f("ix_detalle_compras_unidad_id"), "detalle_compras", ["unidad_id"], unique=False)

    op.add_column("kardex", sa.Column("unidad_id", sa.Integer(), nullable=True))
    op.add_column("kardex", sa.Column("cantidad_en_unidad_venta", sa.Numeric(14, 4), nullable=False, server_default="0"))
    op.create_index(op.f("ix_kardex_unidad_id"), "kardex", ["unidad_id"], unique=False)

    op.create_table(
        "turnos_caja",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("punto_emision_id", sa.Integer(), nullable=False),
        sa.Column("fecha_apertura", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_cierre", sa.DateTime(timezone=True), nullable=True),
        sa.Column("monto_apertura", sa.Numeric(12, 2), nullable=False),
        sa.Column("monto_cierre_real", sa.Numeric(12, 2), nullable=True),
        sa.Column("estado", sa.String(10), nullable=False),
        sa.Column("observaciones", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_turnos_caja")),
    )
    op.create_index(op.f("ix_turnos_caja_usuario_id"), "turnos_caja", ["usuario_id"], unique=False)

    op.create_table(
        "movimientos_caja",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("turno_caja_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(12), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("descripcion", sa.String(255), nullable=False),
        sa.Column("referencia_id", sa.String(60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_movimientos_caja")),
    )

    op.create_table(
        "formas_pago_factura",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("factura_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(25), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("referencia", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_formas_pago_factura")),
    )

    op.create_table(
        "retenciones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("factura_id", sa.Integer(), nullable=False),
        sa.Column("numero_retencion", sa.String(25), nullable=False),
        sa.Column("tipo_identificacion_agente", sa.String(5), nullable=False),
        sa.Column("identificacion_agente", sa.String(20), nullable=False),
        sa.Column("razon_social_agente", sa.String(255), nullable=False),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("detalles", sa.JSON(), nullable=False),
        sa.Column("total_retenido", sa.Numeric(12, 2), nullable=False),
        sa.Column("estado", sa.String(15), nullable=False),
        sa.Column("archivo_xml", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_retenciones")),
    )

    op.create_table(
        "cuentas_cobrar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("factura_id", sa.Integer(), nullable=False),
        sa.Column("cliente_id", sa.Integer(), nullable=False),
        sa.Column("monto_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("monto_pagado", sa.Numeric(12, 2), nullable=False),
        sa.Column("monto_pendiente", sa.Numeric(12, 2), nullable=False),
        sa.Column("fecha_vencimiento", sa.Date(), nullable=False),
        sa.Column("estado", sa.String(15), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cuentas_cobrar")),
    )

    op.create_table(
        "cuentas_pagar",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("compra_id", sa.Integer(), nullable=False),
        sa.Column("proveedor_id", sa.Integer(), nullable=False),
        sa.Column("monto_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("monto_pagado", sa.Numeric(12, 2), nullable=False),
        sa.Column("monto_pendiente", sa.Numeric(12, 2), nullable=False),
        sa.Column("fecha_vencimiento", sa.Date(), nullable=False),
        sa.Column("estado", sa.String(15), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cuentas_pagar")),
    )

    op.create_table(
        "pagos_cuenta",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cuenta_id", sa.Integer(), nullable=False),
        sa.Column("tipo_cuenta", sa.String(10), nullable=False),
        sa.Column("fecha_pago", sa.Date(), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("forma_pago", sa.String(30), nullable=False),
        sa.Column("referencia", sa.String(120), nullable=True),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pagos_cuenta")),
    )


def downgrade() -> None:
    op.drop_table("pagos_cuenta")
    op.drop_table("cuentas_pagar")
    op.drop_table("cuentas_cobrar")
    op.drop_table("retenciones")
    op.drop_table("formas_pago_factura")
    op.drop_table("movimientos_caja")
    op.drop_index(op.f("ix_turnos_caja_usuario_id"), table_name="turnos_caja")
    op.drop_table("turnos_caja")
    op.drop_index(op.f("ix_kardex_unidad_id"), table_name="kardex")
    op.drop_column("kardex", "cantidad_en_unidad_venta")
    op.drop_column("kardex", "unidad_id")
    op.drop_index(op.f("ix_detalle_compras_unidad_id"), table_name="detalle_compras")
    op.drop_column("detalle_compras", "cantidad_convertida_venta")
    op.drop_column("detalle_compras", "cantidad_unidad_compra")
    op.drop_column("detalle_compras", "unidad_id")
    op.drop_index(op.f("ix_productos_unidad_venta_id"), table_name="productos")
    op.drop_index(op.f("ix_productos_unidad_compra_id"), table_name="productos")
    op.drop_column("productos", "stock_en_unidad_venta")
    op.drop_column("productos", "margen_ganancia")
    op.drop_column("productos", "costo_unitario_venta")
    op.drop_column("productos", "precio_venta")
    op.drop_column("productos", "precio_compra")
    op.drop_column("productos", "factor_conversion")
    op.drop_column("productos", "unidad_venta_id")
    op.drop_column("productos", "unidad_compra_id")
    op.drop_index(op.f("ix_unidades_medida_tipo"), table_name="unidades_medida")
    op.drop_index(op.f("ix_unidades_medida_abreviatura"), table_name="unidades_medida")
    op.drop_table("unidades_medida")
