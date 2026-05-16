from __future__ import annotations

import io
import logging
from decimal import Decimal

import qrcode
from barcode import Code128, EAN8, EAN13
from barcode.writer import ImageWriter
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)


def generar_codigo_barras_imagen(codigo: str, formato: str) -> bytes:
    formato = formato.upper()
    if formato == "EAN13":
        if not (codigo.isdigit() and len(codigo) == 12):
            raise ValueError("EAN13 requiere 12 digitos base")
        cls = EAN13
    elif formato == "EAN8":
        if not (codigo.isdigit() and len(codigo) == 7):
            raise ValueError("EAN8 requiere 7 digitos base")
        cls = EAN8
    elif formato == "CODE128":
        if not codigo:
            raise ValueError("CODE128 requiere codigo no vacio")
        cls = Code128
    else:
        raise ValueError("Formato de codigo no soportado")

    output = io.BytesIO()
    barcode = cls(codigo, writer=ImageWriter())
    barcode.write(output)
    return output.getvalue()


def generar_qr_producto(producto: dict) -> bytes:
    content = f"{producto.get('nombre','')}|{producto.get('precio','')}|{producto.get('codigo','')}"
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(content)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    bio = io.BytesIO()
    img.save(bio, format="PNG")
    return bio.getvalue()


def _dimensiones(config: dict) -> tuple[float, float]:
    size = config.get("tamano", "sticker_mediano")
    if size == "sticker_pequeno":
        return 50 * mm, 30 * mm
    if size == "sticker_mediano":
        return 80 * mm, 40 * mm
    return A4


def _draw_single(c: canvas.Canvas, x: float, y: float, w: float, h: float, producto: dict, config: dict) -> None:
    c.rect(x, y, w, h)
    ty = y + h - 12
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 4, ty, str(producto.get("nombre", ""))[:35])
    ty -= 10
    if config.get("mostrar_precio", True):
        c.setFont("Helvetica", 8)
        precio = Decimal(str(producto.get("precio", 0)))
        c.drawString(x + 4, ty, f"$ {precio:.2f}")
        ty -= 10

    if config.get("mostrar_barcode", True):
        codigo = str(producto.get("codigo", ""))
        fmt = config.get("formato_codigo", "CODE128")
        bar_png = generar_codigo_barras_imagen(codigo, fmt)
        bar_img = Image.open(io.BytesIO(bar_png))
        c.drawImage(ImageReader(bar_img), x + 4, y + 4, width=w * 0.62, height=max(10, h * 0.35), preserveAspectRatio=True)

    if config.get("mostrar_qr", False):
        qr_png = generar_qr_producto(producto)
        qr_img = Image.open(io.BytesIO(qr_png))
        c.drawImage(ImageReader(qr_img), x + w * 0.72, y + 4, width=w * 0.24, height=w * 0.24, preserveAspectRatio=True)


def generar_etiqueta_producto(producto: dict, config: dict) -> bytes:
    """Genera PDF de una etiqueta de producto."""
    logger.info("Generando etiqueta producto=%s", producto.get("id"))
    w, h = _dimensiones(config)
    out = io.BytesIO()
    c = canvas.Canvas(out, pagesize=(w, h))
    _draw_single(c, 0, 0, w, h, producto, config)
    c.showPage()
    c.save()
    return out.getvalue()


def generar_etiquetas_masivo(productos: list, cantidad: int, config: dict) -> bytes:
    """Genera PDF masivo de etiquetas."""
    logger.info("Generando etiquetas masivo productos=%s", len(productos))
    out = io.BytesIO()
    size = config.get("tamano", "sticker_mediano")
    if size == "hoja_a4":
        c = canvas.Canvas(out, pagesize=A4)
        pw, ph = A4
        ew, eh = 50 * mm, 30 * mm
        cols = int(pw // ew)
        rows = int(ph // eh)
        x0, y0 = 0, ph - eh
        idx = 0
        items = []
        for p in productos:
            q = int(p.get("cantidad", cantidad))
            items.extend([p] * q)
        for item in items:
            row = (idx // cols) % rows
            col = idx % cols
            x = x0 + col * ew
            y = y0 - row * eh
            _draw_single(c, x, y, ew, eh, item, config)
            idx += 1
            if idx % (cols * rows) == 0:
                c.showPage()
        c.showPage()
        c.save()
        return out.getvalue()

    w, h = _dimensiones(config)
    c = canvas.Canvas(out, pagesize=(w, h))
    for p in productos:
        q = int(p.get("cantidad", cantidad))
        for _ in range(q):
            _draw_single(c, 0, 0, w, h, p, config)
            c.showPage()
    c.save()
    return out.getvalue()
