from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

sqlite_path = Path(settings.SQLITE_PATH)
sqlite_path.parent.mkdir(parents=True, exist_ok=True)

engine_sqlite = create_engine(settings.SQLITE_URL, connect_args={"check_same_thread": False}, echo=settings.SQLITE_ECHO, future=True)
with engine_sqlite.connect() as conn:
    conn.execute(text("PRAGMA journal_mode=WAL"))
    conn.commit()

engine_pg = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)

SessionPG = sessionmaker(bind=engine_pg, autocommit=False, autoflush=False, class_=Session)
SessionSQLite = sessionmaker(bind=engine_sqlite, autocommit=False, autoflush=False, class_=Session)


def get_online_db() -> Generator[Session, None, None]:
    db = SessionPG()
    try:
        yield db
    finally:
        db.close()


def get_local_db() -> Generator[Session, None, None]:
    db = SessionSQLite()
    try:
        yield db
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    if settings.MODO_DESPLIEGUE == "LOCAL":
        yield from get_local_db()
    else:
        yield from get_online_db()
