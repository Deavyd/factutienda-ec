from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db as get_db_session
from app.core.security import decode_token
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    yield from get_db_session()


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Usuario:
    payload = decode_token(token)
    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin sujeto")

    try:
        user_id = int(subject)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido") from exc

    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user or not user.activo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autorizado")
    return user


def _require_role(user: Usuario, allowed: set[str]) -> Usuario:
    if user.rol.upper() not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol no autorizado")
    return user


def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    return _require_role(user, {"ADMIN", "SUPERADMIN"})


def require_cajero(user: Usuario = Depends(get_current_user)) -> Usuario:
    return _require_role(user, {"CAJERO", "ADMIN", "SUPERADMIN"})


def require_bodeguero(user: Usuario = Depends(get_current_user)) -> Usuario:
    return _require_role(user, {"BODEGUERO", "ADMIN", "SUPERADMIN"})


def require_contador(user: Usuario = Depends(get_current_user)) -> Usuario:
    return _require_role(user, {"CONTADOR", "ADMIN", "SUPERADMIN"})


def require_superadmin(user: Usuario = Depends(get_current_user)) -> Usuario:
    return _require_role(user, {"SUPERADMIN"})
