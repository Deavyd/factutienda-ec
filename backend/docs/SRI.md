# SRI - Integracion completa

## Comprobantes soportados

| Tipo | Codigo | Estado |
|---|---|---|
| Factura | 01 | Implementado |
| Nota de Credito | 04 | Implementado |
| Liquidacion de Compra | 03 | Implementado |
| Guia de Remision | 06 | Implementado |

## URLs de Web Services SOAP

### Pruebas (Certificacion)

- Recepcion: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- Autorizacion: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`

### Produccion

- Recepcion: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- Autorizacion: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`

URLs configurables via `.env`:
- `SRI_WS_RECEPCION_PRUEBAS`
- `SRI_WS_AUTORIZACION_PRUEBAS`
- `SRI_WS_RECEPCION_PROD`
- `SRI_WS_AUTORIZACION_PROD`

## Flujo de facturacion

1. **Generar clave de acceso** (49 digitos, modulo 11)
   - `app/utils/clave_acceso.py`

2. **Construir XML** contra XSD oficial 2.1.0
   - `app/utils/xml_generator.py`
   - XSD: `data/xsd/factura_v2.1.0.xsd`
   - Validacion estricta antes de retornar

3. **Firmar XML** con certificado .p12 (XAdES-BES)
   - `app/utils/firma.py`
   - Algoritmo: RSA-SHA1, C14N

4. **Enviar a RecepcionComprobantes** (SOAP/zeep)
   - `app/services/sri_service.py:enviar_comprobante`
   - Timeout: 30s, reintentos: 2s/4s/8s

5. **Consultar AutorizacionComprobantes**
   - `app/services/sri_service.py:consultar_autorizacion`
   - Reintentos: 5, espera 3s

6. **Generar RIDE** (PDF con QR)
   - `app/services/sri_service.py:generar_ride`

## Estados SRI

| Estado | Significado | Accion |
|---|---|---|
| RECIBIDA | SRI acepto el XML | Consultar autorizacion |
| DEVUELTA | XML con errores | Corregir y reenviar |
| AUTORIZADA | Factura valida | Entregar RIDE al cliente |
| RECHAZADA | No cumple requisitos | Revisar mensajes SRI |
| CONTINGENCIA | Sin conexion | Cola de sincronizacion |

## Contingencia y offline

- El endpoint `POST /facturas/offline` emite factura sin enviar al SRI
- La operacion se encola en `cola_sincronizacion`
- El scheduler procesa la cola cada 5 minutos
- Reintentos automaticos cada 15 minutos (max 5)

## Errores comunes y solucion

| Error | Causa | Solucion |
|---|---|---|
| Clave acceso invalida | Digito verificador mal | Verificar `clave_acceso.py` |
| XML no valida XSD | Campos faltantes | Activar logs, validar estructura |
| DEVUELTA 43 | Certificado vencido/invalido | Renovar .p12 |
| Timeout SOAP | Sin conectividad | Revisar red, activar contingencia |
| Firma invalida | .p12 corrupto | Recargar certificado |

## Checklist pre-produccion

- [ ] XSD oficial 2.1.0 cargado en `data/xsd/`
- [ ] Certificado .p12 vigente
- [ ] Prueba end-to-end en ambiente 1 (pruebas)
- [ ] Secuenciales por punto de emision configurados
- [ ] Reintentos y logs de SRI activos
- [ ] Backup de certificado guardado externamente
- [ ] RIDE generado correctamente
