from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("SRI_RUC", "1799999999001")
os.environ.setdefault("SRI_RAZON_SOCIAL", "FactuTienda Test")
os.environ.setdefault("SRI_DIR_MATRIZ", "Quito")
os.environ.setdefault("SRI_CERT_PASSWORD", "testpass")
os.environ.setdefault("SRI_WS_RECEPCION_PRUEBAS", "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
os.environ.setdefault("SRI_WS_AUTORIZACION_PRUEBAS", "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl")
os.environ.setdefault("SRI_WS_RECEPCION_PROD", "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
os.environ.setdefault("SRI_WS_AUTORIZACION_PROD", "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl")

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID
from lxml import etree
from signxml import XMLVerifier

from app.utils.clave_acceso import generar_clave_acceso
from app.utils.firma import DS_NS, XADES_NS, firmar_xml
from app.utils.xml_generator import generar_xml_factura
from app.services.factura_service import validar_anulacion_factura_2026, validar_consumidor_final_sri
from app.routers.liquidaciones import validar_identificacion_proveedor
from app.services.iva_service import validar_cuadre_totales
from app.services.sri_service import interpretar_error_sri


class _Empresa:
    def __init__(self, regimen: str = "GENERAL") -> None:
        self.regimen = regimen


class _Cliente:
    def __init__(self, identificacion: str) -> None:
        self.identificacion = identificacion


class _FacturaDummy:
    def __init__(self, identificacion: str, fecha_emision: datetime) -> None:
        self.cliente = _Cliente(identificacion)
        self.fecha_emision = fecha_emision.date()
        self.fecha_limite_anulacion = None


def _crear_certificado_prueba(tmp_path: Path) -> tuple[str, str, bytes]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "EC"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "FactuTienda Test"),
            x509.NameAttribute(NameOID.COMMON_NAME, "factutienda.local"),
        ]
    )
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc) - timedelta(days=1))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(days=365))
        .sign(key, hashes.SHA256())
    )
    password = "testpass"
    p12_bytes = pkcs12.serialize_key_and_certificates(
        name=b"factutienda-test",
        key=key,
        cert=cert,
        cas=None,
        encryption_algorithm=serialization.BestAvailableEncryption(password.encode("utf-8")),
    )
    p12_path = tmp_path / "test_cert.p12"
    p12_path.write_bytes(p12_bytes)
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    return str(p12_path), password, cert_pem


def test_flujo_xml_firma_xades(tmp_path: Path) -> None:
    clave = generar_clave_acceso(
        fecha_emision=datetime.now().date(),
        tipo_comprobante="01",
        ruc="1799999999001",
        ambiente=1,
        serie="001001",
        secuencial="123",
        codigo_numerico="12345678",
        tipo_emision=1,
    )

    data = {
        "infoTributaria": {
            "ambiente": "1",
            "tipoEmision": "1",
            "razonSocial": "FactuTienda EC",
            "nombreComercial": "FactuTienda",
            "ruc": "1799999999001",
            "claveAcceso": clave,
            "codDoc": "01",
            "estab": "001",
            "ptoEmi": "001",
            "secuencial": "000000123",
            "dirMatriz": "Quito",
        },
        "infoFactura": {
            "fechaEmision": "14/05/2026",
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
                "descripcion": "Producto demo",
                "cantidad": "1",
                "precioUnitario": "10.00",
                "descuento": "0.00",
                "ivaTarifa": "15",
            }
        ],
        "infoAdicional": {"email": "cliente@test.com", "direccion": "Quito"},
    }

    xml = generar_xml_factura(data)
    p12_path, p12_password, cert_pem = _crear_certificado_prueba(tmp_path)
    xml_firmado = firmar_xml(xml, p12_path, p12_password)

    doc = etree.fromstring(xml_firmado.encode("utf-8"))
    XMLVerifier().verify(doc, x509_cert=cert_pem)

    assert doc.find(f".//{{{XADES_NS}}}SignedProperties") is not None
    assert doc.find(f".//{{{XADES_NS}}}SigningTime") is not None
    assert doc.find(f".//{{{XADES_NS}}}SigningCertificate") is not None
    assert doc.find(f".//{{{XADES_NS}}}SignaturePolicyIdentifier") is not None
    assert doc.find(f".//{{{XADES_NS}}}DataObjectFormat") is not None
    assert doc.find(f".//{{{DS_NS}}}X509Certificate") is not None


