# Frontend Dashboard - FactuTienda EC

Panel administrativo para gestion, reportes y configuracion.

## Tecnologias

- React + Vite
- Tailwind CSS (dark mode)
- React Router v6
- TanStack Query v5
- Axios
- Recharts
- Lucide React

## Modo demo (mock) vs modo real (backend)

El frontend soporta dos modos con un solo switch:

- `VITE_USE_MOCK=true`: usa datos mock en memoria desde `src/api/mockData.js`.
- `VITE_USE_MOCK=false`: usa endpoints reales del backend via `VITE_API_URL`.

La seleccion se centraliza en `src/api/useMock.js` y en la capa `src/api/*.js`.

### Variables de entorno

En `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_USE_MOCK=true
```

## Uso rapido

### Desarrollo local

- Demo cliente (sin backend):

```bash
cp .env.example .env
# dejar VITE_USE_MOCK=true
npm run dev
```

- Integracion real (con backend):

```bash
cp .env.example .env
# cambiar VITE_USE_MOCK=false
npm run dev
```

### Vercel

Configura en el proyecto:

- `VITE_USE_MOCK=true` para demo
- `VITE_USE_MOCK=false` para entorno conectado al backend
- `VITE_API_URL=<url backend>/api/v1` cuando uses modo real

## Checklist de validacion

- `Mock ON`: la app carga datos aunque el backend este apagado.
- `Mock OFF`: la app consume datos reales y refleja cambios del backend.
- Crear/editar/eliminar en productos/clientes/proveedores funciona en ambos modos.

## Estructura base implementada

```
src/
├── api/              # Axios API layer
├── components/layout/ # MainLayout, Sidebar, Topbar
├── pages/
│   ├── Dashboard/    # KPIs y grafico ventas
│   ├── Productos/    # CRUD con modal y paginacion
│   ├── Clientes/     # Tabla de clientes
│   ├── Facturas/     # Listado con filtros y estado SRI
│   ├── Establecimientos/ # Placeholder
│   └── Reportes/     # Placeholder
├── hooks/            # useAuth
├── context/          # AuthContext (JWT login/logout)
├── routes/           # React Router con rutas protegidas
└── utils/            # Formateadores
```

## Estado actual

- Integracion con endpoints reales del backend en la capa API.
- Modo demo global con mock toggle (`VITE_USE_MOCK`).
- Autenticacion JWT integrada.
- Build de produccion validado con Vite.

## Instalacion

```bash
cd frontend-dashboard
npm install
cp .env.example .env
npm run dev
```
