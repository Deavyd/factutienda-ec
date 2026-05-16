from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat
from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates
from lxml import etree
from signxml import XMLSigner, methods

from app.exceptions import FirmaError

DS_NS = "http://www.w3.org/2000/09/xmldsig#"
XADES_NS = "http://uri.etsi.org/01903/v1.3.2#"


def firmar_xml(xml_string: str, p12_path: str, p12_password: str) -> str:
    """Firma XML con certificado .p12 y retorna XML firmado."""
    cert_file = Path(p12_path)
    if not cert_file.exists():
        raise FirmaError(f"Archivo de certificado no encontrado: {p12_path}")

    try:
        p12_data = cert_file.read_bytes()
        key, cert, extra_chain = load_key_and_certificates(p12_data, p12_password.encode("utf-8"))
    except Exception as exc:
        raise FirmaError("No se pudo abrir el certificado .p12 (password o archivo invalido)") from exc

    if cert is None or key is None:
        raise FirmaError("Certificado .p12 incompleto")

    now = datetime.now(timezone.utc)
    if cert.not_valid_after_utc < now:
        raise FirmaError("Certificado vencido")

    try:
        xml_doc = etree.fromstring(xml_string.encode("utf-8"))
        signer = XMLSigner(
            method=methods.enveloped,
            signature_algorithm="rsa-sha256",
            digest_algorithm="sha256",
            c14n_algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
        )
        cert_pem = cert.public_bytes(Encoding.PEM)
        cert_chain = [cert_pem]
        if extra_chain:
            cert_chain.extend(c.public_bytes(Encoding.PEM) for c in extra_chain)
        signed = signer.sign(
            xml_doc,
            key=key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()),
            cert=cert_chain,
        )

        signature = signed.find(f".//{{{DS_NS}}}Signature")
        if signature is None:
            raise FirmaError("No se encontro nodo ds:Signature luego de firmar")

        signature_id = "Signature-1"
        signature.set("Id", signature_id)

        cert_der = cert.public_bytes(Encoding.DER)
        cert_hash = hashlib.sha1(cert_der).digest()
        cert_hash_b64 = base64.b64encode(cert_hash).decode("ascii")

        obj = etree.SubElement(signature, f"{{{DS_NS}}}Object")
        qp = etree.SubElement(
            obj,
            f"{{{XADES_NS}}}QualifyingProperties",
            nsmap={"xades": XADES_NS, "ds": DS_NS},
            Target=f"#{signature_id}",
        )
        sp = etree.SubElement(qp, f"{{{XADES_NS}}}SignedProperties", Id="SignedProperties-1")
        ssp = etree.SubElement(sp, f"{{{XADES_NS}}}SignedSignatureProperties")
        etree.SubElement(ssp, f"{{{XADES_NS}}}SigningTime").text = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

        sc = etree.SubElement(ssp, f"{{{XADES_NS}}}SigningCertificate")
        cert_el = etree.SubElement(sc, f"{{{XADES_NS}}}Cert")
        cert_digest = etree.SubElement(cert_el, f"{{{XADES_NS}}}CertDigest")
        dm = etree.SubElement(cert_digest, f"{{{DS_NS}}}DigestMethod")
        dm.set("Algorithm", "http://www.w3.org/2000/09/xmldsig#sha1")
        etree.SubElement(cert_digest, f"{{{DS_NS}}}DigestValue").text = cert_hash_b64
        issuer_serial = etree.SubElement(cert_el, f"{{{XADES_NS}}}IssuerSerial")
        etree.SubElement(issuer_serial, f"{{{DS_NS}}}X509IssuerName").text = cert.issuer.rfc4514_string()
        etree.SubElement(issuer_serial, f"{{{DS_NS}}}X509SerialNumber").text = str(cert.serial_number)

        spi = etree.SubElement(ssp, f"{{{XADES_NS}}}SignaturePolicyIdentifier")
        etree.SubElement(spi, f"{{{XADES_NS}}}SignaturePolicyImplied")

        sdp = etree.SubElement(sp, f"{{{XADES_NS}}}SignedDataObjectProperties")
        dof = etree.SubElement(sdp, f"{{{XADES_NS}}}DataObjectFormat", ObjectReference="#comprobante")
        etree.SubElement(dof, f"{{{XADES_NS}}}Description").text = "Comprobante electronico SRI"
        etree.SubElement(dof, f"{{{XADES_NS}}}MimeType").text = "text/xml"

        return etree.tostring(signed, encoding="utf-8", xml_declaration=True).decode("utf-8")
    except Exception as exc:
        raise FirmaError("Error al firmar XML con XAdES-BES") from exc
