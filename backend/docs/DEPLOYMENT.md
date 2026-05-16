# Deployment

## Railway (recomendado)

1. Crear proyecto en Railway
2. Conectar repositorio Git
3. Configurar variables de entorno (ver `.env.example`)
4. Railway detecta `railway.json` automaticamente

### railway.json

```json
{
  "build": { "buildCommand": "pip install -r requirements.txt" },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health"
  }
}
```

### Variables de entorno minimas

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | URL completa PostgreSQL (Supabase) |
| `SECRET_KEY` | Clave secreta JWT (generar aleatoria) |
| `SRI_RUC` | RUC de la empresa |
| `SRI_RAZON_SOCIAL` | Razon social |
| `SRI_DIR_MATRIZ` | Direccion matriz |
| `SRI_CERT_PATH` | Ruta al .p12 (ej: data/certs/certificado.p12) |
| `SRI_CERT_PASSWORD` | Password del .p12 |
| `AMBIENTE_SRI` | 1=pruebas, 2=produccion |

### Cargar certificado .p12

- Opcion A: incluir en el repo (solo pruebas)
- Opcion B: subir via endpoint de setup `/api/v1/setup/firma-electronica`
- Opcion C: volumen persistente en Railway

## Docker

```bash
docker build -t factutienda-backend .
docker run -p 8000:8000 --env-file .env factutienda-backend
```

## Supabase (PostgreSQL)

1. Crear proyecto en Supabase
2. Obtener `DATABASE_URL` desde Settings > Database > Connection string
3. Configurar en `.env`

## Migraciones

En Railway se ejecutan como startCommand, pero localmente:

```bash
alembic upgrade head          # aplicar todas
alembic revision --autogenerate -m "descripcion"  # nueva
alembic downgrade -1          # revertir ultima
```

## Healthcheck

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

## Rollback

- Railway: seleccionar deployment anterior y promoverlo
- DB: `alembic downgrade` para revertir cambios de esquema

## Monitoreo

- Logs: Railway Dashboard > Logs
- Errores SRI: `GET /api/v1/reportes/facturas-sri`
- Cola sync: `GET /api/v1/sync/estado`
- Backup: `GET /api/v1/sistema/backups`
