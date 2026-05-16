from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AnyHttpUrl, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "FactuTienda EC API"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    MODO_DESPLIEGUE: Literal["LOCAL", "CLOUD"] = "LOCAL"
    DATABASE_URL: str = "sqlite:///./data/factutienda.db"
    SQLITE_PATH: str = "./data/factutienda.db"
    SQLITE_ECHO: bool = False

    SUPABASE_URL: AnyHttpUrl | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    RAILWAY_PUBLIC_DOMAIN: str | None = None
    VERCEL_DASHBOARD_URL: str | None = None
    VERCEL_POS_URL: str | None = None
    ELECTRON_APP_ORIGIN: str | None = "app://."

    AMBIENTE_SRI: Literal[1, 2] = 2
    SRI_EMISION: Literal[1] = 1
    SRI_RUC: str
    SRI_RAZON_SOCIAL: str
    SRI_NOMBRE_COMERCIAL: str | None = None
    SRI_DIR_MATRIZ: str
    SRI_ESTABLECIMIENTO: str = "001"
    SRI_PUNTO_EMISION: str = "001"
    SRI_CERT_PATH: str = "./data/certs/certificado.p12"
    SRI_CERT_PASSWORD: str
    SRI_WS_RECEPCION_PRUEBAS: str
    SRI_WS_AUTORIZACION_PRUEBAS: str
    SRI_WS_RECEPCION_PROD: str
    SRI_WS_AUTORIZACION_PROD: str

    PORT: int = 8000
    APP_VERSION: str = "1.0.0"
    UPDATE_CHECK_URL: str | None = None
    SRI_XSD_FACTURA_PATH: str = "./data/xsd/factura_v2.1.0.xsd"

    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None

    WHATSAPP_PROVIDER: str = "none"
    CALLMEBOT_API_KEY: str | None = None
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_WHATSAPP_FROM: str | None = None

    NOTIF_ENVIAR_EMAIL: bool = False
    NOTIF_ENVIAR_WHATSAPP: bool = False

    @computed_field
    @property
    def SQLITE_URL(self) -> str:
        db_path = Path(self.SQLITE_PATH)
        return f"sqlite+pysqlite:///{db_path}"

    @computed_field
    @property
    def DB_URL_ACTIVA(self) -> str:
        if self.MODO_DESPLIEGUE == "LOCAL":
            return self.SQLITE_URL
        return self.DATABASE_URL

    @property
    def CORS_ORIGINS(self) -> list[str]:
        origins = [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]
        if self.RAILWAY_PUBLIC_DOMAIN:
            origins.append(f"https://{self.RAILWAY_PUBLIC_DOMAIN}")
        if self.VERCEL_DASHBOARD_URL:
            origins.append(self.VERCEL_DASHBOARD_URL)
        if self.VERCEL_POS_URL:
            origins.append(self.VERCEL_POS_URL)
        if self.ELECTRON_APP_ORIGIN:
            origins.append(self.ELECTRON_APP_ORIGIN)
        return list(dict.fromkeys(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()
