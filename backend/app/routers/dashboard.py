from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.factura import Factura
from app.models.usuario import Usuario
from app.services.inventario_service import alertas_stock_minimo

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)) -> dict:
    hoy = date.today()
    fact_hoy = db.query(Factura).filter(Factura.empresa_id == user.empresa_id, Factura.fecha_emision == hoy).all()
    fact_mes = (
        db.query(Factura)
        .filter(Factura.empresa_id == user.empresa_id)
        .filter(Factura.fecha_emision >= hoy.replace(day=1))
        .all()
    )
    pendientes = (
        db.query(Factura)
        .filter(Factura.empresa_id == user.empresa_id, Factura.sri_estado.in_(["PENDIENTE", "EN_PROCESO", "CONTINGENCIA"]))
        .count()
    )
    ultimas = db.query(Factura).filter(Factura.empresa_id == user.empresa_id).order_by(Factura.id.desc()).limit(5).all()

    return {
        "ventas_hoy": {
            "total": sum((f.total for f in fact_hoy), Decimal("0")),
            "cantidad_facturas": len(fact_hoy),
        },
        "ventas_mes": {
            "total": sum((f.total for f in fact_mes), Decimal("0")),
            "cantidad_facturas": len(fact_mes),
        },
        "productos_bajo_stock": [
            {"id": p.id, "nombre": p.nombre, "stock_actual": p.stock_actual, "stock_minimo": p.stock_minimo}
            for p in alertas_stock_minimo(db)
        ],
        "facturas_pendientes_sri": pendientes,
        "ultimas_5_facturas": [
            {"id": f.id, "numero": f.numero_comprobante, "total": f.total, "sri_estado": f.sri_estado} for f in ultimas
        ],
    }
