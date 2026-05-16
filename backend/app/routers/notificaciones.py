from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario
from app.services.notificacion_service import get_notificaciones_usuario, marcar_leida

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("")
def mis_notificaciones(
    solo_no_leidas: bool = False,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    return get_notificaciones_usuario(user.id, solo_no_leidas, db)


@router.get("/no-leidas/count")
def count_no_leidas(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    return {"count": db.query(Notificacion).filter(Notificacion.leida.is_(False), (Notificacion.usuario_id == user.id) | (Notificacion.usuario_id.is_(None))).count()}


@router.put("/{nid}/leer")
def leer(nid: int, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    n = db.query(Notificacion).filter(Notificacion.id == nid).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    marcar_leida(nid, db)
    return {"ok": True}


@router.put("/leer-todas")
def leer_todas(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    db.query(Notificacion).filter(Notificacion.leida.is_(False), (Notificacion.usuario_id == user.id) | (Notificacion.usuario_id.is_(None))).update({Notificacion.leida: True})
    db.commit()
    return {"ok": True}


@router.delete("/{nid}")
def eliminar(nid: int, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    n = db.query(Notificacion).filter(Notificacion.id == nid).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    db.delete(n)
    db.commit()
    return {"ok": True}
