from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.cuenta_cobrar import CuentaCobrar
from app.models.descuento import Descuento
from app.models.lista_precio import ListaPrecio
from app.models.persona import Persona
from app.models.precio_producto import PrecioProducto
from app.models.producto import Producto


def get_lista_precio_cliente(cliente_id: int, db: Session) -> ListaPrecio:
    cliente = db.query(Persona).filter(Persona.id == cliente_id).first()
    if cliente and cliente.lista_precio_id:
        lp = db.query(ListaPrecio).filter(ListaPrecio.id == cliente.lista_precio_id, ListaPrecio.activo.is_(True)).first()
        if lp:
            return lp
    default = db.query(ListaPrecio).filter(ListaPrecio.es_default.is_(True), ListaPrecio.activo.is_(True)).first()
    if not default:
        raise ValueError("No existe lista de precio default")
    return default


def calcular_descuentos(producto_id: int, cantidad: Decimal, total_venta: Decimal, db: Session) -> list[dict]:
    hoy = date.today()
    items = (
        db.query(Descuento)
        .filter(Descuento.activo.is_(True))
        .filter(Descuento.fecha_inicio <= hoy, Descuento.fecha_fin >= hoy)
        .all()
    )
    aplicables: list[dict] = []
    for d in items:
        if d.aplica_a == "PRODUCTO" and d.producto_id != producto_id:
            continue
        if cantidad < d.cantidad_minima:
            continue
        base = total_venta
        valor = (base * d.valor / Decimal("100")) if d.tipo == "PORCENTAJE" else d.valor
        aplicables.append({"id": d.id, "nombre": d.nombre, "valor": valor, "acumulable": d.acumulable})
    non_acc = [a for a in aplicables if not a["acumulable"]]
    if non_acc:
        return [max(non_acc, key=lambda x: x["valor"])] + [a for a in aplicables if a["acumulable"]]
    return aplicables


def get_precio_producto(producto_id: int, lista_precio_id: int, cantidad: Decimal, db: Session) -> dict:
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise ValueError("Producto no encontrado")
    lp = db.query(ListaPrecio).filter(ListaPrecio.id == lista_precio_id, ListaPrecio.activo.is_(True)).first()
    if not lp:
        raise ValueError("Lista de precio no encontrada")

    pp = db.query(PrecioProducto).filter(PrecioProducto.producto_id == producto_id, PrecioProducto.lista_precio_id == lista_precio_id, PrecioProducto.activo.is_(True)).first()
    if pp:
        precio_base = Decimal(str(pp.precio))
    elif lp.tipo_calculo == "FIJO":
        precio_base = Decimal(str(producto.precio_venta))
    elif lp.tipo_calculo == "PORCENTAJE_DESCUENTO":
        precio_base = Decimal(str(producto.precio_venta)) * (Decimal("1") - (Decimal(str(lp.valor)) / Decimal("100")))
    else:
        precio_base = Decimal(str(producto.costo_unitario_venta)) * (Decimal("1") + (Decimal(str(lp.valor)) / Decimal("100")))

    total_linea = precio_base * cantidad
    descuentos = calcular_descuentos(producto_id, cantidad, total_linea, db)
    descuento_total = sum((Decimal(str(d["valor"])) for d in descuentos), Decimal("0"))
    precio_final = max(Decimal("0"), total_linea - descuento_total)
    return {
        "precio_base": precio_base,
        "descuento_aplicado": descuento_total,
        "precio_final": precio_final,
        "lista_usada": lp.nombre,
        "descuentos_aplicados": descuentos,
    }


def validar_credito_cliente(cliente_id: int, monto_venta: Decimal, db: Session) -> dict:
    cliente = db.query(Persona).filter(Persona.id == cliente_id).first()
    if not cliente:
        raise ValueError("Cliente no encontrado")
    deuda = sum((c.monto_pendiente for c in db.query(CuentaCobrar).filter(CuentaCobrar.cliente_id == cliente_id).all()), Decimal("0"))
    limite = Decimal(str(cliente.limite_credito or 0))
    disponible = limite - deuda
    puede = (not cliente.bloqueado) and (monto_venta <= disponible if limite > 0 else True)
    return {
        "puede_comprar": puede,
        "limite_credito": limite,
        "deuda_actual": deuda,
        "disponible": disponible,
        "bloqueado": cliente.bloqueado,
        "motivo": cliente.motivo_bloqueo or ("" if puede else "Limite de credito excedido"),
    }
