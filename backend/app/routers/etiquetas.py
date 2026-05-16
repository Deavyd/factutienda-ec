from __future__ import annotations

import base64
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.etiqueta import ArchivoBase64Response, GenerarEtiquetaRequest, GenerarEtiquetasMasivoRequest
from app.utils.etiquetas import generar_etiqueta_producto, generar_etiquetas_masivo, generar_qr_producto

router = APIRouter(prefix="/etiquetas", tags=["etiquetas"])


def _producto_dict(p: Producto, cantidad: int = 1) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "precio": str(p.precio_sin_iva),
        "codigo": p.codigo_barras or p.codigo_interno,
        "cantidad": cantidad,
    }


@router.post("/generar", response_model=ArchivoBase64Response)
def generar(req: GenerarEtiquetaRequest, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)) -> ArchivoBase64Response:
    p = db.query(Producto).filter(Producto.id == req.producto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if req.cantidad <= 0:
        raise HTTPException(status_code=400, detail="Cantidad invalida")
    pdf = generar_etiquetas_masivo([_producto_dict(p, req.cantidad)], req.cantidad, req.config.model_dump())
    return ArchivoBase64Response(
        filename=f"etiqueta_{p.id}.pdf",
        content_base64=base64.b64encode(pdf).decode("utf-8"),
        mime_type="application/pdf",
    )


@router.post("/masivo", response_model=ArchivoBase64Response)
def generar_masivo(req: GenerarEtiquetasMasivoRequest, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)) -> ArchivoBase64Response:
    items = []
    for item in req.productos:
        p = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not p:
            raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
        items.append(_producto_dict(p, item.cantidad))

    pdf = generar_etiquetas_masivo(items, 1, req.config.model_dump())
    return ArchivoBase64Response(
        filename="etiquetas_masivo.pdf",
        content_base64=base64.b64encode(pdf).decode("utf-8"),
        mime_type="application/pdf",
    )


@router.get("/preview/{producto_id}")
def preview(producto_id: int, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    png = generar_qr_producto(_producto_dict(p))
    return StreamingResponse(io.BytesIO(png), media_type="image/png")
