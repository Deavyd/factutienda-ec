from datetime import date
from decimal import Decimal
from datetime import datetime
from io import BytesIO
from pathlib import Path
import zipfile

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.detalle_factura import DetalleFactura
from app.models.establecimiento import Establecimiento
from app.models.factura import Factura
from app.models.kardex import Kardex
from app.models.nota_credito import NotaCredito
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.services.inventario_service import alertas_stock_minimo, get_kardex_producto
from app.services.exportacion_contable import generar_reporte_contador
from app.utils.exportador import exportar_excel, exportar_pdf_reporte

router = APIRouter(prefix="/reportes", tags=["reportes"])


def _ensure_admin(user: Usuario) -> None:
    if user.rol.lower() != "admin":
        raise HTTPException(status_code=403, detail="Solo admin")


def _sucursal_filter(query, sucursal_id: int | None):
    if sucursal_id:
        return query.filter(Factura.establecimiento_id == sucursal_id)
    return query


def _export(data: list[dict], titulo: str, formato: str, base_name: str):
    if formato == "json":
        return data
    if formato == "excel":
        cols = list(data[0].keys()) if data else ["resultado"]
        content = exportar_excel(data, cols, titulo)
        fname = f"{base_name}_{datetime.now().strftime('%Y_%m_%d')}.xlsx"
        return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={fname}"})
    cols = list(data[0].keys()) if data else ["resultado"]
    content = exportar_pdf_reporte(data, cols, titulo, {"nombre": "FactuTienda EC"})
    fname = f"{base_name}_{datetime.now().strftime('%Y_%m_%d')}.pdf"
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={fname}"})


