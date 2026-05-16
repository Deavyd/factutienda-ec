from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import SessionPG, SessionSQLite
from app.core.config import get_settings
from app.services.backup_service import backup_base_datos
from app.services.notificacion_service import (
    verificar_facturas_sri_pendientes,
    verificar_y_notificar_stock,
    verificar_y_notificar_vencimientos,
)
from app.services.sync_service import procesar_cola, reintentar_errores

scheduler = BackgroundScheduler()
settings = get_settings()


def _db_session():
    if settings.DATABASE_MODE == "local":
        return SessionSQLite()
    return SessionPG()


def _check_stock() -> None:
    db = _db_session()
    try:
        verificar_y_notificar_stock(db)
    finally:
        db.close()


def _check_sri() -> None:
    db = _db_session()
    try:
        verificar_facturas_sri_pendientes(db)
    finally:
        db.close()


def _check_vencimientos() -> None:
    db = _db_session()
    try:
        verificar_y_notificar_vencimientos(db)
    finally:
        db.close()


def _auto_backup() -> None:
    db = _db_session()
    try:
        backup_base_datos(db)
    finally:
        db.close()


def _process_cola() -> None:
    db = _db_session()
    try:
        procesar_cola(db)
    finally:
        db.close()


def _retry_errors() -> None:
    db = _db_session()
    try:
        reintentar_errores(db)
    finally:
        db.close()


def start_scheduler() -> None:
    scheduler.add_job(_check_stock, "interval", minutes=30, id="check_stock")
    scheduler.add_job(_check_sri, "interval", minutes=60, id="check_sri")
    scheduler.add_job(_check_vencimientos, "cron", hour=8, id="check_vencimientos")
    scheduler.add_job(_auto_backup, "cron", day_of_week="sun", hour=2, id="auto_backup")
    scheduler.add_job(_process_cola, "interval", minutes=5, id="process_cola")
    scheduler.add_job(_retry_errors, "interval", minutes=15, id="retry_errors")
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
