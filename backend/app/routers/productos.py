import logging
from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.tarifa_iva import TarifaIva
from app.models.producto import Producto
from app.models.unidad_medida import UnidadMedida
from app.models.usuario import Usuario
from app.schemas.producto import ProductoCreate, ProductoOut, ProductoUpdate
from app.services.conversion_service import calcular_costo_unitario_venta, calcular_margen, stock_en_unidad_compra
from app.utils.importador_productos import (
    decode_base64_excel,
    generar_plantilla_importacion,
    importar_desde_excel_propio,
    importar_desde_plantilla_sri,
)

logger = logging.getLogger("importacion_productos")
if not logger.handlers:
    Path("logs").mkdir(parents=True, exist_ok=True)
    fh = logging.FileHandler("logs/importacion.log", encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(fh)
    logger.setLevel(logging.INFO)

router = APIRouter(prefix="/productos", tags=["productos"])


def _serialize_producto(producto: Producto) -> dict:
    unidad_compra = (
        {"id": producto.unidad_compra.id, "nombre": producto.unidad_compra.nombre, "abreviatura": producto.unidad_compra.abreviatura}
        if producto.unidad_compra
        else None
    )
    unidad_venta = (
        {"id": producto.unidad_venta.id, "nombre": producto.unidad_venta.nombre, "abreviatura": producto.unidad_venta.abreviatura}
        if producto.unidad_venta
        else None
    )
    return {
        "id": producto.id,
        "empresa_id": producto.empresa_id,
        "codigo_interno": producto.codigo_interno,
        "codigo_auxiliar": producto.codigo_auxiliar,
        "codigo_barras": producto.codigo_barras,
        "nombre": producto.nombre,
        "descripcion": producto.descripcion,
        "precio_sin_iva": producto.precio_sin_iva,
        "tarifa_iva_id": producto.tarifa_iva_id,
        "incluye_iva": producto.incluye_iva,
        "tiene_ice": producto.tiene_ice,
        "tarifa_ice": producto.tarifa_ice,
        "valor_ice_unitario": producto.valor_ice_unitario,
        "unidad_compra_id": producto.unidad_compra_id,
        "unidad_venta_id": producto.unidad_venta_id,
        "factor_conversion": producto.factor_conversion,
        "precio_compra": producto.precio_compra,
        "precio_venta": producto.precio_venta,
        "costo_unitario_venta": producto.costo_unitario_venta,
        "margen_ganancia": producto.margen_ganancia,
        "stock_en_unidad_venta": producto.stock_en_unidad_venta,
        "stock_en_unidad_compra": stock_en_unidad_compra(producto.stock_en_unidad_venta, producto.factor_conversion),
        "costo_promedio": producto.costo_promedio,
        "stock_actual": producto.stock_actual,
        "stock_minimo": producto.stock_minimo,
        "maneja_inventario": producto.maneja_inventario,
        "maneja_lotes": producto.maneja_lotes,
        "dias_alerta_vencimiento": producto.dias_alerta_vencimiento,
        "tipo_producto": producto.tipo_producto,
        "activo": producto.activo,
        "unidad_compra": unidad_compra,
        "unidad_venta": unidad_venta,
        "created_at": producto.created_at,
        "updated_at": producto.updated_at,
    }


def _r2(value: Decimal) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), ROUND_HALF_UP)


def _get_or_create_unidad(db: Session, abreviatura: str) -> UnidadMedida:
    ab = abreviatura.strip().lower()
    unidad = db.query(UnidadMedida).filter(UnidadMedida.abreviatura == ab).first()
    if unidad:
        return unidad
    unidad = UnidadMedida(nombre=ab.upper(), abreviatura=ab, tipo="unidad", factor_conversion=Decimal("1"), es_base=False, activo=True)
    db.add(unidad)
    db.flush()
    return unidad


def _get_tarifa_by_porcentaje(db: Session, porcentaje: Decimal) -> TarifaIva | None:
    return db.query(TarifaIva).filter(TarifaIva.porcentaje == porcentaje, TarifaIva.activo.is_(True)).first()


