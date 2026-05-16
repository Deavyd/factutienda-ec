from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.usuario import Usuario
from app.services.email_service import enviar_email, enviar_factura_email
from app.services.whatsapp_service import enviar_factura_whatsapp, enviar_whatsapp, recordatorio_deuda_whatsapp

router = APIRouter(prefix="/enviar", tags=["notificaciones-externas"])


@router.post("/factura-email/{factura_id}")
def factura_email(factura_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    from app.models.factura import Factura
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    email = factura.cliente.email if factura.cliente else None
    if not email:
        raise HTTPException(status_code=400, detail="Cliente sin email")
    ok = enviar_factura_email(factura_id, email, db)
    return {"enviado": ok}


@router.post("/factura-whatsapp/{factura_id}")
def factura_whatsapp(factura_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    from app.models.factura import Factura
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    telefono = factura.cliente.telefono if factura.cliente else None
    if not telefono:
        raise HTTPException(status_code=400, detail="Cliente sin telefono")
    ok = enviar_factura_whatsapp(factura_id, telefono, db)
    return {"enviado": ok}


@router.post("/recordatorio-deuda/{cliente_id}")
def recordatorio_deuda(cliente_id: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    ok = recordatorio_deuda_whatsapp(cliente_id, db)
    return {"enviado": ok}


@router.post("/test-email")
def test_email(email: str = "admin@test.com", _: Usuario = Depends(require_admin)):
    ok = enviar_email(email, "Prueba FactuTienda EC", "<p>Configuracion SMTP funcionando</p>")
    return {"ok": ok}


@router.post("/test-whatsapp")
def test_whatsapp(numero: str = "+593999999999", _: Usuario = Depends(require_admin)):
    ok = enviar_whatsapp(numero, "Prueba FactuTienda EC - Configuracion funcionando")
    return {"ok": ok}
