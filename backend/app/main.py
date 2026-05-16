from importlib import import_module
import logging
import subprocess
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import SessionPG, SessionSQLite
from app.core.seed import seed_listas_precio, seed_tarifas_iva, seed_unidades_medida
from app.core.scheduler import start_scheduler
from app.exceptions import FirmaError, SRIConexionError, SRIRechazoError, SRIValidacionError, StockInsuficienteError

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version=settings.APP_VERSION,
)

logger = logging.getLogger(__name__)
app.state.primera_vez = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def include_optional_router(module_path: str) -> None:
    module = import_module(module_path)
    router = getattr(module, "router", None)
    if router is not None:
        app.include_router(router, prefix=settings.API_V1_PREFIX)


for router_module in [
    "app.routers.auth",
    "app.routers.productos",
    "app.routers.personas",
    "app.routers.categorias",
    "app.routers.clientes",
    "app.routers.proveedores",
    "app.routers.usuarios",
    "app.routers.proformas",
    "app.routers.facturas",
    "app.routers.compras",
    "app.routers.notas_credito",
    "app.routers.caja",
    "app.routers.reportes",
    "app.routers.dashboard",
    "app.routers.etiquetas",
    "app.routers.retenciones",
    "app.routers.cuentas",
    "app.routers.inventario",
    "app.routers.sistema",
    "app.routers.setup",
    "app.routers.unidades",
    "app.routers.tarifas_iva",
    "app.routers.precios",
    "app.routers.descuentos",
    "app.routers.liquidaciones",
    "app.routers.guias_remision",
    "app.routers.lotes",
    "app.routers.notificaciones",
    "app.routers.auditoria",
    "app.routers.sync",
    "app.routers.notificaciones_externas",
    "app.routers.establecimientos",
]:
    include_optional_router(router_module)


@app.on_event("startup")
def startup_seed() -> None:
    for p in [
        Path("data"),
        Path("data/comprobantes"),
        Path("data/rides"),
        Path("data/xsd"),
        Path("data/backups"),
        Path("logs"),
    ]:
        p.mkdir(parents=True, exist_ok=True)

    try:
        subprocess.run(["alembic", "upgrade", "head"], check=True, capture_output=True, text=True)
    except Exception:
        logger.exception("No se pudo ejecutar alembic upgrade head")

    session_factory = SessionSQLite if settings.MODO_DESPLIEGUE == "LOCAL" else SessionPG
    db = session_factory()
    try:
        seed_unidades_medida(db)
        seed_tarifas_iva(db)
        seed_listas_precio(db)
        app.state.primera_vez = db.query(import_module("app.models.empresa").Empresa).count() == 0
        start_scheduler()
        logger.info("Inicio FactuTienda backend version=%s modo=%s primera_vez=%s", settings.APP_VERSION, settings.MODO_DESPLIEGUE, app.state.primera_vez)
    finally:
        db.close()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = (time.time() - start) * 1000
    logger.info("%s %s -> %s (%.2fms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.exception_handler(SRIConexionError)
@app.exception_handler(SRIRechazoError)
@app.exception_handler(SRIValidacionError)
@app.exception_handler(FirmaError)
@app.exception_handler(StockInsuficienteError)
async def custom_ex_handler(_: Request, exc: Exception):
    return JSONResponse(status_code=400, content={"error": exc.__class__.__name__, "detail": str(exc)})


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"message": "FactuTienda EC API online"}


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