def test_factura_rimpe_leyenda_correcta() -> None:
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
            "fechaEmision": "14/05/2026",
            "dirEstablecimiento": "Quito",
            "obligadoContabilidad": "SI",
            "tipoIdentificacionComprador": "05",
            "razonSocialComprador": "Cliente Demo",
            "identificacionComprador": "0912345678",
            "totalSinImpuestos": "10.00",
            "totalDescuento": "0.00",
            "formaPago": "01",
        },
        "detalles": [{"codigoPrincipal": "P001", "descripcion": "Producto", "cantidad": "1", "precioUnitario": "10", "descuento": "0", "ivaTarifa": "0", "codigoSRI": "0"}],
    }
    xml = generar_xml_factura(data)
    doc = etree.fromstring(xml.encode("utf-8"))
    rimpe = doc.find(".//contribuyenteRimpe")
    assert rimpe is not None
    assert rimpe.text == "CONTRIBUYENTE R\u00c9GIMEN RIMPE"
    assert doc.get("version") == "2.1.0"


def test_anulacion_bloqueada_despues_90_dias() -> None:
    factura = _FacturaDummy("0912345678", datetime.now() - timedelta(days=91))
    try:
        validar_anulacion_factura_2026(factura)
        assert False
    except Exception as exc:
        assert "90 dias" in str(exc)


def test_anulacion_permitida_dentro_90_dias() -> None:
    factura = _FacturaDummy("0912345678", datetime.now() - timedelta(days=10))
    validacion = validar_anulacion_factura_2026(factura)
    assert validacion["ok"] is True


def test_consumidor_final_bloquea_montos_mayores_a_50() -> None:
    try:
        validar_consumidor_final_sri("9999999999999", "50.01")
        assert False
    except Exception as exc:
        assert "USD 50.00" in str(exc)


def test_consumidor_final_permite_montos_hasta_50() -> None:
    assert validar_consumidor_final_sri("9999999999999", "50.00") is None


def test_anulacion_bloqueada_consumidor_final() -> None:
    factura = _FacturaDummy("9999999999999", datetime.now())
    try:
        validar_anulacion_factura_2026(factura)
        assert False
    except Exception as exc:
        assert "consumidor final" in str(exc).lower()


def test_redondeo_correcto_totales() -> None:
    ok = validar_cuadre_totales(
        {
            "subtotal_sin_impuestos": "10.01",
            "iva_total": "1.50",
            "valor_ice": "0.00",
            "propina": "0.00",
            "total": "11.51",
        }
    )
    assert ok is True


def test_error_clave_registrada_no_reintenta() -> None:
    result = interpretar_error_sri(None, "Clave acceso registrada")
    assert result["reintentar"] is False
    assert "consultar autorizacion" in str(result["accion"]).lower()


def test_liquidacion_rechaza_consumidor_final() -> None:
    try:
        validar_identificacion_proveedor("9999999999999")
        assert False
    except Exception as exc:
        assert "consumidor final" in str(exc).lower()


def test_contingencia_motivo_y_tipo_emision_xml() -> None:
    data = {
        "infoTributaria": {
            "ambiente": "1",
            "tipoEmision": "2",
            "razonSocial": "FactuTienda EC",
            "nombreComercial": "FactuTienda",
            "ruc": "1799999999001",
            "claveAcceso": "2" * 49,
            "codDoc": "01",
            "estab": "001",
            "ptoEmi": "001",
            "secuencial": "000000123",
            "dirMatriz": "Quito",
        },
        "infoFactura": {
            "fechaEmision": "14/05/2026",
            "dirEstablecimiento": "Quito",
            "obligadoContabilidad": "SI",
            "tipoIdentificacionComprador": "05",
            "razonSocialComprador": "Cliente Demo",
            "identificacionComprador": "0912345678",
            "totalSinImpuestos": "10.00",
            "totalDescuento": "0.00",
            "formaPago": "01",
        },
        "detalles": [{"codigoPrincipal": "P001", "descripcion": "Producto", "cantidad": "1", "precioUnitario": "10", "descuento": "0", "ivaTarifa": "0", "codigoSRI": "0"}],
        "infoAdicional": {"motivo_contingencia": "SIN_INTERNET"},
    }
    xml = generar_xml_factura(data)
    doc = etree.fromstring(xml.encode("utf-8"))
    assert doc.find(".//tipoEmision").text == "2"
