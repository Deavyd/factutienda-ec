from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import socket

import uvicorn


def find_port(start: int = 8000, max_tries: int = 20) -> int:
    for port in range(start, start + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError("No hay puerto disponible")


def configure_logging() -> None:
    Path("logs").mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler("logs/backend.log", maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8")
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(fmt)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(handler)


def main() -> None:
    configure_logging()
    Path("data").mkdir(parents=True, exist_ok=True)
    port = find_port(8000)
    Path("data/server.port").write_text(str(port), encoding="utf-8")
    logging.getLogger(__name__).info("Iniciando backend en puerto %s", port)
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, log_level="info")


if __name__ == "__main__":
    main()
