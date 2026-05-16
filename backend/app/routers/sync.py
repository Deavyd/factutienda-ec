from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.cola_sincronizacion import ColaSincronizacion
from app.models.usuario import Usuario
from app.services.sync_service import get_estado_sync, procesar_cola, reintentar_errores

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/estado")
def estado(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return get_estado_sync(None, db)


@router.post("/procesar")
def procesar(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return procesar_cola(db)


@router.get("/cola")
def cola(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(ColaSincronizacion).order_by(ColaSincronizacion.id.desc()).limit(50).all()


@router.post("/reintentar")
def reintentar(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    reintentar_errores(db)
    return {"ok": True}


@router.delete("/cola/{cid}")
def eliminar(cid: int, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    item = db.query(ColaSincronizacion).filter(ColaSincronizacion.id == cid).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}
