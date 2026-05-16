# Configuracion inicial (Wizard)

Guia paso a paso para la primera configuracion de FactuTienda EC.

## Requisitos previos

- Backend corriendo (local o Railway)
- Base de datos PostgreSQL (Supabase) configurada con `DATABASE_URL`
- Archivo `.env` con variables minimas:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `SRI_RUC`
  - `SRI_RAZON_SOCIAL`
  - `SRI_DIR_MATRIZ`

## Paso 1: Verificar estado

```bash
curl http://localhost:8000/api/v1/setup/estado
# {"configurado": false, "pasos_completados": []}
```

## Paso 2: Configurar empresa

```bash
curl -X POST http://localhost:8000/api/v1/setup/empresa \
  -H "Content-Type: application/json" \
  -d '{"ruc":"1799999999001","razon_social":"Mi Tienda SA","nombre_comercial":"Mi Tienda","direccion":"Quito, Ecuador"}'
```

## Paso 3: Configurar establecimiento (sucursal)

```bash
curl -X POST http://localhost:8000/api/v1/setup/establecimiento \
  -H "Content-Type: application/json" \
  -d '{"codigo":"001","nombre":"Matriz","direccion":"Av. Principal 123"}'
```

## Paso 4: Configurar punto de emision

```bash
curl -X POST http://localhost:8000/api/v1/setup/punto-emision \
  -H "Content-Type: application/json" \
  -d '{"establecimiento_id":1,"codigo":"001","descripcion":"Caja Principal"}'
```

## Paso 5: Crear usuario administrador

```bash
curl -X POST http://localhost:8000/api/v1/setup/usuario-admin \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Admin","email":"admin@mitienda.com","password":"MiPassword123","confirmar_password":"MiPassword123"}'
```

## Paso 6: Ambiente SRI

```bash
curl -X POST http://localhost:8000/api/v1/setup/ambiente-sri \
  -H "Content-Type: application/json" \
  -d '{"ambiente":"1"}'
# 1 = pruebas, 2 = produccion
```

## Paso 7: Cargar firma electronica

```bash
curl -X POST http://localhost:8000/api/v1/setup/firma-electronica \
  -H "Content-Type: application/json" \
  -d '{"p12_base64":"<base64 del archivo .p12>","password":"password_del_certificado"}'
```

Respuesta:
```json
{
  "propietario": "CN=EMPRESA DEMO...",
  "fecha_vencimiento": "2027-12-31T...",
  "vigente": true
}
```

## Paso 8: Probar conectividad SRI

```bash
curl http://localhost:8000/api/v1/setup/test-sri?ambiente=1
```

## Despues del setup

- El wizard se bloquea automaticamente cuando existe al menos 1 usuario
- Los endpoints de setup dejan de estar disponibles publicamente
- Para cambios posteriores usar los endpoints de configuracion con autenticacion SUPERADMIN

## Datos seed automaticos

Al iniciar por primera vez, el sistema siembra automaticamente:

- **Unidades de medida**: cm, m, kg, lb, qq, und, doc, L, ml, gal, etc.
- **Tarifas IVA**: 15% (default), 0%, 5%
- **Listas de precio**: Normal (default), Mayorista, VIP