@router.get("/ventas-dia")
def ventas_dia(
    fecha: date,
    sucursal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> dict:
    _ensure_admin(user)
    query = db.query(Factura).filter(Factura.empresa_id == user.empresa_id, Factura.fecha_emision == fecha)
    query = _sucursal_filter(query, sucursal_id)
    facturas = query.all()
    total = sum((f.total for f in facturas), Decimal("0"))
    cantidad = len(facturas)
    data = [{"total_ventas": total, "cantidad_facturas": cantidad, "ticket_promedio": (total / cantidad if cantidad else 0)}]
    return _export(data, "Ventas del dia", formato, "ventas")


@router.get("/ventas-rango")
def ventas_rango(
    fecha_inicio: date,
    fecha_fin: date,
    sucursal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> list[dict]:
    _ensure_admin(user)
    query = (
        db.query(Factura.fecha_emision, func.sum(Factura.total), func.count(Factura.id))
        .filter(Factura.empresa_id == user.empresa_id)
        .filter(Factura.fecha_emision >= fecha_inicio, Factura.fecha_emision <= fecha_fin)
        .group_by(Factura.fecha_emision)
    )
    if sucursal_id:
        query = query.filter(Factura.establecimiento_id == sucursal_id)
    data = [{"fecha": r[0], "total": r[1], "cantidad": r[2]} for r in query.all()]
    return _export(data, "Ventas por rango", formato, "ventas_rango")


@router.get("/stock-actual")
def stock_actual(
    formato: str = Query(default="json"),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> list[dict]:
    _ensure_admin(user)
    productos = db.query(Producto).filter(Producto.empresa_id == user.empresa_id).all()
    data = [
        {
            "id": p.id,
            "nombre": p.nombre,
            "stock_actual": p.stock_actual,
            "stock_minimo": p.stock_minimo,
            "alerta": p.stock_actual <= p.stock_minimo,
        }
        for p in productos
    ]
    return _export(data, "Stock actual", formato, "stock_actual")


@router.get("/kardex")
def kardex(
    producto_id: int,
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> list[Kardex]:
    _ensure_admin(user)
    rows = get_kardex_producto(producto_id, fecha_inicio, fecha_fin, db)
    data = [
        {
            "fecha": r.created_at,
            "tipo": r.tipo_movimiento,
            "origen": r.origen,
            "cantidad": r.cantidad,
            "saldo_nuevo": r.saldo_nuevo,
        }
        for r in rows
    ]
    return _export(data, "Kardex", formato, "kardex")


@router.get("/facturas-sri")
def facturas_sri(
    sucursal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> dict:
    _ensure_admin(user)
    query = db.query(Factura.sri_estado, func.count(Factura.id)).filter(Factura.empresa_id == user.empresa_id)
    if sucursal_id:
        query = query.filter(Factura.establecimiento_id == sucursal_id)
    rows = query.group_by(Factura.sri_estado).all()
    data = [{"estado": estado, "cantidad": cantidad} for estado, cantidad in rows]
    return _export(data, "Facturas SRI", formato, "facturas_sri")


@router.get("/top-productos")
def top_productos(
    fecha_inicio: date,
    fecha_fin: date,
    limit: int = 10,
    sucursal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> list[dict]:
    _ensure_admin(user)
    query = (
        db.query(
            DetalleFactura.producto_id,
            func.sum(DetalleFactura.cantidad).label("cantidad"),
            func.sum(DetalleFactura.total_linea).label("valor"),
        )
        .join(Factura, Factura.id == DetalleFactura.factura_id)
        .filter(Factura.empresa_id == user.empresa_id)
        .filter(Factura.fecha_emision >= fecha_inicio, Factura.fecha_emision <= fecha_fin)
        .group_by(DetalleFactura.producto_id)
        .order_by(func.sum(DetalleFactura.cantidad).desc())
        .limit(limit)
    )
    if sucursal_id:
        query = query.filter(Factura.establecimiento_id == sucursal_id)
    data = [{"producto_id": r[0], "cantidad": r[1], "valor": r[2]} for r in query.all()]
    return _export(data, "Top productos", formato, "top_productos")


@router.get("/iva-mensual")
def iva_mensual(
    anio: int,
    mes: int,
    formato: str = Query(default="json"),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    _ensure_admin(user)
    facturas = db.query(Factura).filter(func.extract("year", Factura.fecha_emision) == anio, func.extract("month", Factura.fecha_emision) == mes, Factura.empresa_id == user.empresa_id).all()
    data = [
        {
            "fecha": f.fecha_emision,
            "cliente": f.cliente.razon_social if f.cliente else "",
            "ruc": f.cliente.identificacion if f.cliente else "",
            "base0": f.subtotal_0,
            "base15": f.subtotal_12,
            "iva_cobrado": f.iva_total,
            "retenciones_iva": 0,
            "retenciones_renta": 0,
        }
        for f in facturas
    ]
    return _export(data, "IVA mensual", formato, "iva_mensual")


@router.get("/liquidaciones")
def reporte_liquidaciones(
    mes: int | None = None,
    anio: int | None = None,
    formato: str = Query(default="json"),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    _ensure_admin(user)
    from app.models.liquidacion_compra import LiquidacionCompra
    query = db.query(LiquidacionCompra).filter(LiquidacionCompra.empresa_id == user.empresa_id)
    if anio:
        query = query.filter(func.extract("year", LiquidacionCompra.fecha_emision) == anio)
    if mes:
        query = query.filter(func.extract("month", LiquidacionCompra.fecha_emision) == mes)
    rows = query.all()
    data = [{"id": r.id, "numero": r.numero, "proveedor": r.proveedor_nombre, "fecha": r.fecha_emision, "total": r.total, "estado_sri": r.estado_sri} for r in rows]
    return _export(data, "Liquidaciones de compra", formato, "liquidaciones")


@router.get("/guias-remision")
def reporte_guias(
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    formato: str = Query(default="json"),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    _ensure_admin(user)
    from app.models.guia_remision import GuiaRemision
    query = db.query(GuiaRemision).filter(GuiaRemision.empresa_id == user.empresa_id)
    if fecha_inicio:
        query = query.filter(GuiaRemision.fecha_emision >= fecha_inicio)
    if fecha_fin:
        query = query.filter(GuiaRemision.fecha_emision <= fecha_fin)
    rows = query.all()
    data = [{"id": r.id, "numero": r.numero, "transportista": r.transportista_nombre, "fecha": r.fecha_emision, "estado_sri": r.estado_sri} for r in rows]
    return _export(data, "Guias de remision", formato, "guias_remision")


@router.get("/vencimientos")
def reporte_vencimientos(
    dias: int = 30,
    formato: str = Query(default="json"),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    _ensure_admin(user)
    from app.services.lote_service import verificar_vencimientos_proximos
    data = verificar_vencimientos_proximos(db)
    return _export(data, "Productos proximos a vencer", formato, "vencimientos")


@router.get("/exportar-contador")
def exportar_contador(
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    _ensure_admin(user)
    content, filename = generar_reporte_contador(fecha_inicio, fecha_fin, db)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/exportar-xmls")
def exportar_xmls(
    fecha_inicio: date,
    fecha_fin: date,
    tipo: str = Query(default="TODOS", pattern="^(FACTURAS|NOTAS_CREDITO|TODOS)$"),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    _ensure_admin(user)
    out = BytesIO()
    base = Path("data/comprobantes")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        if tipo in {"FACTURAS", "TODOS"}:
            facturas = db.query(Factura).filter(Factura.fecha_emision >= fecha_inicio, Factura.fecha_emision <= fecha_fin).all()
            for f in facturas:
                month_dir = base / f"{f.fecha_emision.year}" / f"{f.fecha_emision.month:02d}"
                if not month_dir.exists():
                    continue
                pattern = f"factura_{f.id}_*.xml"
                for p in month_dir.glob(pattern):
                    zf.write(p, arcname=f"facturas/{f.fecha_emision.year}-{f.fecha_emision.month:02d}/{p.name}")

        if tipo in {"NOTAS_CREDITO", "TODOS"}:
            notas = db.query(NotaCredito).filter(NotaCredito.fecha_emision >= fecha_inicio, NotaCredito.fecha_emision <= fecha_fin).all()
            for n in notas:
                month_dir = base / f"{n.fecha_emision.year}" / f"{n.fecha_emision.month:02d}"
                if not month_dir.exists():
                    continue
                for p in month_dir.glob(f"nota_credito_{n.id}_*.xml"):
                    zf.write(p, arcname=f"notas_credito/{n.fecha_emision.year}-{n.fecha_emision.month:02d}/{p.name}")

    name = f"xmls_{fecha_inicio.strftime('%Y%m%d')}_{fecha_fin.strftime('%Y%m%d')}.zip"
    return Response(content=out.getvalue(), media_type="application/zip", headers={"Content-Disposition": f"attachment; filename={name}"})
