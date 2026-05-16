from datetime import date

from app.utils.clave_acceso import calcular_digito_modulo11, generar_clave_acceso


def test_modulo11_single_digit() -> None:
    base = "14052026011799999999990012001001000000001123456781"
    dig = calcular_digito_modulo11(base)
    assert dig.isdigit()
    assert len(dig) == 1


def test_generar_clave_acceso_49_digitos() -> None:
    clave = generar_clave_acceso(
        fecha_emision=date(2026, 5, 14),
        tipo_comprobante="01",
        ruc="1799999999001",
        ambiente=1,
        serie="001001",
        secuencial="1",
        codigo_numerico="12345678",
        tipo_emision=1,
    )
    assert len(clave) == 49
    assert clave.isdigit()
