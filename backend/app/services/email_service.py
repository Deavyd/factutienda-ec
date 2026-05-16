from __future__ import annotations

import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def enviar_email(destinatario: str, asunto: str, cuerpo_html: str, adjuntos: list[str] | None = None) -> bool:
    if not settings.SMTP_HOST:
        logger.info("SMTP no configurado, omitiendo envio")
        return False
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_USER or "factutienda@localhost"
        msg["To"] = destinatario
        msg["Subject"] = asunto
        msg.attach(MIMEText(cuerpo_html, "html", "utf-8"))

        if adjuntos:
            for path in adjuntos:
                p = Path(path)
                if p.exists():
                    with p.open("rb") as f:
                        part = MIMEApplication(f.read(), name=p.name)
                        part["Content-Disposition"] = f'attachment; filename="{p.name}"'
                        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email enviado a %s", destinatario)
        return True
    except Exception:
        logger.exception("Error enviando email a %s", destinatario)
        return False


def enviar_factura_email(factura_id: int, email_cliente: str, db) -> bool:
    from app.models.factura import Factura
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        return False
    html = template_email_factura(factura)
    ride_path = None
    try:
        from app.services.sri_service import generar_ride
        ride_path = generar_ride("", factura_id)
    except Exception:
        pass
    adjuntos = [ride_path] if ride_path else []
    return enviar_email(email_cliente, f"Factura {factura.numero_comprobante} - {settings.SRI_RAZON_SOCIAL}", html, adjuntos)


def template_email_factura(factura) -> str:
    total = getattr(factura, "total", 0)
    numero = getattr(factura, "numero_comprobante", "")
    autorizacion = getattr(factura, "sri_autorizacion", "") or ""

    items_html = ""
    for d in getattr(factura, "detalles", []):
        items_html += f"<tr><td>{d.descripcion}</td><td>{d.cantidad}</td><td>{d.precio_unitario}</td><td>{d.total_linea}</td></tr>"

    return f"""
    <html><body style="font-family:sans-serif">
    <h2>{settings.SRI_RAZON_SOCIAL}</h2>
    <p>Factura: <strong>{numero}</strong></p>
    <p>Autorizacion: {autorizacion}</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
      <tr><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Total</th></tr>
      {items_html}
    </table>
    <p style="font-size:18px;font-weight:bold">Total: ${total}</p>
    <p>Gracias por su compra</p>
    </body></html>"""
