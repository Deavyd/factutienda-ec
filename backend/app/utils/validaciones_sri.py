def validar_cedula(cedula: str) -> bool:
    if not (cedula.isdigit() and len(cedula) == 10):
        return False
    provincia = int(cedula[:2])
    tercero = int(cedula[2])
    if provincia < 1 or provincia > 24 or tercero >= 6:
        return False
    coef = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    total = 0
    for i in range(9):
        val = int(cedula[i]) * coef[i]
        total += val - 9 if val >= 10 else val
    dig = (10 - (total % 10)) % 10
    return dig == int(cedula[9])


def validar_ruc(ruc: str) -> bool:
    if not (ruc.isdigit() and len(ruc) == 13 and ruc.endswith("001")):
        return False
    return validar_cedula(ruc[:10])


def validar_pasaporte(pasaporte: str) -> bool:
    if not pasaporte:
        return False
    clean = pasaporte.strip()
    return 5 <= len(clean) <= 20 and clean.replace("-", "").isalnum()


def identificar_tipo_identificacion(identificacion: str) -> str:
    val = identificacion.strip().upper()
    if val in {"9999999999999", "CONSUMIDOR_FINAL"}:
        return "07"
    if val.isdigit() and len(val) == 13 and validar_ruc(val):
        return "04"
    if val.isdigit() and len(val) == 10 and validar_cedula(val):
        return "05"
    if validar_pasaporte(val):
        return "06"
    return "07"