def _persistir_registros_importacion(db: Session, current_user: Usuario, registros: list[dict]) -> dict:
    importados = 0
    duplicados = 0
    errores: list[dict] = []
    for i, r in enumerate(registros, start=1):
        try:
            unidad_venta = _get_or_create_unidad(db, r["unidad_venta"])
            unidad_compra = _get_or_create_unidad(db, r["unidad_compra"])
            tarifa = _get_tarifa_by_porcentaje(db, Decimal(str(r["tarifa_iva"])))

            existente = (
                db.query(Producto)
                .filter(Producto.empresa_id == current_user.empresa_id, Producto.codigo_interno == r["codigo_principal"])
                .first()
            )

            data = {
                "empresa_id": current_user.empresa_id,
                "codigo_interno": r["codigo_principal"],
                "codigo_auxiliar": r.get("codigo_auxiliar"),
                "nombre": r["nombre"],
                "descripcion": r.get("descripcion"),
                "precio_sin_iva": _r2(r["precio_sin_iva"]),
                "precio_venta": _r2(r["precio_con_iva"]),
                "precio_compra": _r2(r["precio_sin_iva"]),
                "tarifa_iva_id": tarifa.id if tarifa else None,
                "incluye_iva": False,
                "tiene_ice": bool(r.get("tiene_ice", False)),
                "unidad_venta_id": unidad_venta.id,
                "unidad_compra_id": unidad_compra.id,
                "factor_conversion": Decimal(str(r.get("factor_conversion", 1))),
                "stock_actual": Decimal(str(r.get("stock_inicial", 0))),
                "stock_en_unidad_venta": Decimal(str(r.get("stock_inicial", 0))),
                "stock_minimo": Decimal(str(r.get("stock_minimo", 0))),
            }
            data["costo_unitario_venta"] = calcular_costo_unitario_venta(data["precio_compra"], data["factor_conversion"])
            data["margen_ganancia"] = calcular_margen(data["precio_venta"], data["costo_unitario_venta"])

            if existente:
                duplicados += 1
                for k, v in data.items():
                    setattr(existente, k, v)
            else:
                db.add(Producto(**data))
            importados += 1
        except Exception as exc:
            errores.append({"fila": i, "campo": "general", "mensaje": str(exc)})

    db.commit()
    logger.info("Importacion productos empresa=%s total=%s importados=%s duplicados=%s errores=%s", current_user.empresa_id, len(registros), importados, duplicados, len(errores))
    return {"importados": importados, "duplicados": duplicados, "errores": errores}


@router.get("", response_model=list[ProductoOut])
def list_productos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[Producto]:
    rows = db.query(Producto).filter(Producto.empresa_id == current_user.empresa_id).all()
    return [_serialize_producto(p) for p in rows]


