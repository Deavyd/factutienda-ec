# Backend/UI desalineado (pendiente)

Este documento lista lo pendiente para terminar la integracion frontend + backend despues de la fase mock/offline.

## 1) Bloqueantes funcionales

- POS: completar flujo de facturacion con respuesta final del backend (numero comprobante, estado SRI, mensaje de autorizacion) para feedback completo post-cobro.
- Etiquetas: estandarizar contrato definitivo de respuesta para descarga (`filename`, `content_base64` o `blob/url`) y aplicar igual para generacion masiva.
- SRI firma/logo: unificar nombres de campos entre backend y UI (`valid/valida`, `fileName/nombre`, `logoUrl/url`) para evitar adaptaciones por pantalla.

## 2) Endpoints existentes que aun no usa la UI

- `establecimientosApi`: CRUD de establecimientos y puntos de emision todavia no expuesto en la pantalla de Configuracion.
- `facturasApi.createOffline` y `facturasApi.reenviar`: falta UI para cola offline, reintentos y reenvio manual a SRI.
- `cajaApi.arqueo`: falta integrarlo en el cierre de caja para mostrar datos del backend en el arqueo final.
- `reportesApi.ventasDia`, `ventasRango`, `topProductos`, `facturasSri`: la vista actual usa solo una parte y aun conserva grafico mock fijo.

## 3) Desalineacion de datos mostrados

- Varias tablas muestran IDs (`cliente_id`, `proveedor_id`) en lugar de nombres; falta resolver relaciones en UI.
- Proformas/CxC: ingreso por ID manual; falta selector de cliente y autocompletado.
- Compras/Proformas: UI con un solo detalle; backend soporta multiples items.

## 4) Contratos backend por cerrar

- Definir payload/response final de `POST /facturas` (totales, impuestos, forma pago, recibido, cambio, estado SRI).
- Definir respuesta oficial de `POST /etiquetas/generar` y `POST /etiquetas/masivo` para descarga.
- Implementar endpoint real para carga de logo de negocio (hoy `uploadBusinessLogo` esta placeholder).

## 5) Checklist sugerido para cierre

1. Cerrar contratos de facturas, etiquetas, firma y logo.
2. Integrar establecimientos/puntos de emision en Configuracion.
3. Implementar cola offline + reenvio de comprobantes.
4. Reemplazar IDs por nombres en tablas operativas.
5. Completar formularios multi-detalle donde aplique.
6. Ejecutar QA final con backend real (`VITE_USE_MOCK=false`).
