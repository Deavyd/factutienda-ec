# Backend FactuTienda EC

API FastAPI completa para facturacion electronica SRI, inventario, caja, reportes y gestion empresarial multi-sucursal en Ecuador.

## Stack

- **FastAPI** (Python 3.11+)
- **SQLAlchemy 2.0** + Alembic
- **PostgreSQL** (Supabase) + **SQLite** (offline)
- **JWT** (python-jose + passlib)
- **Pydantic v2** (Settings + schemas)
- **lxml** + **signxml** (SRI XML y firma)
- **zeep** (SOAP SRI)
- **reportlab** (RIDE, etiquetas, reportes PDF)
- **APScheduler** (tareas programadas)

## Estructura de carpetas

```
backend/
├── app/
│   ├── core/           # config, database, security, dependencies, scheduler, seed
│   ├── models/         # SQLAlchemy (30+ modelos)
│   ├── schemas/        # Pydantic request/response
│   ├── routers/        # Endpoints (20+ modulos)
│   ├── services/       # Logica de negocio
│   ├── utils/          # XML, firma, clave acceso, codigos, etiquetas, exportador
│   └── main.py
├── alembic/            # Migraciones
├── tests/              # pytest
├── data/               # comprobantes, rides, xsd, certs, sqlite, backups
├── logs/
├── .env.example
├── requirements.txt
├── Dockerfile
└── railway.json
```

## Endpoints por modulo

### Auth (`/api/v1/auth`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /auth/login | Login con email + password |
| POST | /auth/refresh | Refrescar token |
| GET | /auth/me | Datos del usuario actual |

### Productos (`/api/v1/productos`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /productos | Listar productos |
| GET | /productos/{id} | Detalle producto |
| POST | /productos | Crear producto |
| PUT | /productos/{id} | Editar producto |
| DELETE | /productos/{id} | Eliminar producto |

### Personas (`/api/v1/personas`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /personas | Listar clientes/proveedores |
| GET | /personas/{id} | Detalle persona |
| POST | /personas | Crear persona |
| PUT | /personas/{id} | Editar persona |
| DELETE | /personas/{id} | Eliminar persona |

### Facturas (`/api/v1/facturas`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /facturas | Crear y enviar al SRI |
| POST | /facturas/offline | Crear en contingencia con cola |
| GET | /facturas | Listar facturas |
| GET | /facturas/{id} | Detalle factura |
| POST | /facturas/{id}/reenviar | Reenviar al SRI |

### Notas de credito (`/api/v1/notas-credito`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /notas-credito | Crear nota de credito |
| GET | /notas-credito | Listar notas |
| GET | /notas-credito/{id} | Detalle nota |

### Compras (`/api/v1/compras`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /compras | Registrar compra |
| GET | /compras | Listar compras |
| GET | /compras/{id} | Detalle compra |
| PUT | /compras/{id} | Editar en BORRADOR |

### Liquidaciones (`/api/v1/liquidaciones`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /liquidaciones | Crear y enviar SRI (tipo 03) |
| GET | /liquidaciones | Listar liquidaciones |
| GET | /liquidaciones/{id} | Detalle |
| POST | /liquidaciones/{id}/reenviar | Reenviar |

### Guias de remision (`/api/v1/guias-remision`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /guias-remision | Crear y enviar SRI (tipo 06) |
| GET | /guias-remision | Listar guias |
| GET | /guias-remision/{id} | Detalle |
| POST | /guias-remision/{id}/reenviar | Reenviar |

### Retenciones (`/api/v1/retenciones`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /retenciones | Registrar retencion |
| GET | /retenciones | Listar |
| GET | /retenciones/{id} | Detalle |
| PUT | /retenciones/{id}/anular | Anular |
| GET | /retenciones/reporte/{anio}/{mes} | Reporte mensual |

### Caja (`/api/v1/caja`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /caja/abrir | Abrir turno |
| POST | /caja/cerrar | Cerrar turno + arqueo |
| GET | /caja/turno-actual | Turno abierto actual |
| GET | /caja/arqueo/{turno_id} | Resumen arqueo |
| POST | /caja/movimiento | Registrar gasto/reporte |

### Establecimientos (`/api/v1/establecimientos`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /establecimientos | Listar establecimientos |
| POST | /establecimientos | Crear |
| PUT | /establecimientos/{id} | Editar |
| DELETE | /establecimientos/{id} | Eliminar |
| GET/POST/PUT/DELETE | /puntos-emision | CRUD puntos emision |

### Inventario (`/api/v1/inventario`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /inventario/ajuste | Ajuste de stock |
| GET | /inventario/ajustes | Historial ajustes |
| POST | /inventario/conteo-fisico | Conteo y diferencias |

### Lotes (`/api/v1/lotes`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /lotes | Listar lotes |
| POST | /lotes | Crear lote |
| PUT | /lotes/{id} | Editar lote |
| POST | /lotes/{id}/ajustar | Ajustar cantidad |
| GET | /lotes/proximos-vencer | Proximos a vencer |
| GET | /lotes/vencidos | Lotes vencidos |

### Etiquetas (`/api/v1/etiquetas`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /etiquetas/generar | Generar etiqueta PDF |
| POST | /etiquetas/masivo | Generar multiples etiquetas |
| GET | /etiquetas/preview/{producto_id} | Preview PNG |

### Unidades (`/api/v1/unidades`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /unidades | Listar unidades |
| GET | /unidades/tipos | Tipos disponibles |
| POST | /unidades | Crear unidad |
| PUT | /unidades/{id} | Editar |
| DELETE | /unidades/{id} | Desactivar |
| POST | /unidades/convertir | Convertir entre unidades |

