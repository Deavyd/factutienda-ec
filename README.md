# FactuTienda EC

![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)
![SQLite](https://img.shields.io/badge/SQLite-Offline-003B57)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Railway](https://img.shields.io/badge/Deploy-Railway-111111)
![Python](https://img.shields.io/badge/Python-3.11+-blue)

Sistema completo de facturacion electronica SRI, inventario, caja, operaciones multi-sucursal y comunicaciones para tiendas en Ecuador.

## Arquitectura

| Capa | Tecnologia | Hosting |
|---|---|---|
| Backend API | FastAPI (Python 3.11+) | Railway |
| Base de datos principal | PostgreSQL | Supabase |
| Base de datos offline | SQLite | Local (POS) |
| Dashboard Admin | React + Vite + Tailwind | Vercel |
| POS (Caja) | React + Electron | Windows .exe |

## Modulos implementados

### Core
- Autenticacion JWT con roles granulares: SUPERADMIN, ADMIN, CAJERO, BODEGUERO, CONTADOR
- Configuracion dual DB (Supabase PostgreSQL + SQLite local)
- Migraciones Alembic con soporte autogenerate
- Scheduler de tareas automaticas (APScheduler)
- Auditoria completa de operaciones
- Backup automatico programado

### SRI Ecuador
- Facturas electronicas (tipo 01)
- Notas de credito (tipo 04)
- Liquidaciones de compra (tipo 03)
- Guias de remision (tipo 06)
- Firma electronica XAdES-BES con .p12
- Validacion contra XSD oficial 2.1.0
- Clave de acceso 49 digitos modulo 11
- Modo contingencia + cola de sincronizacion offline

### Inventario
- Productos con unidades de medida y conversiones
- Gestion de lotes con fechas de vencimiento (FEFO)
- Productos compuestos / combos / kits
- Kardex automatico en cada movimiento
- Ajustes manuales y conteo fisico
- Alertas de stock minimo y vencimientos

### Ventas y Caja
- Facturacion con multiples formas de pago
- Listas de precios por cliente (Normal, Mayorista, VIP)
- Descuentos configurables (porcentaje/valor, producto/total)
- Turnos de caja: apertura, arqueo, cierre
- Cuentas por cobrar con gestion de abonos
- Validacion de credito por cliente

### Compras
- Registro de compras con conversion automatica de unidades
- Cuentas por pagar con control de vencimientos
- Liquidaciones de compra SRI

### Tarifas y configuracion
- Tarifas IVA configurables (0%, 5%, 15%) con codigos SRI
- Unidades de medida con factores de conversion
- Precios por lista y por producto
- Wizard de configuracion inicial

### Comunicacion
- Email via SMTP nativo (Gmail, Outlook, propio)
- WhatsApp via CallMeBot (gratuito) o Twilio
- Notificaciones internas con scheduler

### Hardware
- Impresora termica ESC/POS
- Generador de etiquetas con codigos de barras
- Codigos QR para productos y facturas
- Soporte scanner codigo de barras USB

### Reportes y exportacion
- Reportes de ventas, stock, Kardex, IVA, productos top
- Exportacion Excel (.xlsx) y PDF
- Dashboard con KPIs en tiempo real

### Sincronizacion y respaldo
- Cola de sincronizacion offline para POS
- Reintentos automaticos con backoff
- Backup de base de datos a ZIP programado

## Estructura del monorepo

```
factutienda-ec/
├── backend/                  # FastAPI (completo)
├── frontend-dashboard/       # React + Vite (base lista)
├── frontend-pos/             # React (futuro Electron)
├── docs/                     # Documentacion tecnica
└── shared/                   # Tipos compartidos (opcional)
```

## Requisitos previos

- Python 3.11+
- PostgreSQL (via Supabase o local)
- Node.js 18+ (para frontends)
- Cuenta en Supabase
- Certificado digital .p12 vigente (para SRI produccion)

## Instalacion local

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # editar con credenciales reales
uvicorn app.main:app --reload
```

## Variables de entorno clave

Ver `.env.example` en `backend/` para la lista completa. Las mas importantes:

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | URL conexion PostgreSQL (Supabase) |
| `SECRET_KEY` | Clave secreta para JWT |
| `AMBIENTE_SRI` | 1=pruebas, 2=produccion |
| `SRI_CERT_PATH` | Ruta al .p12 |
| `SRI_CERT_PASSWORD` | Password del .p12 |

## Ejecutar tests

```bash
cd backend
pytest
```

## Roadmap

- [x] Backend completo (todos los modulos)
- [ ] Conectar frontend dashboard al backend
- [ ] Implementar POS operativo completo
- [ ] Empaquetar POS con Electron (.exe)
- [ ] Certificar SRI en produccion
- [ ] App movil para consultas basicas

## Licencia

Uso interno / privado de FactuTienda EC.
