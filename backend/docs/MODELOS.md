# Modelos de base de datos

## Diagrama de tablas

```
empresas
├── establecimientos
│   └── puntos_emision
├── usuarios
├── personas (clientes/proveedores)
│   ├── facturas -> detalle_facturas
│   └── cuentas_cobrar
├── productos
│   ├── detalle_facturas
│   ├── detalle_compras
│   ├── kardex
│   ├── lotes
│   ├── precios_producto
│   └── productos_compuestos
├── compras -> detalle_compras
├── notas_credito
├── liquidaciones_compra -> detalle_liquidaciones
├── guias_remision -> detalle_guias
├── retenciones
├── turnos_caja -> movimientos_caja
├── formas_pago_factura
├── cuentas_pagar -> pagos_cuenta
├── tarifas_iva
├── unidades_medida
├── listas_precio
├── descuentos
├── cola_sincronizacion
├── auditoria
└── notificaciones
```

## Tablas principales

### Nucleo empresarial

| Tabla | Descripcion |
|---|---|
| `empresas` | Razon social, RUC, datos SRI |
| `establecimientos` | Sucursales (codigo 001, 002...) |
| `puntos_emision` | Cajas (codigo 001, 002...) |
| `usuarios` | Login, roles, permisos |

### Comercial

| Tabla | Descripcion |
|---|---|
| `personas` | Clientes y proveedores (tipo) |
| `productos` | Inventario, precios, unidades |
| `unidades_medida` | kg, lb, qq, und, L, etc. |
| `tarifas_iva` | 0%, 5%, 15% configurables |
| `listas_precio` | Normal, Mayorista, VIP |
| `precios_producto` | Precio por producto por lista |
| `descuentos` | Promociones y descuentos |

### Facturacion SRI

| Tabla | Descripcion |
|---|---|
| `facturas` | Comprobante principal (tipo 01) |
| `detalle_facturas` | Lineas de factura |
| `formas_pago_factura` | Efectivo, tarjeta, etc. |
| `notas_credito` | Devoluciones (tipo 04) |
| `liquidaciones_compra` | Compras a no RUC (tipo 03) |
| `detalle_liquidaciones` | Lineas liquidacion |
| `guias_remision` | Transporte mercaderia (tipo 06) |
| `detalle_guias` | Productos transportados |
| `retenciones` | Retenciones recibidas |

### Inventario

| Tabla | Descripcion |
|---|---|
| `kardex` | Movimientos historicos |
| `lotes` | Lotes con vencimiento y FEFO |
| `productos_compuestos` | Componentes de combos/kits |

### Caja

| Tabla | Descripcion |
|---|---|
| `turnos_caja` | Apertura/cierre de turnos |
| `movimientos_caja` | Ventas, gastos, retiros |

### Financiero

| Tabla | Descripcion |
|---|---|
| `cuentas_cobrar` | Creditos a clientes |
| `cuentas_pagar` | Deudas a proveedores |
| `pagos_cuenta` | Abonos registrados |

### Sistema

| Tabla | Descripcion |
|---|---|
| `auditoria` | Log de operaciones |
| `notificaciones` | Alertas internas |
| `cola_sincronizacion` | Operaciones offline pendientes |

## Indices importantes

- `ruc` (empresas) - unique
- `codigo` (establecimientos, puntos_emision) - unique compuesto
- `username`, `email` (usuarios) - unique
- `identificacion` (personas) - indexado
- `codigo_barras` (productos) - indexado
- `clave_acceso` (facturas) - indexado
- `numero_comprobante` (facturas) - indexado
- `fecha_emision` (facturas, compras) - indexado
- `sri_estado` (facturas) - indexado
- `fecha_vencimiento` (lotes) - indexado
