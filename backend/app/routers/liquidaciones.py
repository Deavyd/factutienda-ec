from datetime import date
from decimal import Decimal
from random import randint

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_db
from app.models.liquidacion_compra import LiquidacionCompra
from app.models.detalle_liquidacion import DetalleLiquidacion
from app.models.usuario import Usuario
from app.services.liquidacion_service import procesar_liquidacion_sri
from app.utils.clave_acceso import generar_clave_acceso

settings = get_settings()
router = APIRouter(prefix="/liquidaciones", tags=["liquidaciones"])


def validar_identificacion_proveedor(identificacion: str) -> None:
    if identificacion == "9999999999999":
        raise HTTPException(status_code=400, detail="Consumidor final no permitido en liquidaciones de compra")
    if not (identificacion.isdigit() and len(identificacion) == 10):
        raise HTTPException(status_code=400, detail="La identificacion del proveedor debe ser una cedula valida de 10 digitos")


class DetalleLiqIn(BaseModel):
    descripcion: str
    cantidad: Decimal
    unidad: str
    precio_unitario: Decimal
    descuento: Decimal = Decimal("0")


class LiqCreate(BaseModel):
    establecimiento_id: int
    punto_emision_id: int
    proveedor_nombre: str
    proveedor_cedula: str
    proveedor_direccion: str | None = None
    fecha_emision: date
    detalles: list[DetalleLiqIn]


@router.post("", status_code=status.HTTP_201_CREATED)
def crear(payload: LiqCreate, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    validar_identificacion_proveedor(payload.proveedor_cedula)
    secuencial = str(randint(1, 9999999)).zfill(9)
    numero = f"{str(payload.establecimiento_id).zfill(3)}-{str(payload.punto_emision_id).zfill(3)}-{secuencial}"

    clave = generar_clave_acceso(
        fecha_emision=payload.fecha_emision,
        tipo_comprobante="03",
        ruc=settings.SRI_RUC,
        ambiente=settings.AMBIENTE_SRI,
        serie=f"{str(payload.establecimiento_id).zfill(3)}{str(payload.punto_emision_id).zfill(3)}",
        secuencial=secuencial,
        codigo_numerico=str(randint(1, 99999999)).zfill(8),
        tipo_emision=settings.SRI_EMISION,
    )

    subtotal_0 = Decimal("0")
    subtotal_15 = Decimal("0")
    iva_total = Decimal("0")
    detalles: list[DetalleLiquidacion] = []

    for item in payload.detalles:
        base = (item.cantidad * item.precio_unitario) - item.descuento
        iva = (base * Decimal("15")) / Decimal("100")
        subtotal_15 += base
        iva_total += iva
        detalles.append(
            DetalleLiquidacion(
                descripcion=item.descripcion,
                cantidad=item.cantidad,
                unidad=item.unidad,
                precio_unitario=item.precio_unitario,
                descuento=item.descuento,
                subtotal=base,
                iva=iva,
            )
        )

    total = subtotal_0 + subtotal_15 + iva_total
    liq = LiquidacionCompra(
        empresa_id=user.empresa_id,
        establecimiento_id=payload.establecimiento_id,
        punto_emision_id=payload.punto_emision_id,
        usuario_id=user.id,
        numero=numero,
        proveedor_nombre=payload.proveedor_nombre,
        proveedor_cedula=payload.proveedor_cedula,
        proveedor_direccion=payload.proveedor_direccion,
        fecha_emision=payload.fecha_emision,
        subtotal_0=subtotal_0,
        subtotal_15=subtotal_15,
        iva=iva_total,
        total=total,
        clave_acceso=clave,
        estado_sri="PENDIENTE",
    )
    liq.detalles = detalles
    db.add(liq)
    db.flush()
    procesar_liquidacion_sri(liq.id, db)
    db.commit()
    db.refresh(liq)
    return liq


@router.get("")
def listar(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    return db.query(LiquidacionCompra).filter(LiquidacionCompra.empresa_id == user.empresa_id).order_by(LiquidacionCompra.id.desc()).all()


@router.get("/{lid}")
def get(lid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    liq = db.query(LiquidacionCompra).filter(LiquidacionCompra.id == lid, LiquidacionCompra.empresa_id == user.empresa_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidacion no encontrada")
    return liq


@router.post("/{lid}/reenviar")
def reenviar(lid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    liq = db.query(LiquidacionCompra).filter(LiquidacionCompra.id == lid, LiquidacionCompra.empresa_id == user.empresa_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidacion no encontrada")
    return procesar_liquidacion_sri(lid, db)
