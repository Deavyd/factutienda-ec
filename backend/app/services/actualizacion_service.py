from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import requests

from app.core.config import get_settings

settings = get_settings()


def get_version_actual() -> str:
    path = Path("version.txt")
    if path.exists():
        return path.read_text(encoding="utf-8").strip() or settings.APP_VERSION
    return settings.APP_VERSION


def _version_tuple(value: str) -> tuple[int, ...]:
    try:
        return tuple(int(x) for x in value.strip().split("."))
    except Exception:
        return (0,)


def verificar_actualizacion_disponible() -> dict:
    actual = get_version_actual()
    if not settings.UPDATE_CHECK_URL:
        return {
            "hay_actualizacion": False,
            "version_actual": actual,
            "version_disponible": actual,
            "descripcion_cambios": "UPDATE_CHECK_URL no configurado",
            "url_descarga": "",
        }
    try:
        data = requests.get(settings.UPDATE_CHECK_URL, timeout=5).json()
        disponible = str(data.get("version", actual))
        return {
            "hay_actualizacion": _version_tuple(disponible) > _version_tuple(actual),
            "version_actual": actual,
            "version_disponible": disponible,
            "descripcion_cambios": data.get("descripcion_cambios", ""),
            "url_descarga": data.get("url_descarga", ""),
        }
    except Exception as exc:
        return {
            "hay_actualizacion": False,
            "version_actual": actual,
            "version_disponible": actual,
            "descripcion_cambios": f"No se pudo verificar: {exc}",
            "url_descarga": "",
        }


def backup_antes_actualizar() -> str:
    version = get_version_actual()
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    backups = Path("data/backups")
    backups.mkdir(parents=True, exist_ok=True)

    db_src = Path(settings.SQLITE_PATH)
    db_backup = backups / f"backup_v{version}_{now}.db"
    if db_src.exists():
        shutil.copy2(db_src, db_backup)

    comps = Path("data/comprobantes")
    zip_path = backups / f"comprobantes_v{version}_{now}.zip"
    with ZipFile(zip_path, "w", ZIP_DEFLATED) as zf:
        if comps.exists():
            for file in comps.rglob("*"):
                if file.is_file():
                    zf.write(file, arcname=file.relative_to(comps.parent))
    return str(db_backup)


def restaurar_backup(backup_path: str) -> bool:
    source = Path(backup_path)
    target = Path(settings.SQLITE_PATH)
    if not source.exists() or source.suffix != ".db":
        return False
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return True


def listar_backups() -> list[dict]:
    base = Path("data/backups")
    if not base.exists():
        return []
    items = []
    for f in sorted(base.glob("*"), key=lambda x: x.stat().st_mtime, reverse=True):
        items.append(
            {
                "fecha": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
                "version": f.name.split("_", 2)[1].replace("v", "") if "_" in f.name else "",
                "tamano": f.stat().st_size,
                "path": str(f),
            }
        )
    return items