### Tarifas IVA (`/api/v1/tarifas-iva`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /tarifas-iva | Listar tarifas |
| POST | /tarifas-iva | Crear tarifa |
| PUT | /tarifas-iva/{id} | Editar |
| PUT | /tarifas-iva/{id}/default | Marcar default |

### Precios y Descuentos (`/api/v1/precios`, `/api/v1/descuentos`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /precios/listas-precio | Listar listas |
| POST | /precios/listas-precio | Crear lista |
| PUT | /precios/listas-precio/{id} | Editar |
| POST | /precios/productos/{id}/precios | Asignar precio |
| GET | /precios/productos/{id}/precios | Ver precios |
| GET | /descuentos | Listar descuentos |
| POST | /descuentos | Crear descuento |
| PUT | /descuentos/{id} | Editar |
| DELETE | /descuentos/{id} | Desactivar |
| GET | /descuentos/aplicables | Descuentos aplicables |

### Cuentas (`/api/v1/cuentas`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /cuentas/cobrar | Cuentas por cobrar |
| GET | /cuentas/pagar | Cuentas por pagar |
| POST | /cuentas/cobrar/{id}/pagar | Registrar abono |
| POST | /cuentas/pagar/{id}/pagar | Registrar abono |
| GET | /cuentas/resumen | Totales pendientes/vencidos |

### Reportes (`/api/v1/reportes`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /reportes/ventas-dia | Ventas del dia |
| GET | /reportes/ventas-rango | Ventas por rango |
| GET | /reportes/stock-actual | Stock actual |
| GET | /reportes/kardex | Movimientos Kardex |
| GET | /reportes/facturas-sri | Facturas por estado SRI |
| GET | /reportes/top-productos | Productos mas vendidos |
| GET | /reportes/iva-mensual | Formulario 104 SRI |
| GET | /reportes/liquidaciones | Liquidaciones de compra |
| GET | /reportes/guias-remision | Guias de remision |
| GET | /reportes/vencimientos | Productos proximos a vencer |

### Dashboard (`/api/v1/dashboard`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /dashboard/resumen | KPIs unificados |

### Sincronizacion (`/api/v1/sync`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /sync/estado | Estado cola |
| POST | /sync/procesar | Procesar cola |
| GET | /sync/cola | Ver operaciones pendientes |
| POST | /sync/reintentar | Reintentar errores |
| DELETE | /sync/cola/{id} | Eliminar de cola |

### Sistema y Backup (`/api/v1/sistema`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /sistema/backup | Backup manual |
| GET | /sistema/backups | Listar backups |
| GET | /sistema/info | Info del sistema |
| POST | /sistema/configuracion | Actualizar config |

### Notificaciones (`/api/v1/notificaciones`, `/api/v1/enviar`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /notificaciones | Mis notificaciones |
| GET | /notificaciones/no-leidas/count | Contador no leidas |
| PUT | /notificaciones/{id}/leer | Marcar leida |
| PUT | /notificaciones/leer-todas | Marcar todas |
| DELETE | /notificaciones/{id} | Eliminar |
| POST | /enviar/factura-email/{id} | Enviar factura email |
| POST | /enviar/factura-whatsapp/{id} | Enviar WhatsApp |
| POST | /enviar/test-email | Probar SMTP |
| POST | /enviar/test-whatsapp | Probar WhatsApp |

### Auditoria (`/api/v1/auditoria`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /auditoria | Consultar con filtros |
| GET | /auditoria/exportar | Exportar Excel |

### Setup (`/api/v1/setup`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /setup/estado | Verificar si esta configurado |
| POST | /setup/empresa | Configurar empresa |
| POST | /setup/establecimiento | Configurar sucursal |
| POST | /setup/punto-emision | Configurar punto emision |
| POST | /setup/usuario-admin | Crear superadmin |
| POST | /setup/firma-electronica | Subir .p12 |
| POST | /setup/ambiente-sri | Elegir pruebas/prod |
| GET | /setup/test-sri | Probar conectividad SRI |

## Instalacion

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Smoke test SRI 2026 (rapido)

Validacion local de reglas criticas (sin tocar SRI real):

```bash
cd backend
python scripts/smoke_sri_2026.py
```

Validacion local + API (incluye rechazo de consumidor final en liquidaciones):

```bash
cd backend
python scripts/smoke_sri_2026.py \
  --api-url "http://localhost:8000/api/v1" \
  --email "admin@factutienda.ec" \
  --password "tu_password"
```

## Docker

```bash
docker build -t factutienda-backend .
docker run -p 8000:8000 --env-file .env factutienda-backend
```

## Deploy Railway

1. Conectar repo en Railway
2. Variables de entorno: configurar segun `.env.example`
3. Healthcheck: `GET /health`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Flujo SRI paso a paso

1. Generar XML factura contra XSD 2.1.0
2. Firmar con XAdES-BES (.p12)
3. Enviar a RecepcionComprobantes (SOAP/zeep)
4. Si RECIBIDA: consultar AutorizacionComprobantes
5. Si AUTORIZADA: generar RIDE + persistir evidencias
6. Notificar al cliente (email/WhatsApp si configurado)

## Roles y permisos

| Rol | Acceso |
|---|---|
| SUPERADMIN | Todo, incluyendo configuracion sistema |
| ADMIN | Gestion, reportes, auditoria |
| CAJERO | Ventas, caja, turnos |
| BODEGUERO | Inventario, ajustes, lotes |
| CONTADOR | Retenciones, cuentas, reportes financieros |

## Como cargar la firma electronica

1. Colocar `.p12` en `data/certs/`
2. Configurar en `.env`: `SRI_CERT_PATH` y `SRI_CERT_PASSWORD`
3. O via setup wizard: `POST /api/v1/setup/firma-electronica` con base64
