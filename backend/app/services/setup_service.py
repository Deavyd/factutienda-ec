from __future__ import annotations

import base64
from datetime import datetime, timezone

from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates
from zeep import Client
from zeep.transports import Transport

from app.core.config import get_settings
from app.models.usuario import Usuario

settings = get_settings()


def sistema_configurado(db) -> bool:
    return db.query(Usuario).count() > 0


def validar_certificado_p12(p12_bytes: bytes, password: str) -> dict:
    key, cert, _ = load_key_and_certificates(p12_bytes, password.encode("utf-8"))
    if not key or not cert:
        raise ValueError("Certificado .p12 invalido")
    return {
        "propietario": cert.subject.rfc4514_string(),
        "fecha_vencimiento": cert.not_valid_after_utc.isoformat(),
        "vigente": cert.not_valid_after_utc > datetime.now(timezone.utc),
    }


def test_conexion_sri(ambiente: str) -> dict:
    recep = settings.SRI_WS_RECEPCION_PRUEBAS if ambiente == "1" else settings.SRI_WS_RECEPCION_PROD
    auto = settings.SRI_WS_AUTORIZACION_PRUEBAS if ambiente == "1" else settings.SRI_WS_AUTORIZACION_PROD
    out = {}
    for key, url in {"recepcion": recep, "autorizacion": auto}.items():
        try:
            Client(url, transport=Transport(timeout=10))
            out[key] = "ok"
        except Exception as exc:
            out[key] = f"error: {exc}"
    return out
