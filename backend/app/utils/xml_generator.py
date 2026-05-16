from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from lxml import etree

from app.core.config import get_settings
from app.services.iva_service import validar_cuadre_totales

settings = get_settings()


def _to_decimal(value: object) -> Decimal:
    return Decimal(str(value or "0"))


def _f2(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'), ROUND_HALF_UP):.2f}"


def _load_xsd_schema() -> etree.XMLSchema:
    xsd_path = Path(settings.SRI_XSD_FACTURA_PATH)
    if not xsd_path.exists():
        raise FileNotFoundError(f"No se encontro XSD SRI en: {xsd_path}")
    xsd_doc = etree.parse(str(xsd_path))
    return etree.XMLSchema(xsd_doc)


def _get_rimpe_text(regimen: str) -> str | None:
    if regimen == "RIMPE":
        return "CONTRIBUYENTE REGIMEN RIMPE".replace("REGIMEN", "R\u00c9GIMEN")
    if regimen == "RIMPE_NEGOCIO_POPULAR":
        return "CONTRIBUYENTE NEGOCIO POPULAR - REGIMEN RIMPE".replace("REGIMEN", "R\u00c9GIMEN")
    return None


def generar_xml_factura(factura_data: dict) -> str:
    """Genera XML factura v2.1.0 con estructura SRI 2026 completa."""
    root = etree.Element("factura", id="comprobante", version="2.1.0")

    info_tributaria = etree.SubElement(root, "infoTributaria")
    trib = factura_data["infoTributaria"]
    for key in [
        "ambiente",
        "tipoEmision",
        "razonSocial",
        "nombreComercial",
        "ruc",
        "claveAcceso",
        "codDoc",
        "estab",
        "ptoEmi",
        "secuencial",
        "dirMatriz",
    ]:
        etree.SubElement(info_tributaria, key).text = str(trib.get(key, ""))

    rimpe_text = _get_rimpe_text(trib.get("regimen", "GENERAL"))
    if rimpe_text:
        etree.SubElement(info_tributaria, "contribuyenteRimpe").text = rimpe_text

    info_factura = etree.SubElement(root, "infoFactura")
    if_data = factura_data["infoFactura"]
    for key in [
        "fechaEmision",
        "dirEstablecimiento",
        "obligadoContabilidad",
        "tipoIdentificacionComprador",
        "razonSocialComprador",
        "identificacionComprador",
        "totalSinImpuestos",
        "totalDescuento",
    ]:
        etree.SubElement(info_factura, key).text = str(if_data.get(key, ""))

    if if_data.get("guiaRemision"):
        etree.SubElement(info_factura, "guiaRemision").text = str(if_data.get("guiaRemision"))
    if if_data.get("comercialNegociable"):
        etree.SubElement(info_factura, "facturaComercialNegociable").text = "SI"

    total_con_impuestos = etree.SubElement(info_factura, "totalConImpuestos")

    detalles_list = factura_data.get("detalles", [])
    impuestos_por_codigo: dict[str, dict] = {}
    subtotal = Decimal("0")
    total_desc = Decimal("0")
    total_ice = Decimal("0")

    detalles_tag = etree.SubElement(root, "detalles")
    for item in detalles_list:
        cantidad = _to_decimal(item.get("cantidad"))
        precio = _to_decimal(item.get("precioUnitario"))
        descuento = _to_decimal(item.get("descuento"))
        ice = _to_decimal(item.get("valor_ice", "0"))
        porcentaje_iva = _to_decimal(item.get("porcentajeIvaAplicado", item.get("ivaTarifa", "0")))
        codigo_sri = str(item.get("codigoSRI", "2"))

        base_sin_impuestos = (cantidad * precio) - descuento
        base_iva = base_sin_impuestos + ice
        iva_valor = (base_iva * porcentaje_iva) / Decimal("100")

        subtotal += base_sin_impuestos
        total_desc += descuento
        total_ice += ice

        if codigo_sri not in impuestos_por_codigo:
            impuestos_por_codigo[codigo_sri] = {"base": Decimal("0"), "valor": Decimal("0"), "codigo": "2"}
        impuestos_por_codigo[codigo_sri]["base"] += base_iva
        impuestos_por_codigo[codigo_sri]["valor"] += iva_valor

        det = etree.SubElement(detalles_tag, "detalle")
        etree.SubElement(det, "codigoPrincipal").text = str(item.get("codigoPrincipal", ""))
        if item.get("codigoAuxiliar"):
            etree.SubElement(det, "codigoAuxiliar").text = str(item.get("codigoAuxiliar"))
        etree.SubElement(det, "descripcion").text = str(item.get("descripcion", ""))
        etree.SubElement(det, "cantidad").text = _f2(cantidad)
        etree.SubElement(det, "precioUnitario").text = _f2(precio)
        etree.SubElement(det, "descuento").text = _f2(descuento)
        etree.SubElement(det, "precioTotalSinImpuesto").text = _f2(base_sin_impuestos)

        if ice > 0:
            ice_det = etree.SubElement(det, "impuestosICE")
            imp = etree.SubElement(ice_det, "impuestoICE")
            etree.SubElement(imp, "codigo").text = "3"
            etree.SubElement(imp, "tarifa").text = _f2(_to_decimal(item.get("tarifaICE", "0")))
            etree.SubElement(imp, "baseImponible").text = _f2(base_sin_impuestos)
            etree.SubElement(imp, "valor").text = _f2(ice)

        impuestos = etree.SubElement(det, "impuestos")
        imp = etree.SubElement(impuestos, "impuesto")
        etree.SubElement(imp, "codigo").text = "2"
        etree.SubElement(imp, "codigoPorcentaje").text = codigo_sri
        etree.SubElement(imp, "tarifa").text = _f2(porcentaje_iva)
        etree.SubElement(imp, "baseImponible").text = _f2(base_iva)
        etree.SubElement(imp, "valor").text = _f2(iva_valor)

    total_iva = Decimal("0")
    for codigo_sri, data in impuestos_por_codigo.items():
        ti = etree.SubElement(total_con_impuestos, "totalImpuesto")
        etree.SubElement(ti, "codigo").text = "2"
        etree.SubElement(ti, "codigoPorcentaje").text = codigo_sri
        etree.SubElement(ti, "baseImponible").text = _f2(data["base"])
        etree.SubElement(ti, "valor").text = _f2(data["valor"])
        total_iva += data["valor"]

    propina = _to_decimal(if_data.get("propina", "0"))
    etree.SubElement(info_factura, "propina").text = _f2(propina)
    total_final = subtotal + total_iva + total_ice + propina
    importe_total = _f2(total_final)
    etree.SubElement(info_factura, "importeTotal").text = importe_total
    etree.SubElement(info_factura, "moneda").text = "DOLAR"

    pagos = etree.SubElement(info_factura, "pagos")
    pago = etree.SubElement(pagos, "pago")
    etree.SubElement(pago, "formaPago").text = str(if_data.get("formaPago", "01"))
    etree.SubElement(pago, "total").text = _f2(total_final)

    info_ad = factura_data.get("infoAdicional")
    if info_ad:
        ad = etree.SubElement(root, "infoAdicional")
        for nombre, valor in info_ad.items():
            campo = etree.SubElement(ad, "campoAdicional", nombre=str(nombre))
            campo.text = str(valor)

    validar_cuadre_totales(
        {
            "subtotal_sin_impuestos": _f2(subtotal),
            "iva_total": _f2(total_iva),
            "valor_ice": _f2(total_ice),
            "propina": _f2(propina),
            "total": importe_total,
        }
    )

    schema = _load_xsd_schema()
    xml_bytes = etree.tostring(root, encoding="UTF-8", xml_declaration=True)
    doc = etree.fromstring(xml_bytes)
    if not schema.validate(doc):
        error = schema.error_log.last_error
        raise ValueError(f"Error XSD SRI: {error}")

    return xml_bytes.decode("utf-8")


def generar_xml_liquidacion(data: dict) -> str:
    root = etree.Element("liquidacionCompra", id="comprobante", version="2.1.0")
    info_tributaria = etree.SubElement(root, "infoTributaria")
    trib = data["infoTributaria"]
    for key in ["ambiente", "tipoEmision", "razonSocial", "ruc", "claveAcceso", "codDoc", "estab", "ptoEmi", "secuencial", "dirMatriz"]:
        etree.SubElement(info_tributaria, key).text = str(trib.get(key, ""))
    info_liq = etree.SubElement(root, "infoLiquidacionCompra")
    liq = data["infoLiquidacion"]
    for key in ["fechaEmision", "provNombre", "provCedula", "provDireccion", "totalSinImpuestos", "totalDescuento", "importeTotal", "moneda"]:
        etree.SubElement(info_liq, key).text = str(liq.get(key, ""))
    detalles = etree.SubElement(root, "detalles")
    for item in data.get("detalles", []):
        d = etree.SubElement(detalles, "detalle")
        etree.SubElement(d, "descripcion").text = str(item.get("descripcion", ""))
        etree.SubElement(d, "cantidad").text = _f2(_to_decimal(item.get("cantidad")))
        etree.SubElement(d, "unidadMedida").text = str(item.get("unidad", "UND"))
        etree.SubElement(d, "precioUnitario").text = _f2(_to_decimal(item.get("precioUnitario")))
        etree.SubElement(d, "descuento").text = _f2(_to_decimal(item.get("descuento")))
        etree.SubElement(d, "precioTotalSinImpuesto").text = _f2(_to_decimal(item.get("precioTotalSinImpuesto", "0")))
    xml_bytes = etree.tostring(root, encoding="UTF-8", xml_declaration=True)
    return xml_bytes.decode("utf-8")


def generar_xml_guia_remision(data: dict) -> str:
    root = etree.Element("guiaRemision", id="comprobante", version="2.1.0")
    info_tributaria = etree.SubElement(root, "infoTributaria")
    trib = data["infoTributaria"]
    for key in ["ambiente", "tipoEmision", "razonSocial", "ruc", "claveAcceso", "codDoc", "estab", "ptoEmi", "secuencial", "dirMatriz"]:
        etree.SubElement(info_tributaria, key).text = str(trib.get(key, ""))
    info_guia = etree.SubElement(root, "infoGuiaRemision")
    guia = data["infoGuia"]
    for key in ["fechaEmision", "fechaInicioTransporte", "fechaFinTransporte", "transportistaRuc", "transportistaNombre", "placaVehiculo", "puntoPartida", "puntoLlegada", "motivoTraslado"]:
        etree.SubElement(info_guia, key).text = str(guia.get(key, ""))
    destinos = etree.SubElement(root, "destinos")
    destino = etree.SubElement(destinos, "destino")
    etree.SubElement(destino, "motivoTraslado").text = str(guia.get("motivoTraslado", "VENTA"))
    etree.SubElement(destino, "dirDestino").text = str(guia.get("puntoLlegada", ""))
    if guia.get("facturaId"):
        etree.SubElement(destino, "documentoAduanero").text = str(guia.get("facturaId"))
    detalles = etree.SubElement(destino, "detalles")
    for item in data.get("detalles", []):
        d = etree.SubElement(detalles, "detalle")
        etree.SubElement(d, "codigoInterno").text = str(item.get("productoId", ""))
        etree.SubElement(d, "descripcion").text = str(item.get("descripcion", ""))
        etree.SubElement(d, "cantidad").text = _f2(_to_decimal(item.get("cantidad")))
    xml_bytes = etree.tostring(root, encoding="UTF-8", xml_declaration=True)
    return xml_bytes.decode("utf-8")
