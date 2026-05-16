# SRI 2026 - Guia Critica de Cumplimiento (FactuTienda EC)

Este documento resume el rehackeo completo y actualizado de la integracion SRI (mayo 2026) para FactuTienda EC.

> Este modulo es critico: errores de cumplimiento pueden causar multas, rechazos de comprobantes e inhabilitacion operativa.

## 1) Requisitos obligatorios (no negociables)

- **Firma electronica valida**: certificado `.p12` o token vigente, emitido por entidad autorizada (BCE, Security Data, ANF, etc.).
- **RUC y configuracion SRI activos**: establecimientos y puntos de emision autorizados en SRI en linea.
- **Pruebas antes de produccion**: toda version debe certificar en ambiente de pruebas.
- **Transmision inmediata (desde 2026-01-01)**: emision y envio en tiempo real, sin periodo de gracia.
- **Conservacion documental**: XML firmado, RIDE y logs por minimo 7 anios.

## 2) Web services oficiales SRI (SOAP)

El SRI opera con servicios SOAP/XML (no REST).

### Ambiente de pruebas (certificacion)
- Recepcion: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- Autorizacion: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`

### Ambiente de produccion
- Recepcion: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- Autorizacion: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`

## 3) Flujo obligatorio SRI

1. Generar XML valido contra XSD SRI vigente (2.32 o superior).
2. Firmar XML con firma electronica (XAdES-BES).
3. Enviar XML firmado a RecepcionComprobantes.
4. Si respuesta es `RECIBIDA`, consultar AutorizacionComprobantes por clave de acceso.
5. Si estado final es `AUTORIZADO`, generar RIDE y almacenar evidencias.

## 4) Elementos criticos que no pueden fallar

| Elemento | Riesgo | Manejo recomendado |
|---|---|---|
| Clave de acceso | Rechazo por formato o digito verificador | Funcion dedicada, pruebas unitarias y validacion modulo 11 |
| Secuencial | Colisiones o saltos por concurrencia | Actualizacion atomica por punto de emision |
| Fecha/hora emision | Incumplimiento de transmision inmediata | Generar timestamp actual, bloquear fechas antiguas |
| Estructura XML | DEVUELTA por validacion XSD | Templates validados + validacion previa a envio |
| Firma XAdES-BES | Rechazo tributario | Libreria robusta (`signxml`/equivalente) y certificados controlados |
| Contingencia | Interrupcion operativa por conectividad | Cola local + sincronizacion posterior |
| Reintentos/logs | Perdida de trazabilidad y reprocesos manuales | Reintentos (3-5) con backoff + log por intento/codigo |

## 5) Flujo recomendado en backend FastAPI

1. Usuario confirma venta.
2. Backend crea factura interna en estado `pendiente_sri`.
3. Generar clave de acceso (49 digitos).
4. Construir XML completo del comprobante.
5. Firmar XML con certificado `.p12`.
6. Enviar a recepcion SRI y guardar respuesta raw + estado.
7. Consultar autorizacion (polling o job en background).
8. Si `AUTORIZADO`: generar RIDE, cerrar factura, descontar stock y persistir artefactos.
9. Registrar trazabilidad y opcionalmente notificar al cliente.

## 6) Recomendaciones fuertes para reducir riesgo

- Operar primero en ambiente de pruebas hasta cerrar casos de error comunes.
- Persistir todo: XML sin firma, XML firmado, respuestas SRI, RIDE, logs tecnicos.
- Implementar reintentos automaticos con backoff exponencial (3-5 intentos).
- Validar identificacion (RUC/cedula) antes de emitir.
- Exponer un dashboard de errores SRI para soporte operativo.
- Evaluar pasarela intermedia (Olimpush, Edicom, FacturadorPro, etc.) para v1 si se busca menor complejidad de firma/SOAP.

## 7) Estados recomendados en sistema

- `PENDIENTE_ENVIO`
- `ENVIADA_SRI`
- `RECIBIDA`
- `DEVUELTA`
- `AUTORIZADA`
- `RECHAZADA`
- `ERROR_TECNICO`

Registrar transiciones con fecha/hora, codigo/mensaje SRI e intentos.

## 8) Prompt listo para implementacion del servicio SRI

```text
Crea el servicio completo para integracion SRI en FastAPI (app/services/sri_service.py y utils relacionados).

Incluye:
- Funcion para generar Clave de Acceso (49 digitos)
- Funcion para generar XML de Factura (usando templates o lxml)
- Funcion para firmar XML con .p12 (signxml)
- Funcion para enviar a RecepcionComprobantes (usando zeep o httpx)
- Funcion para consultar AutorizacionComprobantes
- Manejo de estados (RECIBIDA, DEVUELTA, AUTORIZADO, RECHAZADO)
- Generacion de RIDE (basico)
- Soporte para ambiente Pruebas / Produccion
- Logging completo y manejo de errores comunes del SRI

Usa las URLs oficiales actualizadas 2026.
```

## 9) Checklist minimo antes de pasar a produccion

- [ ] Certificado digital vigente y probado.
- [ ] Secuenciales por punto de emision con control concurrente.
- [ ] XML validado contra XSD vigente.
- [ ] Firma XAdES-BES validada.
- [ ] Reintentos y observabilidad activos.
- [ ] Evidencias (XML/RIDE/logs) persistidas.
- [ ] Pruebas de punta a punta en ambiente certificacion.
