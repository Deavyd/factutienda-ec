from __future__ import annotations

from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.models.tarifa_iva import TarifaIva


def calcular_iva(precio: Decimal, tarifa_iva_id: int, incluye_iva: bool, db: Session) -> dict:
    tarifa = db.query(TarifaIva).filter(TarifaIva.id == tarifa_iva_id, TarifaIva.activo.is_(True)).first()
    if not tarifa:
        raise ValueError("Tarifa IVA no encontrada")
    porcentaje = Decimal(str(tarifa.porcentaje))
    if incluye_iva:
        precio_con_iva = precio
        precio_sin_iva = precio / (Decimal("1") + (porcentaje / Decimal("100"))) if porcentaje else precio
        valor_iva = precio_con_iva - precio_sin_iva
    else:
        precio_sin_iva = precio
        valor_iva = (precio_sin_iva * porcentaje) / Decimal("100")
        precio_con_iva = precio_sin_iva + valor_iva
    return {
        "precio_sin_iva": precio_sin_iva.quantize(Decimal("0.01"), ROUND_HALF_UP),
        "valor_iva": valor_iva.quantize(Decimal("0.01"), ROUND_HALF_UP),
        "precio_con_iva": precio_con_iva.quantize(Decimal("0.01"), ROUND_HALF_UP),
        "porcentaje": porcentaje,
        "codigo_sri": tarifa.codigo_sri,
    }


def get_tarifa_default(db: Session) -> TarifaIva:
    tarifa = db.query(TarifaIva).filter(TarifaIva.es_default.is_(True), TarifaIva.activo.is_(True)).first()
    if not tarifa:
        raise ValueError("No existe tarifa IVA por defecto")
    return tarifa


def get_tarifa_vigente(tarifa_iva_id: int, fecha: date, db: Session) -> TarifaIva:
    tarifa = db.query(TarifaIva).filter(TarifaIva.id == tarifa_iva_id, TarifaIva.activo.is_(True)).first()
    if not tarifa:
        raise ValueError("Tarifa no encontrada")
    if tarifa.fecha_vigencia_desde > fecha:
        raise ValueError("Tarifa aun no vigente")
    if tarifa.fecha_vigencia_hasta and tarifa.fecha_vigencia_hasta < fecha:
        raise ValueError("Tarifa vencida")
    return tarifa


def calcular_totales_factura(detalles: list[dict], db: Session) -> dict:
    subtotal_15 = Decimal("0")
    subtotal_5 = Decimal("0")
    subtotal_tarifa_especial = Decimal("0")
    subtotal_0 = Decimal("0")
    subtotal_no_objeto_iva = Decimal("0")
    subtotal_exento_iva = Decimal("0")
    total_descuento = Decimal("0")
    valor_ice = Decimal("0")
    iva_15 = Decimal("0")
    iva_5 = Decimal("0")
    iva_tarifa_especial = Decimal("0")

    for d in detalles:
        base = Decimal(str(d.get("base_imponible", "0")))
        ice = Decimal(str(d.get("valor_ice", "0")))
        iva = Decimal(str(d.get("valor_iva", "0")))
        descuento = Decimal(str(d.get("descuento", "0")))
        codigo = str(d.get("tipo_tarifa_iva", "2"))
        total_descuento += descuento
        valor_ice += ice

        if codigo in ("0", "0%"):
            subtotal_0 += base
        elif codigo in ("8", "5", "5%"):
            subtotal_5 += base
            iva_5 += iva
        elif codigo in ("2", "15", "15%"):
            subtotal_15 += base
            iva_15 += iva
        elif codigo == "6":
            subtotal_tarifa_especial += base
            iva_tarifa_especial += iva
        elif codigo == "7":
            subtotal_no_objeto_iva += base
        elif codigo == "6E":
            subtotal_exento_iva += base

    subtotal_sin_impuestos = subtotal_0 + subtotal_5 + subtotal_15 + subtotal_tarifa_especial + subtotal_no_objeto_iva + subtotal_exento_iva

    def r2(v: Decimal) -> Decimal:
        return v.quantize(Decimal("0.01"), ROUND_HALF_UP)

    return {
        "subtotal_sin_impuestos": r2(subtotal_sin_impuestos),
        "subtotal_15": r2(subtotal_15),
        "subtotal_5": r2(subtotal_5),
        "subtotal_tarifa_especial": r2(subtotal_tarifa_especial),
        "subtotal_0": r2(subtotal_0),
        "subtotal_no_objeto_iva": r2(subtotal_no_objeto_iva),
        "subtotal_exento_iva": r2(subtotal_exento_iva),
        "total_descuento": r2(total_descuento),
        "valor_ice": r2(valor_ice),
        "iva_15": r2(iva_15),
        "iva_5": r2(iva_5),
        "iva_tarifa_especial": r2(iva_tarifa_especial),
        "propina": Decimal("0"),
        "valor_a_pagar": r2(subtotal_sin_impuestos + iva_15 + iva_5 + iva_tarifa_especial + valor_ice),
    }


def validar_cuadre_totales(factura_data: dict) -> bool:
    subt = Decimal(str(factura_data.get("subtotal_sin_impuestos", "0"))).quantize(Decimal("0.01"), ROUND_HALF_UP)
    iva = Decimal(str(factura_data.get("iva_total", "0"))).quantize(Decimal("0.01"), ROUND_HALF_UP)
    ice = Decimal(str(factura_data.get("valor_ice", "0"))).quantize(Decimal("0.01"), ROUND_HALF_UP)
    propina = Decimal(str(factura_data.get("propina", "0"))).quantize(Decimal("0.01"), ROUND_HALF_UP)
    total = Decimal(str(factura_data.get("total", "0"))).quantize(Decimal("0.01"), ROUND_HALF_UP)
    esperado = (subt + iva + ice + propina).quantize(Decimal("0.01"), ROUND_HALF_UP)
    diff = abs(total - esperado)
    if diff <= Decimal("0.01"):
        return True
    raise ValueError(f"No cuadra: subtotal={subt} + iva={iva} + ice={ice} + propina={propina} = {esperado} vs total={total}")
