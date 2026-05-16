from datetime import date
from decimal import Decimal
from random import randint

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_db
from app.models.guia_remision import GuiaRemision
from app.models.detalle_guia import DetalleGuia
from app.models.usuario import Usuario
from app.services.guia_service import procesar_guia_sri
from app.utils.clave_acceso import generar_clave_acceso

settings = get_settings()
router = APIRouter(prefix="/guias-remision", tags=["guias-remision"])


class DetalleGuiaIn(BaseModel):
    producto_id: int
    cantidad: Decimal
    unidad_id: int | None = None
    descripcion: str


class GuiaCreate(BaseModel):
    establecimiento_origen_id: int
    fecha_emision: date
    fecha_inicio_transporte: date
    fecha_fin_transporte: date
    transportista_ruc: str
    transportista_nombre: str
    placa_vehiculo: str | None = None
    punto_partida: str
    punto_llegada: str
    motivo_traslado: str
    factura_id: int | None = None
    establecimiento_destino_id: int | None = None
    detalles: list[DetalleGuiaIn]


@router.post("", status_code=status.HTTP_201_CREATED)
def crear(payload: GuiaCreate, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    secuencial = str(randint(1, 9999999)).zfill(9)
    numero = f"{str(payload.establecimiento_origen_id).zfill(3)}-001-{secuencial}"

    clave = generar_clave_acceso(
        fecha_emision=payload.fecha_emision,
        tipo_comprobante="06",
        ruc=settings.SRI_RUC,
        ambiente=settings.AMBIENTE_SRI,
        serie=f"{str(payload.establecimiento_origen_id).zfill(3)}001",
        secuencial=secuencial,
        codigo_numerico=str(randint(1, 99999999)).zfill(8),
        tipo_emision=settings.SRI_EMISION,
    )

    guia = GuiaRemision(
        empresa_id=user.empresa_id,
        establecimiento_origen_id=payload.establecimiento_origen_id,
        usuario_id=user.id,
        numero=numero,
        fecha_emision=payload.fecha_emision,
        fecha_inicio_transporte=payload.fecha_inicio_transporte,
        fecha_fin_transporte=payload.fecha_fin_transporte,
        transportista_ruc=payload.transportista_ruc,
        transportista_nombre=payload.transportista_nombre,
        placa_vehiculo=payload.placa_vehiculo,
        punto_partida=payload.punto_partida,
        punto_llegada=payload.punto_llegada,
        motivo_traslado=payload.motivo_traslado,
        establecimiento_destino_id=payload.establecimiento_destino_id,
        factura_id=payload.factura_id,
        clave_acceso=clave,
        estado_sri="PENDIENTE",
    )

    detalles = [
        DetalleGuia(
            producto_id=d.producto_id,
            cantidad=d.cantidad,
            unidad_id=d.unidad_id,
            descripcion=d.descripcion,
        )
        for d in payload.detalles
    ]
    guia.detalles = detalles
    db.add(guia)
    db.flush()
    procesar_guia_sri(guia.id, db)
    db.commit()
    db.refresh(guia)
    return guia


@router.get("")
def listar(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    return db.query(GuiaRemision).filter(GuiaRemision.empresa_id == user.empresa_id).order_by(GuiaRemision.id.desc()).all()


@router.get("/{gid}")
def get(gid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    guia = db.query(GuiaRemision).filter(GuiaRemision.id == gid, GuiaRemision.empresa_id == user.empresa_id).first()
    if not guia:
        raise HTTPException(status_code=404, detail="Guia no encontrada")
    return guia


@router.post("/{gid}/reenviar")
def reenviar(gid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    guia = db.query(GuiaRemision).filter(GuiaRemision.id == gid, GuiaRemision.empresa_id == user.empresa_id).first()
    if not guia:
        raise HTTPException(status_code=404, detail="Guia no encontrada")
    return procesar_guia_sri(gid, db)
