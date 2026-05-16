from __future__ import annotations

import logging
from urllib.request import Request, urlopen

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def enviar_whatsapp(numero: str, mensaje: str) -> bool:
    provider = settings.WHATSAPP_PROVIDER or "none"
    if provider == "none":
        return False
    if provider == "callmebot":
        return _send_callmebot(numero, mensaje)
    if provider == "twilio":
        return _send_twilio(numero, mensaje)
    return False


def enviar_factura_whatsapp(factura_id: int, numero_cliente: str, db) -> bool:
    from app.models.factura import Factura
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        return False
    msg = (
        f"Factura #{factura.numero_comprobante}\n"
        f"Total: ${factura.total}\n"
        f"Autorizacion: {factura.sri_autorizacion or 'Pendiente'}\n"
        f"Gracias por su compra - {settings.SRI_RAZON_SOCIAL}"
    )
    return enviar_whatsapp(numero_cliente, msg)


def recordatorio_deuda_whatsapp(cliente_id: int, db) -> bool:
    from app.models.persona import Persona
    cliente = db.query(Persona).filter(Persona.id == cliente_id).first()
    if not cliente or not cliente.telefono:
        return False
    msg = f"{cliente.razon_social}, recuerde su pago pendiente con {settings.SRI_RAZON_SOCIAL}"
    return enviar_whatsapp(cliente.telefono, msg)


def _send_callmebot(numero: str, mensaje: str) -> bool:
    if not settings.CALLMEBOT_API_KEY:
        return False
    try:
        import urllib.parse
        encoded = urllib.parse.quote(mensaje)
        url = f"https://api.callmebot.com/whatsapp.php?phone={numero}&text={encoded}&apikey={settings.CALLMEBOT_API_KEY}"
        req = Request(url)
        with urlopen(req, timeout=15) as resp:
            resp.read()
        logger.info("WhatsApp CallMeBot enviado a %s", numero)
        return True
    except Exception:
        logger.exception("Error CallMeBot a %s", numero)
        return False


def _send_twilio(numero: str, mensaje: str) -> bool:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return False
    try:
        from urllib.parse import urlencode
        data = urlencode({
            "To": f"whatsapp:{numero}",
            "From": f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
            "Body": mensaje,
        }).encode("utf-8")
        from base64 import b64encode
        auth = b64encode(f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}".encode()).decode()
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        req = Request(url, data=data, headers={"Authorization": f"Basic {auth}"})
        with urlopen(req, timeout=15) as resp:
            resp.read()
        logger.info("WhatsApp Twilio enviado a %s", numero)
        return True
    except Exception:
        logger.exception("Error Twilio a %s", numero)
        return False
