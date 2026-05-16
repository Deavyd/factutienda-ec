from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("SECRET_KEY", "smoke-secret-key")
os.environ.setdefault("SRI_RUC", "1799999999001")
os.environ.setdefault("SRI_RAZON_SOCIAL", "FactuTienda Smoke")
os.environ.setdefault("SRI_DIR_MATRIZ", "Quito")
os.environ.setdefault("SRI_CERT_PASSWORD", "testpass")
os.environ.setdefault("SRI_WS_RECEPCION_PRUEBAS", "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
os.environ.setdefault("SRI_WS_AUTORIZACION_PRUEBAS", "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl")
os.environ.setdefault("SRI_WS_RECEPCION_PROD", "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
os.environ.setdefault("SRI_WS_AUTORIZACION_PROD", "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl")

from lxml import etree

from app.services.factura_service import validar_anulacion_factura_2026, validar_consumidor_final_sri, validar_monto_maximo_sri
from app.services.iva_service import validar_cuadre_totales
from app.services.sri_service import interpretar_error_sri
from app.utils.xml_generator import generar_xml_factura


@dataclass
class ClienteDummy:
    identificacion: str


@dataclass
class FacturaDummy:
    cliente: ClienteDummy
    fecha_emision: datetime.date
    fecha_limite_anulacion: datetime.date | None = None


def _ok(name: str) -> None:
    print(f"[OK] {name}")


def _fail(name: str, error: str) -> None:
    print(f"[FAIL] {name}: {error}")


def check_rimpe_xml() -> None:
    data = {
        "infoTributaria": {
            "ambiente": "1",
            "tipoEmision": "1",
            "razonSocial": "FactuTienda EC",
            "nombreComercial": "FactuTienda",
            "ruc": "1799999999001",
            "claveAcceso": "1" * 49,
            "codDoc": "01",
            "estab": "001",
            "ptoEmi": "001",
            "secuencial": "000000123",
            "dirMatriz": "Quito",
            "regimen": "RIMPE",
        },
        "infoFactura": {
            "fechaEmision": "15/05/2026",
            "dirEstablecimiento": "Quito",
            "obligadoContabilidad": "SI",
            "tipoIdentificacionComprador": "05",
            "razonSocialComprador": "Cliente Demo",
            "identificacionComprador": "0912345678",
            "totalSinImpuestos": "10.00",
            "totalDescuento": "0.00",
            "formaPago": "01",
        },
        "detalles": [
            {
                "codigoPrincipal": "P001",
                "descripcion": "Producto",
                "cantidad": "1",
                "precioUnitario": "10.00",
                "descuento": "0.00",
                "ivaTarifa": "0",
                "codigoSRI": "0",
            }
        ],
    }
    xml = generar_xml_factura(data)
    doc = etree.fromstring(xml.encode("utf-8"))
    assert doc.get("version") == "2.1.0"
    assert doc.find(".//contribuyenteRimpe").text == "CONTRIBUYENTE RÉGIMEN RIMPE"


def check_anulacion_reglas() -> None:
    f_consumidor = FacturaDummy(ClienteDummy("9999999999999"), datetime.now().date())
    try:
        validar_anulacion_factura_2026(f_consumidor)
        raise AssertionError("Debio bloquear consumidor final")
    except Exception:
        pass

    f_antigua = FacturaDummy(ClienteDummy("0912345678"), (datetime.now() - timedelta(days=91)).date())
    try:
        validar_anulacion_factura_2026(f_antigua)
        raise AssertionError("Debio bloquear factura >90 dias")
    except Exception:
        pass

    f_reciente = FacturaDummy(ClienteDummy("0912345678"), (datetime.now() - timedelta(days=10)).date())
    assert validar_anulacion_factura_2026(f_reciente)["ok"] is True


def check_redondeo() -> None:
    assert validar_cuadre_totales(
        {
            "subtotal_sin_impuestos": "100.01",
            "iva_total": "15.00",
            "valor_ice": "0.00",
            "propina": "0.00",
            "total": "115.01",
        }
    )


def check_errores_sri() -> None:
    out = interpretar_error_sri(None, "Clave acceso registrada")
    assert out["reintentar"] is False
    assert "consultar autorizacion" in str(out["accion"]).lower()


def check_monto_maximo() -> None:
    try:
        validar_monto_maximo_sri(Decimal("200000000.01"))
        raise AssertionError("Debio bloquear monto mayor a 200M")
    except Exception:
        pass

    try:
        validar_consumidor_final_sri("9999999999999", Decimal("50.01"))
        raise AssertionError("Debio bloquear consumidor final mayor a USD 50.00")
    except Exception:
        pass
    assert validar_consumidor_final_sri("9999999999999", Decimal("50.00")) is None


def run_local_checks() -> int:
    checks = [
        ("RIMPE XML y version 2.1.0", check_rimpe_xml),
        ("Anulacion SRI Linea (>90 dias y consumidor final)", check_anulacion_reglas),
        ("Redondeo y cuadre de totales", check_redondeo),
        ("Error SRI no reintento", check_errores_sri),
        ("Monto maximo SRI y consumidor final USD 50", check_monto_maximo),
    ]
    failed = 0
    for name, fn in checks:
        try:
            fn()
            _ok(name)
        except Exception as exc:
            failed += 1
            _fail(name, str(exc))
    return failed


def run_api_check(base_url: str, email: str, password: str) -> int:
    try:
        import requests
    except Exception as exc:
        _fail("API check", f"requests no disponible: {exc}")
        return 1

    try:
        login = requests.post(
            f"{base_url}/auth/login",
            json={"email": email, "password": password},
            timeout=15,
        )
        login.raise_for_status()
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "establecimiento_id": 1,
            "punto_emision_id": 1,
            "proveedor_nombre": "CF Test",
            "proveedor_cedula": "9999999999999",
            "proveedor_direccion": "Quito",
            "fecha_emision": datetime.now().date().isoformat(),
            "detalles": [
                {
                    "descripcion": "Servicio demo",
                    "cantidad": "1",
                    "unidad": "UND",
                    "precio_unitario": "10.00",
                    "descuento": "0.00",
                }
            ],
        }
        res = requests.post(f"{base_url}/liquidaciones", json=payload, headers=headers, timeout=20)
        if res.status_code == 400 and "consumidor final" in res.text.lower():
            _ok("API liquidaciones rechaza consumidor final")
            return 0
        _fail("API liquidaciones rechaza consumidor final", f"status={res.status_code}, body={res.text}")
        return 1
    except Exception as exc:
        _fail("API check", str(exc))
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test rapido para reglas SRI 2026")
    parser.add_argument("--api-url", help="Base URL API v1, ej: http://localhost:8000/api/v1")
    parser.add_argument("--email", help="Usuario para login API")
    parser.add_argument("--password", help="Password para login API")
    args = parser.parse_args()

    print("== Smoke SRI 2026 ==")
    failed = run_local_checks()

    if args.api_url and args.email and args.password:
        failed += run_api_check(args.api_url.rstrip("/"), args.email, args.password)
    else:
        print("[INFO] API check omitido (use --api-url --email --password para habilitar)")

    if failed:
        print(f"\nResultado: {failed} check(s) fallaron")
        return 1
    print("\nResultado: todos los checks pasaron")
    return 0


if __name__ == "__main__":
    sys.exit(main())
