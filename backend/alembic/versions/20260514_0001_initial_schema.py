"""initial schema

Revision ID: 20260514_0001
Revises:
Create Date: 2026-05-14 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260514_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "empresas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("razon_social", sa.String(length=255), nullable=False),
        sa.Column("nombre_comercial", sa.String(length=255), nullable=True),
        sa.Column("ruc", sa.String(length=13), nullable=False),
        sa.Column("direccion_matriz", sa.String(length=255), nullable=False),
        sa.Column("obligado_contabilidad", sa.Boolean(), nullable=False),
        sa.Column("ambiente_sri", sa.SmallInteger(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_empresas")),
    )
    op.create_index(op.f("ix_empresas_ruc"), "empresas", ["ruc"], unique=True)
    op.create_index(op.f("ix_empresas_razon_social"), "empresas", ["razon_social"], unique=False)

    op.create_table(
        "establecimientos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=3), nullable=False),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("direccion", sa.String(length=255), nullable=False),
        sa.Column("telefono", sa.String(length=20), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_establecimientos_empresa_id_empresas")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_establecimientos")),
        sa.UniqueConstraint("empresa_id", "codigo", name="uq_estab_empresa_codigo"),
    )
    op.create_index(op.f("ix_establecimientos_empresa_id"), "establecimientos", ["empresa_id"], unique=False)

    op.create_table(
        "personas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("tipo_identificacion", sa.String(length=20), nullable=False),
        sa.Column("identificacion", sa.String(length=13), nullable=False),
        sa.Column("razon_social", sa.String(length=255), nullable=False),
        sa.Column("nombre_comercial", sa.String(length=255), nullable=True),
        sa.Column("direccion", sa.String(length=255), nullable=True),
        sa.Column("telefono", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_personas_empresa_id_empresas")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_personas")),
        sa.UniqueConstraint("empresa_id", "identificacion", name="uq_persona_empresa_identificacion"),
    )
    op.create_index(op.f("ix_personas_empresa_id"), "personas", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_personas_identificacion"), "personas", ["identificacion"], unique=False)
    op.create_index(op.f("ix_personas_razon_social"), "personas", ["razon_social"], unique=False)
    op.create_index(op.f("ix_personas_tipo"), "personas", ["tipo"], unique=False)

    op.create_table(
        "productos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("codigo_interno", sa.String(length=50), nullable=False),
        sa.Column("codigo_barras", sa.String(length=50), nullable=True),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.String(length=255), nullable=True),
        sa.Column("precio_sin_iva", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("iva_tarifa", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("costo_promedio", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("stock_actual", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("stock_minimo", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("maneja_inventario", sa.Boolean(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_productos_empresa_id_empresas")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_productos")),
        sa.UniqueConstraint("empresa_id", "codigo_interno", name="uq_prod_empresa_codigo"),
    )
    op.create_index(op.f("ix_productos_codigo_barras"), "productos", ["codigo_barras"], unique=False)
    op.create_index(op.f("ix_productos_codigo_interno"), "productos", ["codigo_interno"], unique=False)
    op.create_index(op.f("ix_productos_empresa_id"), "productos", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_productos_nombre"), "productos", ["nombre"], unique=False)

    op.create_table(
        "puntos_emision",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=3), nullable=False),
        sa.Column("descripcion", sa.String(length=150), nullable=True),
        sa.Column("secuencial_factura", sa.Integer(), nullable=False),
        sa.Column("secuencial_nota_credito", sa.Integer(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["establecimiento_id"], ["establecimientos.id"], name=op.f("fk_puntos_emision_establecimiento_id_establecimientos")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_puntos_emision")),
        sa.UniqueConstraint("establecimiento_id", "codigo", name="uq_punto_establecimiento_codigo"),
    )
    op.create_index(op.f("ix_puntos_emision_establecimiento_id"), "puntos_emision", ["establecimiento_id"], unique=False)

    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_id", sa.Integer(), nullable=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("nombres", sa.String(length=120), nullable=False),
        sa.Column("apellidos", sa.String(length=120), nullable=False),
        sa.Column("rol", sa.String(length=30), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("ultimo_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_usuarios_empresa_id_empresas")),
        sa.ForeignKeyConstraint(["establecimiento_id"], ["establecimientos.id"], name=op.f("fk_usuarios_establecimiento_id_establecimientos")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_usuarios")),
    )
    op.create_index(op.f("ix_usuarios_email"), "usuarios", ["email"], unique=True)
    op.create_index(op.f("ix_usuarios_empresa_id"), "usuarios", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_usuarios_establecimiento_id"), "usuarios", ["establecimiento_id"], unique=False)
    op.create_index(op.f("ix_usuarios_rol"), "usuarios", ["rol"], unique=False)
    op.create_index(op.f("ix_usuarios_username"), "usuarios", ["username"], unique=True)

    op.create_table(
        "facturas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_id", sa.Integer(), nullable=False),
        sa.Column("punto_emision_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("cliente_id", sa.Integer(), nullable=False),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("secuencial", sa.String(length=9), nullable=False),
        sa.Column("numero_comprobante", sa.String(length=17), nullable=False),
        sa.Column("clave_acceso", sa.String(length=49), nullable=True),
        sa.Column("subtotal_sin_impuestos", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("subtotal_0", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("subtotal_12", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("descuento_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("iva_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("ambiente_sri", sa.Integer(), nullable=False),
        sa.Column("estado", sa.String(length=30), nullable=False),
        sa.Column("sri_estado", sa.String(length=30), nullable=False),
        sa.Column("sri_autorizacion", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["cliente_id"], ["personas.id"], name=op.f("fk_facturas_cliente_id_personas")),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_facturas_empresa_id_empresas")),
        sa.ForeignKeyConstraint(["establecimiento_id"], ["establecimientos.id"], name=op.f("fk_facturas_establecimiento_id_establecimientos")),
        sa.ForeignKeyConstraint(["punto_emision_id"], ["puntos_emision.id"], name=op.f("fk_facturas_punto_emision_id_puntos_emision")),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name=op.f("fk_facturas_usuario_id_usuarios")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_facturas")),
        sa.UniqueConstraint("establecimiento_id", "punto_emision_id", "secuencial", name="uq_factura_secuencial"),
    )
    op.create_index("ix_facturas_clave_acceso", "facturas", ["clave_acceso"], unique=False)
    op.create_index("ix_facturas_fecha_emision", "facturas", ["fecha_emision"], unique=False)
    op.create_index(op.f("ix_facturas_cliente_id"), "facturas", ["cliente_id"], unique=False)
    op.create_index(op.f("ix_facturas_empresa_id"), "facturas", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_facturas_estado"), "facturas", ["estado"], unique=False)
    op.create_index(op.f("ix_facturas_establecimiento_id"), "facturas", ["establecimiento_id"], unique=False)
    op.create_index(op.f("ix_facturas_numero_comprobante"), "facturas", ["numero_comprobante"], unique=False)
    op.create_index(op.f("ix_facturas_punto_emision_id"), "facturas", ["punto_emision_id"], unique=False)
    op.create_index(op.f("ix_facturas_sri_estado"), "facturas", ["sri_estado"], unique=False)
    op.create_index(op.f("ix_facturas_usuario_id"), "facturas", ["usuario_id"], unique=False)

    op.create_table(
        "compras",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("proveedor_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("numero_documento", sa.String(length=30), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("iva_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("estado", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_compras_empresa_id_empresas")),
        sa.ForeignKeyConstraint(["proveedor_id"], ["personas.id"], name=op.f("fk_compras_proveedor_id_personas")),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name=op.f("fk_compras_usuario_id_usuarios")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_compras")),
    )
    op.create_index(op.f("ix_compras_empresa_id"), "compras", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_compras_numero_documento"), "compras", ["numero_documento"], unique=False)
    op.create_index(op.f("ix_compras_proveedor_id"), "compras", ["proveedor_id"], unique=False)
    op.create_index(op.f("ix_compras_usuario_id"), "compras", ["usuario_id"], unique=False)

    op.create_table(
        "detalle_facturas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("factura_id", sa.Integer(), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=False),
        sa.Column("codigo_principal", sa.String(length=50), nullable=False),
        sa.Column("descripcion", sa.String(length=255), nullable=False),
        sa.Column("cantidad", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("precio_unitario", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("descuento", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("base_imponible", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("iva_tarifa", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("iva_valor", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_linea", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["factura_id"], ["facturas.id"], name=op.f("fk_detalle_facturas_factura_id_facturas")),
        sa.ForeignKeyConstraint(["producto_id"], ["productos.id"], name=op.f("fk_detalle_facturas_producto_id_productos")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_detalle_facturas")),
    )
    op.create_index(op.f("ix_detalle_facturas_factura_id"), "detalle_facturas", ["factura_id"], unique=False)
    op.create_index(op.f("ix_detalle_facturas_producto_id"), "detalle_facturas", ["producto_id"], unique=False)

    op.create_table(
        "kardex",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("producto_id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_id", sa.Integer(), nullable=True),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("tipo_movimiento", sa.String(length=20), nullable=False),
        sa.Column("origen", sa.String(length=30), nullable=False),
        sa.Column("documento_referencia", sa.String(length=50), nullable=True),
        sa.Column("cantidad", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("costo_unitario", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("saldo_anterior", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("saldo_nuevo", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["establecimiento_id"], ["establecimientos.id"], name=op.f("fk_kardex_establecimiento_id_establecimientos")),
        sa.ForeignKeyConstraint(["producto_id"], ["productos.id"], name=op.f("fk_kardex_producto_id_productos")),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name=op.f("fk_kardex_usuario_id_usuarios")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_kardex")),
    )
    op.create_index(op.f("ix_kardex_establecimiento_id"), "kardex", ["establecimiento_id"], unique=False)
    op.create_index(op.f("ix_kardex_origen"), "kardex", ["origen"], unique=False)
    op.create_index(op.f("ix_kardex_producto_id"), "kardex", ["producto_id"], unique=False)
    op.create_index(op.f("ix_kardex_tipo_movimiento"), "kardex", ["tipo_movimiento"], unique=False)
    op.create_index(op.f("ix_kardex_usuario_id"), "kardex", ["usuario_id"], unique=False)

    op.create_table(
        "notas_credito",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("establecimiento_id", sa.Integer(), nullable=False),
        sa.Column("punto_emision_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("cliente_id", sa.Integer(), nullable=False),
        sa.Column("factura_id", sa.Integer(), nullable=False),
        sa.Column("fecha_emision", sa.Date(), nullable=False),
        sa.Column("secuencial", sa.String(length=9), nullable=False),
        sa.Column("numero_comprobante", sa.String(length=17), nullable=False),
        sa.Column("clave_acceso", sa.String(length=49), nullable=True),
        sa.Column("motivo", sa.String(length=300), nullable=False),
        sa.Column("total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("sri_estado", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["cliente_id"], ["personas.id"], name=op.f("fk_notas_credito_cliente_id_personas")),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], name=op.f("fk_notas_credito_empresa_id_empresas")),
        sa.ForeignKeyConstraint(["establecimiento_id"], ["establecimientos.id"], name=op.f("fk_notas_credito_establecimiento_id_establecimientos")),
        sa.ForeignKeyConstraint(["factura_id"], ["facturas.id"], name=op.f("fk_notas_credito_factura_id_facturas")),
        sa.ForeignKeyConstraint(["punto_emision_id"], ["puntos_emision.id"], name=op.f("fk_notas_credito_punto_emision_id_puntos_emision")),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], name=op.f("fk_notas_credito_usuario_id_usuarios")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notas_credito")),
        sa.UniqueConstraint("establecimiento_id", "punto_emision_id", "secuencial", name="uq_nota_credito_secuencial"),
    )
    op.create_index(op.f("ix_notas_credito_cliente_id"), "notas_credito", ["cliente_id"], unique=False)
    op.create_index(op.f("ix_notas_credito_empresa_id"), "notas_credito", ["empresa_id"], unique=False)
    op.create_index(op.f("ix_notas_credito_establecimiento_id"), "notas_credito", ["establecimiento_id"], unique=False)
    op.create_index(op.f("ix_notas_credito_factura_id"), "notas_credito", ["factura_id"], unique=False)
    op.create_index(op.f("ix_notas_credito_punto_emision_id"), "notas_credito", ["punto_emision_id"], unique=False)
    op.create_index(op.f("ix_notas_credito_usuario_id"), "notas_credito", ["usuario_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notas_credito_usuario_id"), table_name="notas_credito")
    op.drop_index(op.f("ix_notas_credito_punto_emision_id"), table_name="notas_credito")
    op.drop_index(op.f("ix_notas_credito_factura_id"), table_name="notas_credito")
    op.drop_index(op.f("ix_notas_credito_establecimiento_id"), table_name="notas_credito")
    op.drop_index(op.f("ix_notas_credito_empresa_id"), table_name="notas_credito")
    op.drop_index(op.f("ix_notas_credito_cliente_id"), table_name="notas_credito")
    op.drop_table("notas_credito")

    op.drop_index(op.f("ix_kardex_usuario_id"), table_name="kardex")
    op.drop_index(op.f("ix_kardex_tipo_movimiento"), table_name="kardex")
    op.drop_index(op.f("ix_kardex_producto_id"), table_name="kardex")
    op.drop_index(op.f("ix_kardex_origen"), table_name="kardex")
    op.drop_index(op.f("ix_kardex_establecimiento_id"), table_name="kardex")
    op.drop_table("kardex")

    op.drop_index(op.f("ix_detalle_facturas_producto_id"), table_name="detalle_facturas")
    op.drop_index(op.f("ix_detalle_facturas_factura_id"), table_name="detalle_facturas")
    op.drop_table("detalle_facturas")

    op.drop_index(op.f("ix_compras_usuario_id"), table_name="compras")
    op.drop_index(op.f("ix_compras_proveedor_id"), table_name="compras")
    op.drop_index(op.f("ix_compras_numero_documento"), table_name="compras")
    op.drop_index(op.f("ix_compras_empresa_id"), table_name="compras")
    op.drop_table("compras")

    op.drop_index(op.f("ix_facturas_usuario_id"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_sri_estado"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_punto_emision_id"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_numero_comprobante"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_establecimiento_id"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_estado"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_empresa_id"), table_name="facturas")
    op.drop_index(op.f("ix_facturas_cliente_id"), table_name="facturas")
    op.drop_index("ix_facturas_fecha_emision", table_name="facturas")
    op.drop_index("ix_facturas_clave_acceso", table_name="facturas")
    op.drop_table("facturas")

    op.drop_index(op.f("ix_usuarios_username"), table_name="usuarios")
    op.drop_index(op.f("ix_usuarios_rol"), table_name="usuarios")
    op.drop_index(op.f("ix_usuarios_establecimiento_id"), table_name="usuarios")
    op.drop_index(op.f("ix_usuarios_empresa_id"), table_name="usuarios")
    op.drop_index(op.f("ix_usuarios_email"), table_name="usuarios")
    op.drop_table("usuarios")

    op.drop_index(op.f("ix_puntos_emision_establecimiento_id"), table_name="puntos_emision")
    op.drop_table("puntos_emision")

    op.drop_index(op.f("ix_productos_nombre"), table_name="productos")
    op.drop_index(op.f("ix_productos_empresa_id"), table_name="productos")
    op.drop_index(op.f("ix_productos_codigo_interno"), table_name="productos")
    op.drop_index(op.f("ix_productos_codigo_barras"), table_name="productos")
    op.drop_table("productos")

    op.drop_index(op.f("ix_personas_tipo"), table_name="personas")
    op.drop_index(op.f("ix_personas_razon_social"), table_name="personas")
    op.drop_index(op.f("ix_personas_identificacion"), table_name="personas")
    op.drop_index(op.f("ix_personas_empresa_id"), table_name="personas")
    op.drop_table("personas")

    op.drop_index(op.f("ix_establecimientos_empresa_id"), table_name="establecimientos")
    op.drop_table("establecimientos")

    op.drop_index(op.f("ix_empresas_razon_social"), table_name="empresas")
    op.drop_index(op.f("ix_empresas_ruc"), table_name="empresas")
    op.drop_table("empresas")
