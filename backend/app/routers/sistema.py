from pathlib import Path
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_db, require_cajero, require_superadmin
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.services.actualizacion_service import (
    backup_antes_actualizar,
    get_version_actual,
    listar_backups,
    restaurar_backup,
    verificar_actualizacion_disponible,
)
from app.services.backup_service import backup_base_datos
from app.services.conexion_service import get_estado_sistema

router = APIRouter(prefix="/sistema", tags=["sistema"])
settings = get_settings()


class RestoreRequest(BaseModel):
    backup_path: str


@router.post("/backup")
def backup(db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)) -> dict:
    return {"path": backup_base_datos(db)}


@router.get("/backups")
def backups(_: Usuario = Depends(require_superadmin)) -> list[str]:
    p = Path("data/backups")
    if not p.exists():
        return []
    return sorted([x.name for x in p.glob("*.zip")], reverse=True)


@router.get("/info")
def info(db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)) -> dict:
    return {
        "version": "0.1.0",
        "ambiente_sri": settings.AMBIENTE_SRI,
        "usuarios": db.query(Usuario).count(),
        "empresas": db.query(Empresa).count(),
    }


@router.post("/configuracion")
def configuracion(data: dict, db: Session = Depends(get_db), _: Usuario = Depends(require_superadmin)) -> dict:
    empresa = db.query(Empresa).first()
    if empresa:
        for key in ["razon_social", "nombre_comercial", "direccion_matriz", "obligado_contabilidad"]:
            if key in data:
                setattr(empresa, key, data[key])
        db.commit()
    return {"ok": True}


@router.get("/estado-conexion")
def estado_conexion(db: Session = Depends(get_db), _: Usuario = Depends(require_cajero)) -> dict:
    return get_estado_sistema(db)


@router.get("/version")
def version(_: Usuario = Depends(require_superadmin)) -> dict:
    return {"version": get_version_actual()}


@router.get("/actualizaciones")
def actualizaciones(_: Usuario = Depends(require_superadmin)) -> dict:
    return verificar_actualizacion_disponible()


@router.post("/backup-manual")
def backup_manual(_: Usuario = Depends(require_superadmin)) -> dict:
    return {"path": backup_antes_actualizar()}


@router.get("/backups-detalle")
def backups_detalle(_: Usuario = Depends(require_superadmin)) -> list[dict]:
    return listar_backups()


@router.post("/restaurar")
def restaurar(payload: RestoreRequest, _: Usuario = Depends(require_superadmin)) -> dict:
    ok = restaurar_backup(payload.backup_path)
    return {"ok": ok}


@router.get("/logs")
def descargar_logs(_: Usuario = Depends(require_superadmin)) -> Response:
    out = BytesIO()
    with ZipFile(out, "w", ZIP_DEFLATED) as zf:
        for base in [Path("logs"), Path("data/logs")]:
            if not base.exists():
                continue
            for file in base.rglob("*.log*"):
                if file.is_file():
                    zf.write(file, arcname=str(file))
    return Response(
        content=out.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="factutienda_logs.zip"'},
    )
