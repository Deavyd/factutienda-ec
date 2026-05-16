from __future__ import annotations

import socket
import time
from datetime import datetime

import requests
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.factura import Factura

settings = get_settings()


def verificar_internet() -> bool:
    try:
        socket.setdefaulttimeout(3)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect(("8.8.8.8", 53))
        return True
    except Exception:
        return False


def verificar_sri(ambiente: str) -> dict:
    internet = verificar_internet()
    if not internet:
        return {
            "internet": False,
            "sri_disponible": False,
            "latencia_ms": 0,
            "ambiente": ambiente,
            "mensaje": "Sin internet",
        }

    url = settings.SRI_WS_RECEPCION_PROD if ambiente == "2" else settings.SRI_WS_RECEPCION_PRUEBAS
    t0 = time.perf_counter()
    try:
        response = requests.get(url, timeout=5)
        latency = int((time.perf_counter() - t0) * 1000)
        ok = response.status_code < 500
        return {
            "internet": True,
            "sri_disponible": ok,
            "latencia_ms": latency,
            "ambiente": ambiente,
            "mensaje": "SRI disponible" if ok else f"SRI responde {response.status_code}",
        }
    except Exception:
        latency = int((time.perf_counter() - t0) * 1000)
        return {
            "internet": True,
            "sri_disponible": False,
            "latencia_ms": latency,
            "ambiente": ambiente,
            "mensaje": "No se pudo conectar con SRI",
        }


def get_estado_sistema(db: Session) -> dict:
    sri = verificar_sri(str(settings.AMBIENTE_SRI))
    pendientes = (
        db.query(Factura)
        .filter(Factura.sri_estado.in_(["CONTINGENCIA", "PENDIENTE", "PENDIENTE_ENVIO", "EN_PROCESO"]))
        .count()
    )
    modo = "TIEMPO_REAL" if sri["internet"] and sri["sri_disponible"] else "CONTINGENCIA"
    return {
        "internet": sri["internet"],
        "sri": sri["sri_disponible"],
        "modo_facturacion": modo,
        "facturas_pendientes_sync": pendientes,
        "ultimo_chequeo": datetime.utcnow().isoformat(),
        "version_sistema": settings.APP_VERSION,
    }
