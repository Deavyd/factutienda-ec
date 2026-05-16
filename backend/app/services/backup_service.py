from __future__ import annotations

import json
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session


def backup_base_datos(db: Session) -> str:
    out_dir = Path("data/backups")
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = out_dir / f"backup_{ts}.json"
    zip_path = out_dir / f"backup_{ts}.zip"

    tables = [r[0] for r in db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))]
    dump: dict[str, list[dict]] = {}
    for t in tables:
        rows = db.execute(text(f"SELECT * FROM {t}")).mappings().all()
        dump[t] = [dict(r) for r in rows]

    json_path.write_text(json.dumps(dump, default=str), encoding="utf-8")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(json_path, arcname=json_path.name)
    json_path.unlink(missing_ok=True)
    return str(zip_path)


def limpiar_backups_antiguos(dias: int = 30) -> None:
    out_dir = Path("data/backups")
    if not out_dir.exists():
        return
    limite = datetime.now() - timedelta(days=dias)
    for f in out_dir.glob("*.zip"):
        if datetime.fromtimestamp(f.stat().st_mtime) < limite:
            f.unlink(missing_ok=True)
