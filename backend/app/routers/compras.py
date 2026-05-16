from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_db
from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.lote import Lote
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.compra import CompraCreate, CompraOut, CompraUpdate
from app.services.conversion_service import actualizar_stock_por_compra
from app.services.inventario_service import registrar_kardex

router = APIRouter(prefix="/compras", tags=["compras"])


@router.post("", response_model=CompraOut, status_code=status.HTTP_201_CREATED)
def crear_compra(payload: CompraCreate, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)) -> Compra:
    if payload.empresa_id != user.empresa_id:
        raise HTTPException(status_code=403, detail="Empresa no autorizada")

    subtotal = Decimal("0")
    detalles: list[DetalleCompra] = []
    for item in payload.detalles:
        prod = db.query(Producto).filter(Producto.id == item.producto_id, Producto.empresa_id == user.empresa_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
        total_linea = item.cantidad * item.costo_unitario
        subtotal += total_linea
        if not prod.unidad_compra_id:
            raise HTTPException(status_code=400, detail=f"Producto {prod.id} sin unidad_compra configurada")
        cantidad_venta = actualizar_stock_por_compra(prod.id, item.cantidad, prod.unidad_compra_id, db)
        prod.costo_promedio = item.costo_unitario
        registrar_kardex(prod.id, "COMPRA", cantidad_venta, item.costo_unitario, "COMPRA", db)
        if prod.maneja_lotes:
            db.add(
                Lote(
                    producto_id=prod.id,
                    codigo_lote=f"Lote-{payload.fecha_emision.isoformat()}-{prod.id}",
                    fecha_fabricacion=payload.fecha_emision,
                    fecha_vencimiento=payload.fecha_emision.replace(year=payload.fecha_emision.year + 1),
                    cantidad_inicial=cantidad_venta,
                    cantidad_actual=cantidad_venta,
                    costo_unitario=item.costo_unitario,
                    proveedor_id=payload.proveedor_id,
                    compra_id=0,
                    activo=True,
                )
            )
        detalles.append(
            DetalleCompra(
                producto_id=prod.id,
                cantidad=item.cantidad,
                unidad_id=prod.unidad_compra_id,
                cantidad_unidad_compra=item.cantidad,
                cantidad_convertida_venta=cantidad_venta,
                costo_unitario=item.costo_unitario,
                total_linea=total_linea,
            )
        )

    compra = Compra(
        empresa_id=user.empresa_id,
        proveedor_id=payload.proveedor_id,
        usuario_id=user.id,
        fecha_emision=payload.fecha_emision,
        numero_documento=f"C-{user.empresa_id}-{user.id}-{len(detalles)}",
        subtotal=subtotal,
        iva_total=Decimal("0"),
        total=subtotal,
        estado="BORRADOR",
    )
    compra.detalles = detalles
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return compra


@router.get("", response_model=list[CompraOut])
def listar_compras(
    fecha: str | None = Query(default=None),
    proveedor_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> list[Compra]:
    query = db.query(Compra).options(joinedload(Compra.detalles)).filter(Compra.empresa_id == user.empresa_id)
    if fecha:
        query = query.filter(Compra.fecha_emision == fecha)
    if proveedor_id:
        query = query.filter(Compra.proveedor_id == proveedor_id)
    return query.order_by(Compra.id.desc()).all()


@router.get("/{compra_id}", response_model=CompraOut)
def get_compra(compra_id: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)) -> Compra:
    compra = (
        db.query(Compra)
        .options(joinedload(Compra.detalles))
        .filter(Compra.id == compra_id, Compra.empresa_id == user.empresa_id)
        .first()
    )
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return compra


@router.put("/{compra_id}", response_model=CompraOut)
def actualizar_compra(
    compra_id: int,
    payload: CompraUpdate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> Compra:
    compra = db.query(Compra).filter(Compra.id == compra_id, Compra.empresa_id == user.empresa_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if compra.estado != "BORRADOR":
        raise HTTPException(status_code=400, detail="Solo se puede editar en BORRADOR")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(compra, key, value)
    db.commit()
    db.refresh(compra)
    return compra
