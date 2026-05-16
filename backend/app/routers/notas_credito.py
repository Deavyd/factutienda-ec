from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_db
from app.models.factura import Factura
from app.models.nota_credito import NotaCredito
from app.models.usuario import Usuario
from app.services.factura_service import validar_anulacion_factura_2026
from app.services.inventario_service import registrar_kardex
from app.services.sri_service import consultar_autorizacion, enviar_comprobante
from app.utils.firma import firmar_xml
from app.utils.xml_generator import generar_xml_factura

settings = get_settings()
router = APIRouter(prefix="/notas-credito", tags=["notas-credito"])


class DetalleDevolucion(BaseModel):
    producto_id: int
    cantidad: Decimal


class NotaCreditoCreate(BaseModel):
    factura_id: int
    motivo: str
    detalle: list[DetalleDevolucion]
    declarada_ats: bool = False


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_nota_credito(
    payload: NotaCreditoCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> dict:
    factura = db.query(Factura).filter(Factura.id == payload.factura_id, Factura.empresa_id == user.empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura origen no encontrada")
    if factura.sri_estado.lower() != "autorizada":
        raise HTTPException(status_code=400, detail="Factura origen debe estar AUTORIZADA")
    if factura.cliente.identificacion == "9999999999999":
        raise HTTPException(status_code=400, detail="Las notas de credito requieren identificacion del receptor segun normativa SRI")

    try:
        validacion = validar_anulacion_factura_2026(
            factura,
            declarada_ats=payload.declarada_ats,
        )
        factura.fecha_limite_anulacion = validacion["fecha_limite_anulacion"]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    total = sum((item.cantidad for item in payload.detalle), Decimal("0"))
    nota = NotaCredito(
        empresa_id=factura.empresa_id,
        establecimiento_id=factura.establecimiento_id,
        punto_emision_id=factura.punto_emision_id,
        usuario_id=user.id,
        cliente_id=factura.cliente_id,
        factura_id=factura.id,
        fecha_emision=date.today(),
        secuencial="000000001",
        numero_comprobante="001-001-000000001",
        clave_acceso=factura.clave_acceso,
        motivo=payload.motivo,
        total=total,
        sri_estado="PENDIENTE",
    )
    db.add(nota)

    xml = generar_xml_factura(
        {
            "infoTributaria": {
                "ambiente": str(settings.AMBIENTE_SRI),
                "tipoEmision": "1",
                "razonSocial": factura.empresa.razon_social,
                "nombreComercial": factura.empresa.nombre_comercial or "",
                "ruc": factura.empresa.ruc,
                "claveAcceso": factura.clave_acceso or "",
                "codDoc": "04",
                "estab": factura.establecimiento.codigo,
                "ptoEmi": factura.punto_emision.codigo,
                "secuencial": "000000001",
                "dirMatriz": factura.empresa.direccion_matriz,
            },
            "infoFactura": {
                "fechaEmision": date.today().strftime("%d/%m/%Y"),
                "dirEstablecimiento": factura.establecimiento.direccion,
                "obligadoContabilidad": "SI" if factura.empresa.obligado_contabilidad else "NO",
                "tipoIdentificacionComprador": "04",
                "razonSocialComprador": factura.cliente.razon_social,
                "identificacionComprador": factura.cliente.identificacion,
                "totalSinImpuestos": "0.00",
                "totalDescuento": "0.00",
                "formaPago": "01",
            },
            "detalles": [],
            "infoAdicional": {"motivo": payload.motivo},
        }
    )
    firmado = firmar_xml(xml, settings.SRI_CERT_PATH, settings.SRI_CERT_PASSWORD)
    rec = enviar_comprobante(firmado)
    nota.sri_estado = rec.get("estado", "PENDIENTE")
    if nota.sri_estado == "RECIBIDA":
        aut = consultar_autorizacion(nota.clave_acceso or "")
        nota.sri_estado = aut.get("estado", "PENDIENTE")

    for item in payload.detalle:
        registrar_kardex(item.producto_id, "DEVOLUCION", item.cantidad, Decimal("0"), f"NC-{nota.id}", db)

    db.commit()
    db.refresh(nota)
    return {"id": nota.id, "estado": nota.sri_estado}


@router.get("")
def listar_notas_credito(
    sri_estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> list[NotaCredito]:
    query = db.query(NotaCredito).filter(NotaCredito.empresa_id == user.empresa_id)
    if sri_estado:
        query = query.filter(NotaCredito.sri_estado == sri_estado)
    return query.order_by(NotaCredito.id.desc()).all()


@router.get("/{nota_id}")
def get_nota_credito(nota_id: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)) -> NotaCredito:
    nota = db.query(NotaCredito).filter(NotaCredito.id == nota_id, NotaCredito.empresa_id == user.empresa_id).first()
    if not nota:
        raise HTTPException(status_code=404, detail="Nota de credito no encontrada")
    return nota
