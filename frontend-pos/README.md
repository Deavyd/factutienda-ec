# Frontend POS - FactuTienda EC

Aplicacion de punto de venta para operacion diaria en caja.

## Tecnologias

- React + Vite + Tailwind
- Electron (empaquetado .exe fase 2)

## Funcionalidades previstas

- Busqueda rapida por codigo de barras (scanner USB)
- Carrito de ventas agil
- Facturacion en un clic
- Seleccion de sucursal / punto de emision
- Modo offline con sincronizacion posterior
- Impresion de ticket termico
- Lectura de codigo de barras

## Plan Electron

1. Desarrollar app web completa primero
2. Probar flujo offline con SQLite local + cola de sincronizacion
3. Empaquetar con Electron para Windows (.exe)
4. Integrar impresora termica via puerto serial/USB

## Modo offline

- Base de datos local: SQLite (IndexedDB para frontend)
- Cola de sincronizacion: `POST /api/v1/facturas/offline`
- Sincronizacion automatica al recuperar conexion
- Ticket impreso inmediato aunque no haya internet

## Estado actual

- Base Vite + React creada
- Electron scaffold creado (`electron/main.js`, `preload.js`, `splash.html`)
- Barra de estado de conexion implementada (`src/components/StatusBar.jsx`)
- Poll de `GET /api/v1/sistema/estado-conexion` cada 30s

## Instalacion

```bash
cd frontend-pos
npm install
npm run dev
```

Para abrir shell Electron (scaffold):

```bash
npm run electron
```

## Smoke test local (sin empaquetar)

1) Backend local

```bash
cd backend
cp .env.example .env
# Confirmar: MODO_DESPLIEGUE=LOCAL
python run_server.py
```

2) Frontend POS (dev)

```bash
cd frontend-pos
npm install
npm run dev
```

3) Electron

```bash
cd frontend-pos
npm run electron
```

4) Validaciones esperadas

- Electron muestra splash y luego UI POS.
- `StatusBar` consulta `GET /api/v1/sistema/estado-conexion` cada 30s.
- Si no hay internet, estado cambia a contingencia.
- Al cerrar Electron, se crea backup automatico en `backend/data/backups/`.
