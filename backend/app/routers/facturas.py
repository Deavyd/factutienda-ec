from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from random import randint

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_db
from app.models.detalle_factura import DetalleFactura
from app.models.factura import Factura
from app.models.forma_pago_factura import FormaPagoFactura
from app.models.movimiento_caja import MovimientoCaja
from app.models.turno_caja import TurnoCaja
from app.models.persona import Persona
from app.models.producto import Producto
from app.models.punto_emision import PuntoEmision
from app.models.usuario import Usuario
from app.schemas.factura import FacturaCreate, FacturaOut
from app.services.inventario_service import descontar_stock
from app.services.factura_service import calcular_fecha_limite_anulacion, validar_consumidor_final_sri, validar_monto_maximo_sri
from app.services.iva_service import validar_cuadre_totales
from app.services.precio_service import get_lista_precio_cliente, get_precio_producto, validar_credito_cliente
from app.services.sri_service import consultar_autorizacion, enviar_comprobante
from app.utils.clave_acceso import generar_clave_acceso
from app.utils.firma import firmar_xml
from app.utils.xml_generator import generar_xml_factura

settings = get_settings()
router = APIRouter(prefix="/facturas", tags=["facturas"])


def _r2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), ROUND_HALF_UP)


@router.post("", response_model=FacturaOut, status_code=status.HTTP_201_CREATED)
def create_factura(
    payload: FacturaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Factura:
    if payload.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Empresa no autorizada")

    cliente = db.query(Persona).filter(Persona.id == payload.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    punto = (
        db.query(PuntoEmision)
        .filter(PuntoEmision.id == payload.punto_emision_id, PuntoEmision.establecimiento_id == payload.establecimiento_id)
        .first()
    )
    if not punto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Punto de emision no encontrado")

    secuencial = str(punto.secuencial_factura).zfill(9)
    numero_comprobante = f"{str(payload.establecimiento_id).zfill(3)}-{str(punto.codigo).zfill(3)}-{secuencial}"

    subtotal_12 = Decimal("0")
    subtotal_0 = Decimal("0")
    descuento_total = Decimal("0")
    iva_total = Decimal("0")
    detalles: list[DetalleFactura] = []

    lista_precio_id = payload.lista_precio_id
    if not lista_precio_id:
        try:
            lista_precio_id = get_lista_precio_cliente(payload.cliente_id, db).id
        except Exception:
            lista_precio_id = None

    for item in payload.detalles:
        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not producto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto {item.producto_id} no existe")

        precio_unit = item.precio_unitario
        descuento_item = item.descuento
        if lista_precio_id:
            precio_info = get_precio_producto(producto.id, lista_precio_id, item.cantidad, db)
            precio_unit = Decimal(str(precio_info["precio_base"]))
            descuento_item = Decimal(str(precio_info["descuento_aplicado"]))

        porcentaje_iva = item.iva_tarifa
        tarifa_id = producto.tarifa_iva_id
        if producto.tarifa_iva is not None:
            porcentaje_iva = Decimal(str(producto.tarifa_iva.porcentaje))
        base = _r2((item.cantidad * precio_unit) - descuento_item)
        iva = _r2((base * porcentaje_iva) / Decimal("100"))
        total_linea = base + iva

        if porcentaje_iva > 0:
            subtotal_12 += base
        else:
            subtotal_0 += base
        descuento_total += descuento_item
        iva_total += iva

        detalles.append(
            DetalleFactura(
                producto_id=producto.id,
                codigo_principal=producto.codigo_interno,
                codigo_auxiliar=producto.codigo_auxiliar,
                descripcion=producto.nombre,
                cantidad=item.cantidad,
                precio_unitario=precio_unit,
                descuento=descuento_item,
                tarifa_iva_id=tarifa_id,
                porcentaje_iva_aplicado=porcentaje_iva,
                base_imponible=base,
                iva_tarifa=porcentaje_iva,
                iva_valor=iva,
                valor_iva=iva,
                valor_ice=producto.valor_ice_unitario * item.cantidad,
                tipo_tarifa_iva=str(producto.tarifa_iva.codigo_sri) if producto.tarifa_iva else "2",
                total_linea=total_linea,
            )
        )

    subtotal = _r2(subtotal_12 + subtotal_0)
    total = _r2(subtotal + iva_total)
    validar_cuadre_totales(
        {
            "subtotal_sin_impuestos": subtotal,
            "iva_total": iva_total,
            "valor_ice": Decimal("0"),
            "propina": Decimal("0"),
            "total": total,
        }
    )
    validar_monto_maximo_sri(total)
    validar_consumidor_final_sri(cliente.identificacion, total)

    if payload.venta_credito:
        credito = validar_credito_cliente(payload.cliente_id, total, db)
        if not credito["puede_comprar"]:
            raise HTTPException(status_code=400, detail=f"Credito no disponible: {credito['motivo']}")

    formas = payload.formas_pago or [{"tipo": "EFECTIVO", "monto": str(total)}]
    suma_formas = sum((Decimal(str(f["monto"])) for f in formas), Decimal("0"))
    if suma_formas < total:
        raise HTTPException(status_code=400, detail="La suma de formas de pago no cubre el total")
    vuelto = Decimal("0")
    efectivo = next((Decimal(str(f["monto"])) for f in formas if f.get("tipo") == "EFECTIVO"), Decimal("0"))
    if suma_formas > total and efectivo > 0:
        vuelto = suma_formas - total

    clave = generar_clave_acceso(
        fecha_emision=payload.fecha_emision,
        tipo_comprobante="01",
        ruc=settings.SRI_RUC,
        ambiente=settings.AMBIENTE_SRI,
        serie=f"{str(payload.establecimiento_id).zfill(3)}{punto.codigo}",
        secuencial=secuencial,
        codigo_numerico=str(randint(1, 99999999)).zfill(8),
        tipo_emision=settings.SRI_EMISION,
    )

    factura = Factura(
        empresa_id=payload.empresa_id,
        establecimiento_id=payload.establecimiento_id,
        punto_emision_id=payload.punto_emision_id,
        usuario_id=current_user.id,
        cliente_id=payload.cliente_id,
        fecha_emision=payload.fecha_emision,
        secuencial=secuencial,
        numero_comprobante=numero_comprobante,
        clave_acceso=clave,
        subtotal_sin_impuestos=subtotal,
        subtotal_0=subtotal_0,
        subtotal_12=subtotal_12,
        descuento_total=descuento_total,
        iva_total=iva_total,
        total=total,
        ambiente_sri=settings.AMBIENTE_SRI,
        estado="emitida",
        sri_estado="pendiente",
        fecha_limite_anulacion=calcular_fecha_limite_anulacion(None, payload.fecha_emision),
    )
    factura.detalles = detalles
    db.add(factura)
    db.flush()

    for fp in formas:
        db.add(
            FormaPagoFactura(
                factura_id=factura.id,
                tipo=fp.get("tipo", "EFECTIVO"),
                monto=Decimal(str(fp.get("monto", "0"))),
                referencia=fp.get("referencia"),
            )
        )

    turno = db.query(TurnoCaja).filter(TurnoCaja.usuario_id == current_user.id, TurnoCaja.estado == "ABIERTO").first()
    if turno and efectivo > 0:
        db.add(
            MovimientoCaja(
                turno_caja_id=turno.id,
                tipo="VENTA",
                monto=max(Decimal("0"), efectivo - vuelto),
                descripcion=f"Factura {numero_comprobante}",
                referencia_id=str(factura.id),
            )
        )

    descontar_stock(
        detalle_factura=[{"producto_id": d.producto_id, "cantidad": str(d.cantidad)} for d in detalles],
        db=db,
    )

    punto.secuencial_factura += 1

    db.flush()
    db.refresh(factura)

    xml = generar_xml_factura(
        {
            "infoTributaria": {
                "ambiente": str(settings.AMBIENTE_SRI),
                "tipoEmision": "1",
                "razonSocial": factura.empresa.razon_social,
                "nombreComercial": factura.empresa.nombre_comercial or "",
                "ruc": factura.empresa.ruc,
                "claveAcceso": factura.clave_acceso or "",
                "codDoc": "01",
                "estab": factura.establecimiento.codigo,
                "ptoEmi": factura.punto_emision.codigo,
                "secuencial": factura.secuencial,
                "dirMatriz": factura.empresa.direccion_matriz,
                "regimen": factura.empresa.regimen,
            },
            "infoFactura": {
                "fechaEmision": factura.fecha_emision.strftime("%d/%m/%Y"),
                "dirEstablecimiento": factura.establecimiento.direccion,
                "guiaRemision": factura.guia_remision_numero or "",
                "comercialNegociable": factura.es_comercial_negociable,
                "propina": str(factura.propina_valor),
                "obligadoContabilidad": "SI" if factura.empresa.obligado_contabilidad else "NO",
                "tipoIdentificacionComprador": "04",
                "razonSocialComprador": factura.cliente.razon_social,
                "identificacionComprador": factura.cliente.identificacion,
                "totalSinImpuestos": str(factura.subtotal_sin_impuestos),
                "totalDescuento": str(factura.descuento_total),
                "formaPago": "01",
            },
            "detalles": [
                {
                "codigoPrincipal": d.codigo_principal,
                "codigoAuxiliar": d.codigo_auxiliar or "",
                "descripcion": d.descripcion,
                "cantidad": str(d.cantidad),
                "precioUnitario": str(d.precio_unitario),
                "descuento": str(d.descuento),
                "ivaTarifa": str(d.iva_tarifa),
                "porcentajeIvaAplicado": str(d.porcentaje_iva_aplicado),
                "codigoSRI": d.tipo_tarifa_iva or str(d.producto.tarifa_iva.codigo_sri) if d.producto and d.producto.tarifa_iva else ("0" if d.iva_tarifa == 0 else ("8" if d.iva_tarifa == 5 else "2")),
                "valor_ice": str(d.valor_ice),
                "tarifaICE": str(d.producto.tarifa_ice) if d.producto else "0",
                }
                for d in factura.detalles
            ],
            "infoAdicional": {"email": factura.cliente.email or ""},
        }
    )
    xml_firmado = firmar_xml(xml, settings.SRI_CERT_PATH, settings.SRI_CERT_PASSWORD)
    recepcion = enviar_comprobante(xml_firmado)
    factura.sri_estado = "recibida" if recepcion.get("estado") == "RECIBIDA" else "error"

    if factura.sri_estado == "recibida":
        autorizacion = consultar_autorizacion(clave)
        if autorizacion.get("estado") == "AUTORIZADA":
            factura.sri_estado = "autorizada"
            factura.sri_autorizacion = clave

    db.commit()
    db.refresh(factura)
    return factura


@router.get("", response_model=list[FacturaOut])
def list_facturas(
    sri_estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[Factura]:
    query = (
        db.query(Factura)
        .options(joinedload(Factura.detalles))
        .filter(Factura.empresa_id == current_user.empresa_id)
        .order_by(Factura.id.desc())
    )
    if sri_estado:
        query = query.filter(Factura.sri_estado == sri_estado)
    return query.all()


@router.get("/{factura_id}", response_model=FacturaOut)
def get_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Factura:
    factura = (
        db.query(Factura)
        .options(joinedload(Factura.detalles))
        .filter(Factura.id == factura_id, Factura.empresa_id == current_user.empresa_id)
        .first()
    )
    if not factura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
    return factura


@router.post("/{factura_id}/reenviar", response_model=FacturaOut)
def reenviar_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Factura:
    factura = (
        db.query(Factura)
        .options(joinedload(Factura.detalles), joinedload(Factura.empresa), joinedload(Factura.punto_emision), joinedload(Factura.establecimiento))
        .filter(Factura.id == factura_id, Factura.empresa_id == current_user.empresa_id)
        .first()
    )
    if not factura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")

    xml = generar_xml_factura(
        {
            "infoTributaria": {
                "ambiente": str(settings.AMBIENTE_SRI),
                "tipoEmision": "1",
                "razonSocial": factura.empresa.razon_social,
                "nombreComercial": factura.empresa.nombre_comercial or "",
                "ruc": factura.empresa.ruc,
                "claveAcceso": factura.clave_acceso or "",
                "codDoc": "01",
                "estab": factura.establecimiento.codigo,
                "ptoEmi": factura.punto_emision.codigo,
                "secuencial": factura.secuencial,
                "dirMatriz": factura.empresa.direccion_matriz,
                "regimen": factura.empresa.regimen,
            },
            "infoFactura": {
                "fechaEmision": factura.fecha_emision.strftime("%d/%m/%Y"),
                "dirEstablecimiento": factura.establecimiento.direccion,
                "guiaRemision": factura.guia_remision_numero or "",
                "comercialNegociable": factura.es_comercial_negociable,
                "propina": str(factura.propina_valor),
                "obligadoContabilidad": "SI" if factura.empresa.obligado_contabilidad else "NO",
                "tipoIdentificacionComprador": "04",
                "razonSocialComprador": factura.cliente.razon_social,
                "identificacionComprador": factura.cliente.identificacion,
                "totalSinImpuestos": str(factura.subtotal_sin_impuestos),
                "totalDescuento": str(factura.descuento_total),
                "formaPago": "01",
            },
            "detalles": [
                {
                "codigoPrincipal": d.codigo_principal,
                "codigoAuxiliar": d.codigo_auxiliar or "",
                "descripcion": d.descripcion,
                "cantidad": str(d.cantidad),
                "precioUnitario": str(d.precio_unitario),
                "descuento": str(d.descuento),
                "ivaTarifa": str(d.iva_tarifa),
                "porcentajeIvaAplicado": str(d.porcentaje_iva_aplicado),
                "codigoSRI": d.tipo_tarifa_iva or str(d.producto.tarifa_iva.codigo_sri) if d.producto and d.producto.tarifa_iva else ("0" if d.iva_tarifa == 0 else ("8" if d.iva_tarifa == 5 else "2")),
                "valor_ice": str(d.valor_ice),
                "tarifaICE": str(d.producto.tarifa_ice) if d.producto else "0",
                }
                for d in factura.detalles
            ],
            "infoAdicional": {"email": factura.cliente.email or ""},
        }
    )
    xml_firmado = firmar_xml(xml, settings.SRI_CERT_PATH, settings.SRI_CERT_PASSWORD)
    recepcion = enviar_comprobante(xml_firmado)
    factura.sri_estado = "recibida" if recepcion.get("estado") == "RECIBIDA" else "error"
    if factura.sri_estado == "recibida":
        autorizacion = consultar_autorizacion(factura.clave_acceso or "")
        if autorizacion.get("estado") == "AUTORIZADA":
            factura.sri_estado = "autorizada"
            factura.sri_autorizacion = factura.clave_acceso

    db.commit()
    db.refresh(factura)
    return factura


@router.post("/offline", response_model=FacturaOut, status_code=status.HTTP_201_CREATED)
def create_factura_offline(
    payload: FacturaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Factura:
    from app.services.sync_service import agregar_a_cola
    if payload.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Empresa no autorizada")
    cliente = db.query(Persona).filter(Persona.id == payload.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    punto = db.query(PuntoEmision).filter(PuntoEmision.id == payload.punto_emision_id, PuntoEmision.establecimiento_id == payload.establecimiento_id).first()
    if not punto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Punto de emision no encontrado")
    secuencial = str(punto.secuencial_factura).zfill(9)
    numero = f"{str(payload.establecimiento_id).zfill(3)}-{str(punto.codigo).zfill(3)}-{secuencial}"
    total = _r2(sum((Decimal(str(d.cantidad)) * Decimal(str(d.precio_unitario)) for d in payload.detalles), Decimal("0")))
    validar_monto_maximo_sri(total)
    validar_consumidor_final_sri(cliente.identificacion, total)
    clave = generar_clave_acceso(fecha_emision=payload.fecha_emision, tipo_comprobante="01", ruc=settings.SRI_RUC, ambiente=settings.AMBIENTE_SRI, serie=f"{str(payload.establecimiento_id).zfill(3)}{punto.codigo}", secuencial=secuencial, codigo_numerico=str(randint(1, 99999999)).zfill(8), tipo_emision=settings.SRI_EMISION)
    factura = Factura(empresa_id=payload.empresa_id, establecimiento_id=payload.establecimiento_id, punto_emision_id=payload.punto_emision_id, usuario_id=current_user.id, cliente_id=payload.cliente_id, fecha_emision=payload.fecha_emision, secuencial=secuencial, numero_comprobante=numero, clave_acceso=clave, subtotal_sin_impuestos=total, subtotal_0=Decimal("0"), subtotal_12=total, descuento_total=Decimal("0"), iva_total=Decimal("0"), total=total, ambiente_sri=settings.AMBIENTE_SRI, estado="emitida", sri_estado="CONTINGENCIA", motivo_contingencia="SIN_INTERNET", fecha_limite_anulacion=calcular_fecha_limite_anulacion(None, payload.fecha_emision))
    db.add(factura)
    db.flush()
    agregar_a_cola("FACTURA", {"factura_id": factura.id}, payload.punto_emision_id, db)
    punto.secuencial_factura += 1
    db.commit()
    db.refresh(factura)
    return factura
