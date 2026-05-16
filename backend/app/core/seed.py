from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.tarifa_iva import TarifaIva
from app.models.lista_precio import ListaPrecio
from app.models.unidad_medida import UnidadMedida


def seed_unidades_medida(db: Session) -> None:
    if db.query(UnidadMedida).count() > 0:
        return
    data = [
        ("centimetro", "cm", "LONGITUD", "0.01", False),
        ("metro", "m", "LONGITUD", "1", True),
        ("milimetro", "mm", "LONGITUD", "0.001", False),
        ("pie", "ft", "LONGITUD", "0.3048", False),
        ("pulgada", "in", "LONGITUD", "0.0254", False),
        ("yarda", "yd", "LONGITUD", "0.9144", False),
        ("gramo", "g", "PESO", "0.001", False),
        ("kilogramo", "kg", "PESO", "1", True),
        ("libra", "lb", "PESO", "0.453592", False),
        ("onza", "oz", "PESO", "0.0283495", False),
        ("tonelada", "t", "PESO", "1000", False),
        ("quintal", "qq", "PESO", "45.3592", False),
        ("unidad", "und", "UNIDAD", "1", True),
        ("docena", "doc", "UNIDAD", "12", False),
        ("ciento", "cto", "UNIDAD", "100", False),
        ("cuarto", "cuarto", "UNIDAD", "0.25", False),
        ("cuarto galon", "qt", "VOLUMEN", "0.946353", False),
        ("galon", "gal", "VOLUMEN", "3.78541", False),
        ("litro", "L", "VOLUMEN", "1", True),
        ("mililitro", "ml", "VOLUMEN", "0.001", False),
    ]
    for nombre, abrv, tipo, factor, base in data:
        db.add(
            UnidadMedida(
                nombre=nombre,
                abreviatura=abrv,
                tipo=tipo,
                factor_conversion=Decimal(factor),
                es_base=base,
                activo=True,
            )
        )
    db.commit()


def seed_tarifas_iva(db: Session) -> None:
    if db.query(TarifaIva).count() > 0:
        return
    hoy = date.today()
    tarifas = [
        ("IVA 15%", Decimal("15"), "2", "IVA general Ecuador", True),
        ("IVA 5%", Decimal("5"), "8", "Tarifa reducida", False),
        ("IVA 0%", Decimal("0"), "0", "Tarifa 0%", False),
        ("TARIFA ESPECIAL", Decimal("0"), "6", "Tarifa especial", False),
        ("NO OBJETO DE IVA", Decimal("0"), "7", "Servicios fuera del alcance del IVA", False),
        ("EXENTO DE IVA", Decimal("0"), "6", "Bienes/servicios exonerados por ley", False),
    ]
    for nombre, porc, codigo, desc, default in tarifas:
        db.add(
            TarifaIva(
                nombre=nombre,
                porcentaje=porc,
                codigo_sri=codigo,
                descripcion=desc,
                activo=True,
                fecha_vigencia_desde=hoy,
                fecha_vigencia_hasta=None,
                es_default=default,
            )
        )
    db.commit()


def seed_listas_precio(db: Session) -> None:
    if db.query(ListaPrecio).count() > 0:
        return
    db.add(ListaPrecio(nombre="Precio Normal", descripcion="Lista base", tipo_calculo="FIJO", valor=Decimal("0"), activo=True, es_default=True))
    db.add(ListaPrecio(nombre="Mayorista", descripcion="Descuento mayorista", tipo_calculo="PORCENTAJE_DESCUENTO", valor=Decimal("5"), activo=True, es_default=False))
    db.add(ListaPrecio(nombre="VIP", descripcion="Cliente VIP", tipo_calculo="PORCENTAJE_DESCUENTO", valor=Decimal("8"), activo=True, es_default=False))
    db.commit()
