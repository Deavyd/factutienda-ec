from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import get_password_hash
from app.main import app
from app.models.base import Base
from app.models.empresa import Empresa
from app.models.establecimiento import Establecimiento
from app.models.persona import Persona
from app.models.producto import Producto
from app.models.punto_emision import PuntoEmision
from app.models.usuario import Usuario


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    empresa = Empresa(
        razon_social="Demo",
        nombre_comercial="Demo",
        ruc="1799999999001",
        direccion_matriz="Quito",
        obligado_contabilidad=True,
        ambiente_sri=1,
        activo=True,
    )
    db.add(empresa)
    db.flush()
    est = Establecimiento(empresa_id=empresa.id, codigo="001", nombre="Matriz", direccion="Quito", activo=True)
    db.add(est)
    db.flush()
    pto = PuntoEmision(establecimiento_id=est.id, codigo="001", activo=True, secuencial_factura=1, secuencial_nota_credito=1)
    db.add(pto)
    user = Usuario(
        empresa_id=empresa.id,
        establecimiento_id=est.id,
        username="admin",
        email="admin@test.com",
        password_hash=get_password_hash("123456"),
        nombres="Admin",
        apellidos="Test",
        rol="admin",
        activo=True,
    )
    db.add(user)
    cliente = Persona(
        empresa_id=empresa.id,
        tipo="cliente",
        tipo_identificacion="CEDULA",
        identificacion="0912345678",
        razon_social="Cliente",
        activo=True,
    )
    db.add(cliente)
    producto = Producto(
        empresa_id=empresa.id,
        codigo_interno="P001",
        nombre="Producto",
        precio_sin_iva=Decimal("10"),
        iva_tarifa=Decimal("15"),
        costo_promedio=Decimal("5"),
        stock_actual=Decimal("50"),
        stock_minimo=Decimal("5"),
        maneja_inventario=True,
        activo=True,
    )
    db.add(producto)
    db.commit()

    from app.core.dependencies import get_db

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield db
    app.dependency_overrides.clear()
    db.close()


@pytest.mark.asyncio
async def test_login_exitoso_y_fallido(db_session: Session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        ok = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "123456"})
        assert ok.status_code == 200
        bad = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "bad"})
        assert bad.status_code == 401


@pytest.mark.asyncio
async def test_crud_productos(db_session: Session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "123456"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        created = await client.post(
            "/api/v1/productos",
            headers=headers,
            json={
                "empresa_id": 1,
                "codigo_interno": "P002",
                "nombre": "Prod 2",
                "precio_sin_iva": "2.0",
                "iva_tarifa": "15",
                "costo_promedio": "1",
                "stock_actual": "20",
                "stock_minimo": "2",
                "maneja_inventario": True,
                "activo": True,
            },
        )
        assert created.status_code == 201
        prod_id = created.json()["id"]
        listed = await client.get("/api/v1/productos", headers=headers)
        assert listed.status_code == 200
        updated = await client.put(f"/api/v1/productos/{prod_id}", headers=headers, json={"nombre": "Prod 2 edit"})
        assert updated.status_code == 200
        deleted = await client.delete(f"/api/v1/productos/{prod_id}", headers=headers)
        assert deleted.status_code == 204


@pytest.mark.asyncio
async def test_reporte_ventas_dia_y_stock_actual(db_session: Session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "123456"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        r1 = await client.get(f"/api/v1/reportes/ventas-dia?fecha={date.today().isoformat()}", headers=headers)
        assert r1.status_code == 200
        r2 = await client.get("/api/v1/reportes/stock-actual", headers=headers)
        assert r2.status_code == 200


@pytest.mark.asyncio
async def test_unidades_tipos_endpoint(db_session: Session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "123456"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.get("/api/v1/unidades/tipos", headers=headers)
        assert res.status_code == 200


@pytest.mark.asyncio
async def test_setup_estado_endpoint(db_session: Session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/setup/estado")
        assert res.status_code in {200, 403}


@pytest.mark.asyncio
async def test_crear_factura_mock_sri(db_session: Session, monkeypatch: pytest.MonkeyPatch):
    from app.routers import facturas as facturas_router

    monkeypatch.setattr(facturas_router, "generar_xml_factura", lambda *_args, **_kwargs: "<factura id='comprobante' version='2.1.0' />")
    monkeypatch.setattr(facturas_router, "firmar_xml", lambda xml, *_args, **_kwargs: xml)
    monkeypatch.setattr(facturas_router, "enviar_comprobante", lambda *_args, **_kwargs: {"estado": "RECIBIDA"})
    monkeypatch.setattr(facturas_router, "consultar_autorizacion", lambda *_args, **_kwargs: {"estado": "AUTORIZADA"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "123456"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.post(
            "/api/v1/facturas",
            headers=headers,
            json={
                "empresa_id": 1,
                "establecimiento_id": 1,
                "punto_emision_id": 1,
                "cliente_id": 1,
                "fecha_emision": date.today().isoformat(),
                "detalles": [{"producto_id": 1, "cantidad": "1", "precio_unitario": "10", "descuento": "0", "iva_tarifa": "15"}],
            },
        )
        assert res.status_code == 201
