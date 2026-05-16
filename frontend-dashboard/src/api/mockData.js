export const mockDb = {
  productos: [
    { id: 1, nombre: "Arroz 1kg", precio_venta: 1.35, precio_sin_iva: 1.35, categoria_id: 1, stock_actual: 65, stock_minimo: 10, codigo_barras: "789100000001" },
    { id: 2, nombre: "Leche Entera 1L", precio_venta: 1.1, precio_sin_iva: 1.1, categoria_id: 2, stock_actual: 42, stock_minimo: 8, codigo_barras: "789100000002" },
    { id: 3, nombre: "Atun en Lata", precio_venta: 1.75, precio_sin_iva: 1.75, categoria_id: 3, stock_actual: 28, stock_minimo: 12, codigo_barras: "789100000003" },
  ],
  categorias: [
    { id: 1, nombre: "Granos" },
    { id: 2, nombre: "Lacteos" },
    { id: 3, nombre: "Enlatados" },
  ],
  clientes: [
    { id: 1, tipo_identificacion: "CEDULA", identificacion: "0102030405", razon_social: "Juan Perez", email: "juan@email.com", telefono: "099000111", direccion: "Cuenca" },
    { id: 2, tipo_identificacion: "RUC", identificacion: "0198765432001", razon_social: "Comercial Central", email: "compras@central.ec", telefono: "072222222", direccion: "Azogues" },
  ],
  proveedores: [
    { id: 1, identificacion: "0999999999001", razon_social: "Distribuidora Andina", email: "ventas@andina.ec", telefono: "072223344", direccion: "Cuenca" },
    { id: 2, identificacion: "0888888888001", razon_social: "Mayorista Norte", email: "contacto@norte.ec", telefono: "072229999", direccion: "Quito" },
  ],
  usuarios: [
    { id: 1, nombre: "Administrador", email: "admin@tinmarket.ec", rol: "admin", activo: true },
    { id: 2, nombre: "Caja 1", email: "caja@tinmarket.ec", rol: "cajero", activo: true },
  ],
  facturas: [
    { id: 1, numero_comprobante: "001-001-000000123", cliente_id: 1, fecha_emision: "2026-05-10", total: 24.5, sri_estado: "AUTORIZADA" },
    { id: 2, numero_comprobante: "001-001-000000124", cliente_id: 2, fecha_emision: "2026-05-11", total: 10, sri_estado: "PENDIENTE" },
  ],
  compras: [
    { id: 1, numero_documento: "FAC-PRV-1001", proveedor_id: 1, fecha_emision: "2026-05-12", total: 120.55, estado: "REGISTRADA" },
  ],
  notasCredito: [
    { id: 1, factura_id: 1, fecha_emision: "2026-05-13", total: 2.5, estado: "EMITIDA" },
  ],
  proformas: [
    { id: 1, numero: "PRO-0001", cliente_id: 1, fecha_emision: "2026-05-14", total: 48.2, estado: "PENDIENTE" },
  ],
  cuentasCobrar: [
    { id: 1, cliente_id: 1, monto_total: 100, monto_pagado: 40, monto_pendiente: 60, fecha_vencimiento: "2026-05-25", estado: "PENDIENTE" },
    { id: 2, cliente_id: 2, monto_total: 75, monto_pagado: 75, monto_pendiente: 0, fecha_vencimiento: "2026-05-18", estado: "PAGADA" },
  ],
  establecimientos: [
    { id: 1, codigo: "001", nombre: "Matriz", direccion: "Cuenca" },
  ],
  puntosEmision: [
    { id: 1, establecimiento_id: 1, codigo: "001", nombre: "Caja Principal" },
  ],
  cuentasPagar: [
    { id: 1, compra_id: 1, proveedor_id: 1, monto_total: 120.55, monto_pagado: 50, monto_pendiente: 70.55, fecha_vencimiento: "2026-06-12", estado: "PENDIENTE" },
    { id: 2, compra_id: 2, proveedor_id: 2, monto_total: 80, monto_pagado: 80, monto_pendiente: 0, fecha_vencimiento: "2026-05-20", estado: "PAGADA" },
  ],
  retenciones: [
    { id: 1, factura_id: 1, numero_retencion: "001-001-000000001", tipo_identificacion_agente: "RUC", identificacion_agente: "0198765432001", razon_social_agente: "Comercial Central", fecha_emision: "2026-05-15", detalles: [{ codigo: "1", descripcion: "Renta", base_imponible: 100, porcentaje: 1, valor: 1 }], total_retenido: 1, estado: "REGISTRADA" },
  ],
  liquidaciones: [
    { id: 1, numero: "001-001-000000001", proveedor_nombre: "Agricultor Demo", proveedor_cedula: "0912345678", fecha_emision: "2026-05-14", subtotal_0: 80, subtotal_15: 120, iva: 18, total: 218, estado_sri: "AUTORIZADA" },
  ],
  guiasRemision: [
    { id: 1, numero: "001-001-000000001", transportista_nombre: "Transportes Andina", transportista_ruc: "0999999999001", fecha_emision: "2026-05-13", punto_partida: "Cuenca", punto_llegada: "Quito", estado_sri: "AUTORIZADA" },
  ],
};

export const mockDashboard = {
  ventas_hoy: 426.8,
  facturas_hoy: 19,
  ticket_promedio: 22.46,
  productos_bajo_stock: 3,
};

export const mockReportes = {
  ventasDia: [{ hora: "09:00", total: 86.4 }, { hora: "12:00", total: 122.3 }, { hora: "16:00", total: 218.1 }],
  ventasRango: [{ fecha: "2026-05-11", total: 320.1 }, { fecha: "2026-05-12", total: 355.2 }, { fecha: "2026-05-13", total: 401.3 }],
  topProductos: [{ producto: "Arroz 1kg", cantidad: 60 }, { producto: "Leche Entera 1L", cantidad: 42 }],
};
