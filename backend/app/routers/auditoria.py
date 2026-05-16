import io
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.usuario import Usuario
from app.services.auditoria_service import get_auditoria
from app.utils.exportador import exportar_excel

router = APIRouter(prefix="/auditoria", tags=["auditoria"])


@router.get("")
def listar(
    usuario_id: int | None = Query(default=None),
    modulo: str | None = Query(default=None),
    accion: str | None = Query(default=None),
    fecha_inicio: date | None = Query(default=None),
    fecha_fin: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    filtros: dict = {}
    if usuario_id:
        filtros["usuario_id"] = usuario_id
    if modulo:
        filtros["modulo"] = modulo.upper()
    if accion:
        filtros["accion"] = accion.upper()
    if fecha_inicio:
        filtros["fecha_inicio"] = fecha_inicio
    if fecha_fin:
        filtros["fecha_fin"] = fecha_fin
    return get_auditoria(filtros, db)


@router.get("/exportar")
def exportar(
    usuario_id: int | None = Query(default=None),
    modulo: str | None = Query(default=None),
    accion: str | None = Query(default=None),
    fecha_inicio: date | None = Query(default=None),
    fecha_fin: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    filtros = {}
    if usuario_id:
        filtros["usuario_id"] = usuario_id
    if modulo:
        filtros["modulo"] = modulo.upper()
    if accion:
        filtros["accion"] = accion.upper()
    if fecha_inicio:
        filtros["fecha_inicio"] = fecha_inicio
    if fecha_fin:
        filtros["fecha_fin"] = fecha_fin
    rows = get_auditoria(filtros, db)
    data = [
        {
            "id": r.id,
            "usuario": r.usuario_nombre,
            "accion": r.accion,
            "modulo": r.modulo,
            "registro_id": r.registro_id,
            "resultado": r.resultado,
            "fecha": r.created_at.isoformat() if r.created_at else "",
        }
        for r in rows
    ]
    content = exportar_excel(data, ["id", "usuario", "accion", "modulo", "registro_id", "resultado", "fecha"], "Auditoria")
    fname = f"auditoria_{datetime.now().strftime('%Y_%m_%d')}.xlsx"
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )
