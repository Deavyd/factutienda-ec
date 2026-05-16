from enum import Enum

from pydantic import BaseModel


class TamanoEtiqueta(str, Enum):
    sticker_pequeno = "sticker_pequeno"
    sticker_mediano = "sticker_mediano"
    hoja_a4 = "hoja_a4"


class FormatoCodigo(str, Enum):
    CODE128 = "CODE128"
    EAN13 = "EAN13"
    EAN8 = "EAN8"


class EtiquetaConfig(BaseModel):
    tamano: TamanoEtiqueta = TamanoEtiqueta.sticker_mediano
    mostrar_precio: bool = True
    mostrar_qr: bool = False
    mostrar_barcode: bool = True
    formato_codigo: FormatoCodigo = FormatoCodigo.CODE128
    mostrar_logo: bool = False


class GenerarEtiquetaRequest(BaseModel):
    producto_id: int
    cantidad: int = 1
    config: EtiquetaConfig


class ProductoCantidadItem(BaseModel):
    producto_id: int
    cantidad: int = 1


class GenerarEtiquetasMasivoRequest(BaseModel):
    productos: list[ProductoCantidadItem]
    config: EtiquetaConfig


class ArchivoBase64Response(BaseModel):
    filename: str
    content_base64: str
    mime_type: str
