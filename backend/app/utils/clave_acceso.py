from datetime import date


def calcular_digito_modulo11(cadena_48: str) -> str:
    if len(cadena_48) != 48 or not cadena_48.isdigit():
        raise ValueError("La cadena base debe tener 48 digitos")

    factores = [2, 3, 4, 5, 6, 7]
    total = 0
    idx = 0
    for digito in reversed(cadena_48):
        total += int(digito) * factores[idx]
        idx = (idx + 1) % len(factores)

    residuo = total % 11
    verificador = 11 - residuo
    if verificador == 11:
        verificador = 0
    elif verificador == 10:
        verificador = 1
    return str(verificador)


def generar_clave_acceso(
    fecha_emision: date,
    tipo_comprobante: str,
    ruc: str,
    ambiente: int,
    serie: str,
    secuencial: str,
    codigo_numerico: str,
    tipo_emision: int = 1,
) -> str:
    """Genera clave de acceso SRI de 49 digitos."""
    base = (
        f"{fecha_emision.strftime('%d%m%Y')}"
        f"{tipo_comprobante.zfill(2)}"
        f"{ruc.zfill(13)}"
        f"{str(ambiente)}"
        f"{serie.zfill(6)}"
        f"{secuencial.zfill(9)}"
        f"{codigo_numerico.zfill(8)}"
        f"{str(tipo_emision)}"
    )
    if len(base) != 48 or not base.isdigit():
        raise ValueError("La estructura base de clave de acceso no cumple 48 digitos")
    clave = base + calcular_digito_modulo11(base)
    if len(clave) != 49 or not clave.isdigit():
        raise ValueError("La clave de acceso generada no tiene 49 digitos")
    return clave
