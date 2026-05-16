from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_bodeguero
from app.models.kardex import Kardex
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.services.inventario_service import registrar_kardex

router = APIRouter(prefix="/inventario", tags=["inventario"])


class AjusteReq(BaseModel):
    producto_id: int
    tipo: str
    cantidad: Decimal
    motivo: str


class ConteoItem(BaseModel):
    producto_id: int
    cantidad_real: Decimal


class ConteoReq(BaseModel):
    productos: list[ConteoItem]


@router.post("/ajuste")
def ajuste(payload: AjusteReq, db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    prod = db.query(Producto).filter(Producto.id == payload.producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    tipo = payload.tipo.upper()
    if tipo not in {"PERDIDA", "DANO", "CONTEO", "ENTRADA"}:
        raise HTTPException(status_code=400, detail="Tipo invalido")
    mov_tipo = "AJUSTE"
    if tipo in {"PERDIDA", "DANO"}:
        prod.stock_actual -= payload.cantidad
    else:
        prod.stock_actual += payload.cantidad
    registrar_kardex(prod.id, mov_tipo, payload.cantidad, prod.costo_promedio, payload.motivo, db)
    db.commit()
    return {"producto_id": prod.id, "stock_actual": prod.stock_actual}


@router.get("/ajustes")
def ajustes(db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    return db.query(Kardex).filter(Kardex.tipo_movimiento == "AJUSTE").order_by(Kardex.id.desc()).all()


@router.post("/conteo-fisico")
def conteo_fisico(payload: ConteoReq, db: Session = Depends(get_db), _: Usuario = Depends(require_bodeguero)):
    diferencias = []
    for item in payload.productos:
        prod = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not prod:
            continue
        diff = item.cantidad_real - prod.stock_actual
        if diff != 0:
            prod.stock_actual = item.cantidad_real
            registrar_kardex(prod.id, "AJUSTE", abs(diff), prod.costo_promedio, "CONTEO_FISICO", db)
            diferencias.append({"producto_id": prod.id, "diferencia": diff})
    db.commit()
    return {"diferencias": diferencias}
