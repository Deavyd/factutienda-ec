from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_db
from app.models.detalle_proforma import DetalleProforma
from app.models.producto import Producto
from app.models.proforma import Proforma
from app.models.usuario import Usuario

router = APIRouter(prefix="/proformas", tags=["proformas"])


class DetalleProformaIn(BaseModel):
    producto_id: int
    cantidad: Decimal
    precio_unitario: Decimal
    descuento: Decimal = Decimal("0")


class ProformaCreate(BaseModel):
    cliente_id: int
    fecha_validez: date | None = None
    detalles: list[DetalleProformaIn]
    observacion: str | None = None


class ProformaOut(BaseModel):
    id: int
    numero: str
    cliente_id: int
    fecha_emision: date
    fecha_validez: date
    subtotal: Decimal
    iva_total: Decimal
    total: Decimal
    estado: str
    observacion: str | None
    detalles: list[dict]


@router.post("", status_code=status.HTTP_201_CREATED)
def crear(payload: ProformaCreate, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    num = f"PRO-{user.empresa_id}-{user.id}-{date.today().strftime('%Y%m%d')}"
    validez = payload.fecha_validez or (date.today() + timedelta(days=15))
    subtotal = Decimal("0")

    p = Proforma(
        empresa_id=user.empresa_id,
        usuario_id=user.id,
        cliente_id=payload.cliente_id,
        numero=num,
        fecha_emision=date.today(),
        fecha_validez=validez,
        subtotal=Decimal("0"),
        iva_total=Decimal("0"),
        total=Decimal("0"),
        estado="PENDIENTE",
        observacion=payload.observacion,
    )
    db.add(p)
    db.flush()

    detalles = []
    for item in payload.detalles:
        prod = db.query(Producto).filter(Producto.id == item.producto_id).first()
        desc = prod.nombre if prod else "Producto"
        total_linea = (item.cantidad * item.precio_unitario) - item.descuento
        subtotal += total_linea
        detalles.append(
            DetalleProforma(
                proforma_id=p.id,
                producto_id=item.producto_id,
                descripcion=desc,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                descuento=item.descuento,
                total_linea=total_linea,
            )
        )

    db.add_all(detalles)
    p.subtotal = subtotal
    p.total = subtotal

    db.commit()
    db.refresh(p)
    return _serialize(p, db)


@router.get("")
def listar(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    proformas = db.query(Proforma).options(joinedload(Proforma.detalles)).filter(Proforma.empresa_id == user.empresa_id).order_by(Proforma.id.desc()).all()
    return [_serialize(p, db) for p in proformas]


@router.get("/{pid}")
def get(pid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    p = db.query(Proforma).options(joinedload(Proforma.detalles)).filter(Proforma.id == pid, Proforma.empresa_id == user.empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proforma no encontrada")
    return _serialize(p, db)


@router.put("/{pid}/estado")
def cambiar_estado(pid: int, estado: str = "ACEPTADA", db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    p = db.query(Proforma).filter(Proforma.id == pid, Proforma.empresa_id == user.empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proforma no encontrada")
    p.estado = estado
    db.commit()
    return {"id": pid, "estado": estado}


@router.post("/{pid}/convertir")
def convertir_a_factura(pid: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    p = db.query(Proforma).options(joinedload(Proforma.detalles)).filter(Proforma.id == pid, Proforma.empresa_id == user.empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proforma no encontrada")
    if p.estado != "PENDIENTE":
        raise HTTPException(status_code=400, detail="Solo se pueden convertir proformas PENDIENTES")

    from app.routers.facturas import FacturaCreate
    # Se exportan los datos para que el frontend llame a POST /facturas con los detalles
    return {
        "cliente_id": p.cliente_id,
        "fecha_emision": str(date.today()),
        "detalles": [
            {
                "producto_id": d.producto_id,
                "cantidad": str(d.cantidad),
                "precio_unitario": str(d.precio_unitario),
                "descuento": str(d.descuento),
                "iva_tarifa": "15",
            }
            for d in p.detalles
        ],
        "proforma_id": pid,
    }


def _serialize(p: Proforma, db: Session) -> dict:
    return {
        "id": p.id,
        "numero": p.numero,
        "cliente_id": p.cliente_id,
        "fecha_emision": p.fecha_emision.isoformat(),
        "fecha_validez": p.fecha_validez.isoformat(),
        "subtotal": str(p.subtotal),
        "iva_total": str(p.iva_total),
        "total": str(p.total),
        "estado": p.estado,
        "observacion": p.observacion,
        "detalles": [
            {
                "id": d.id,
                "producto_id": d.producto_id,
                "descripcion": d.descripcion,
                "cantidad": str(d.cantidad),
                "precio_unitario": str(d.precio_unitario),
                "descuento": str(d.descuento),
                "total_linea": str(d.total_linea),
            }
            for d in (p.detalles or [])
        ],
    }
