from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from app.exceptions import SRIValidacionError
from app.models.factura import Factura

MAX_MONTO_SRI = Decimal("200000000")
CONSUMIDOR_FINAL = "9999999999999"
MAX_MONTO_CONSUMIDOR_FINAL = Decimal("50.00")
DIAS_ANULACION_SRI_LINEA = 90


def validar_monto_maximo_sri(importe_total: Decimal) -> None:
    if Decimal(str(importe_total)) > MAX_MONTO_SRI:
        raise SRIValidacionError(
            "Monto supera limite del webservice SRI. Requiere autorizacion especial."
        )


def validar_consumidor_final_sri(identificacion: str | None, importe_total: Decimal) -> None:
    total = Decimal(str(importe_total))
    if identificacion == CONSUMIDOR_FINAL and total > MAX_MONTO_CONSUMIDOR_FINAL:
        raise SRIValidacionError(
            "Las facturas a consumidor final no pueden superar USD 50.00 segun normativa SRI"
        )


def calcular_fecha_limite_anulacion(fecha_autorizacion: date | None, fecha_emision: date) -> date:
    return fecha_emision + timedelta(days=DIAS_ANULACION_SRI_LINEA)


def validar_anulacion_factura_2026(
    factura: Factura,
    *,
    fecha_autorizacion: date | None = None,
    declarada_ats: bool = False,
) -> dict:
    if factura.cliente and factura.cliente.identificacion == CONSUMIDOR_FINAL:
        raise SRIValidacionError(
            "Las facturas a consumidor final deben corregirse con cliente identificado segun normativa SRI"
        )

    limite = factura.fecha_limite_anulacion or calcular_fecha_limite_anulacion(fecha_autorizacion, factura.fecha_emision)
    if date.today() > limite:
        raise SRIValidacionError(
            "La anulacion en SRI en Linea solo esta disponible hasta 90 dias despues de la emision"
        )

    warning = None
    if declarada_ats:
        warning = "Advertencia: la anulacion puede generar inconsistencias con la declaracion ATS"

    return {"ok": True, "fecha_limite_anulacion": limite, "warning": warning}