@router.get("/{producto_id}", response_model=ProductoOut)
def get_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    producto = (
        db.query(Producto)
        .filter(Producto.id == producto_id, Producto.empresa_id == current_user.empresa_id)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return _serialize_producto(producto)


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def create_producto(
    payload: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    if payload.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Empresa no autorizada")

    if payload.unidad_compra_id and payload.unidad_venta_id:
        u_compra = db.query(UnidadMedida).filter(UnidadMedida.id == payload.unidad_compra_id).first()
        u_venta = db.query(UnidadMedida).filter(UnidadMedida.id == payload.unidad_venta_id).first()
        if not u_compra or not u_venta:
            raise HTTPException(status_code=400, detail="Unidad de medida invalida")
        if u_compra.tipo != u_venta.tipo:
            raise HTTPException(status_code=400, detail="Unidad compra y venta deben ser del mismo tipo")
    data = payload.model_dump()
    data["costo_unitario_venta"] = calcular_costo_unitario_venta(payload.precio_compra, payload.factor_conversion)
    data["margen_ganancia"] = calcular_margen(payload.precio_venta, data["costo_unitario_venta"])
    data["stock_en_unidad_venta"] = payload.stock_actual
    producto = Producto(**data)
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return _serialize_producto(producto)


@router.put("/{producto_id}", response_model=ProductoOut)
def update_producto(
    producto_id: int,
    payload: ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    producto = (
        db.query(Producto)
        .filter(Producto.id == producto_id, Producto.empresa_id == current_user.empresa_id)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(producto, key, value)

    if producto.unidad_compra_id and producto.unidad_venta_id:
        u_compra = db.query(UnidadMedida).filter(UnidadMedida.id == producto.unidad_compra_id).first()
        u_venta = db.query(UnidadMedida).filter(UnidadMedida.id == producto.unidad_venta_id).first()
        if u_compra and u_venta and u_compra.tipo != u_venta.tipo:
            raise HTTPException(status_code=400, detail="Unidad compra y venta deben ser del mismo tipo")
    producto.costo_unitario_venta = calcular_costo_unitario_venta(producto.precio_compra, producto.factor_conversion)
    producto.margen_ganancia = calcular_margen(producto.precio_venta, producto.costo_unitario_venta)

    db.commit()
    db.refresh(producto)
    return _serialize_producto(producto)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    producto = (
        db.query(Producto)
        .filter(Producto.id == producto_id, Producto.empresa_id == current_user.empresa_id)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    db.delete(producto)
    db.commit()


@router.get("/plantilla-importacion")
def plantilla_importacion(current_user: Usuario = Depends(get_current_user)) -> Response:
    content = generar_plantilla_importacion()
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="plantilla_importacion_productos.xlsx"'},
    )


@router.post("/importar-sri")
async def importar_sri(
    archivo: UploadFile,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    content = await archivo.read()
    parsed = importar_desde_plantilla_sri(content)
    persisted = _persistir_registros_importacion(db, current_user, parsed.get("registros", []))
    return {
        "total": parsed["total"],
        "importados": persisted["importados"],
        "errores": parsed["errores"] + persisted["errores"],
        "duplicados": persisted["duplicados"],
    }


@router.post("/importar-excel")
def importar_excel(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    archivo = decode_base64_excel(payload.get("archivo_base64", ""))
    parsed = importar_desde_excel_propio(archivo, payload.get("mapeo_columnas", {}))
    persisted = _persistir_registros_importacion(db, current_user, parsed.get("registros", []))
    return {
        "total": parsed["total"],
        "importados": persisted["importados"],
        "errores": parsed["errores"] + persisted["errores"],
        "duplicados": persisted["duplicados"],
    }


@router.post("/importar-preview")
def importar_preview(payload: dict, current_user: Usuario = Depends(get_current_user)) -> dict:
    archivo = decode_base64_excel(payload.get("archivo_base64", ""))
    parsed = importar_desde_excel_propio(archivo, payload.get("mapeo_columnas", {}))
    return {
        "total": parsed["total"],
        "preview": parsed.get("registros", [])[:10],
        "errores": parsed["errores"],
        "mensaje": parsed.get("mensaje"),
    }


@router.get("/exportar-excel")
def exportar_excel_productos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Response:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Productos"
    headers = [
        "codigo_principal",
        "codigo_auxiliar",
        "nombre",
        "descripcion",
        "precio_sin_iva",
        "precio_con_iva",
        "tarifa_iva",
        "unidad_venta",
        "unidad_compra",
        "factor_conversion",
        "stock_inicial",
        "stock_minimo",
        "tiene_ice",
        "categoria",
    ]
    ws.append(headers)
    for p in db.query(Producto).filter(Producto.empresa_id == current_user.empresa_id).all():
        ws.append([
            p.codigo_interno,
            p.codigo_auxiliar,
            p.nombre,
            p.descripcion,
            float(p.precio_sin_iva or 0),
            float(p.precio_venta or 0),
            float(p.tarifa_iva.porcentaje) if p.tarifa_iva else 0,
            p.unidad_venta.abreviatura if p.unidad_venta else "und",
            p.unidad_compra.abreviatura if p.unidad_compra else (p.unidad_venta.abreviatura if p.unidad_venta else "und"),
            float(p.factor_conversion or 1),
            float(p.stock_actual or 0),
            float(p.stock_minimo or 0),
            "SI" if p.tiene_ice else "NO",
            "",
        ])
    stream = BytesIO()
    wb.save(stream)
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="productos_export.xlsx"'},
    )
