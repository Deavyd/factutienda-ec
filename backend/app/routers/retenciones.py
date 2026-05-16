from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_contador
from app.models.factura import Factura
from app.models.retencion import Retencion
from app.models.usuario import Usuario
from app.services.retencion_service import reporte_retenciones_mes

router = APIRouter(prefix="/retenciones", tags=["retenciones"])


class RetDetalle(BaseModel):
    codigo: str
    descripcion: str
    base_imponible: Decimal
    porcentaje: Decimal
    valor: Decimal


class RetCreate(BaseModel):
    factura_id: int
    numero_retencion: str
    tipo_identificacion_agente: str
    identificacion_agente: str
    razon_social_agente: str
    fecha_emision: date
    detalles: list[RetDetalle]
    archivo_xml: str | None = None


@router.post("")
def crear_retencion(payload: RetCreate, db: Session = Depends(get_db), user: Usuario = Depends(require_contador)) -> Retencion:
    factura = db.query(Factura).filter(Factura.id == payload.factura_id, Factura.empresa_id == user.empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if payload.identificacion_agente == "9999999999999":
        raise HTTPException(status_code=400, detail="Los comprobantes de retencion requieren identificacion real del receptor")
    total = sum((d.valor for d in payload.detalles), Decimal("0"))
    obj = Retencion(
        factura_id=payload.factura_id,
        numero_retencion=payload.numero_retencion,
        tipo_identificacion_agente=payload.tipo_identificacion_agente,
        identificacion_agente=payload.identificacion_agente,
        razon_social_agente=payload.razon_social_agente,
        fecha_emision=payload.fecha_emision,
        detalles=[d.model_dump() for d in payload.detalles],
        total_retenido=total,
        estado="REGISTRADA",
        archivo_xml=payload.archivo_xml,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("")
def listar_retenciones(
    fecha_inicio: date | None = Query(default=None),
    fecha_fin: date | None = Query(default=None),
    agente: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_contador),
) -> list[Retencion]:
    query = db.query(Retencion).join(Factura, Factura.id == Retencion.factura_id).filter(Factura.empresa_id == user.empresa_id)
    if fecha_inicio:
        query = query.filter(Retencion.fecha_emision >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Retencion.fecha_emision <= fecha_fin)
    if agente:
        query = query.filter(Retencion.razon_social_agente.ilike(f"%{agente}%"))
    return query.order_by(Retencion.id.desc()).all()


@router.get("/{retencion_id}")
def get_retencion(retencion_id: int, db: Session = Depends(get_db), user: Usuario = Depends(require_contador)) -> Retencion:
    obj = db.query(Retencion).join(Factura, Factura.id == Retencion.factura_id).filter(Retencion.id == retencion_id, Factura.empresa_id == user.empresa_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Retencion no encontrada")
    return obj


@router.put("/{retencion_id}/anular")
def anular_retencion(retencion_id: int, db: Session = Depends(get_db), user: Usuario = Depends(require_contador)) -> dict:
    obj = db.query(Retencion).join(Factura, Factura.id == Retencion.factura_id).filter(Retencion.id == retencion_id, Factura.empresa_id == user.empresa_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Retencion no encontrada")
    obj.estado = "ANULADA"
    db.commit()
    return {"id": obj.id, "estado": obj.estado}


@router.get("/reporte/{anio}/{mes}")
def reporte_mes(anio: int, mes: int, db: Session = Depends(get_db), _: Usuario = Depends(require_contador)) -> dict:
    return reporte_retenciones_mes(anio, mes, db)
