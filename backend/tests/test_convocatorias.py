import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from app.schemas.secop import SecopConvocatoria

pytestmark = pytest.mark.asyncio

MOCK_CONV = SecopConvocatoria(
    secop_process_id="TEST-001",
    entidad="Entidad Test",
    departamento="Bogotá D.C.",
    nombre_procedimiento="Contrato Test",
    estado_apertura="Abierto",
)


async def test_list_convocatorias_ok(client: AsyncClient, auth_headers: dict):
    with patch("app.api.v1.convocatorias.SecopService.search", new_callable=AsyncMock) as mock:
        mock.return_value = [MOCK_CONV]
        resp = await client.get("/api/v1/convocatorias", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body and "meta" in body
    assert body["data"][0]["secop_process_id"] == "TEST-001"


async def test_list_convocatorias_unauthorized(client: AsyncClient):
    resp = await client.get("/api/v1/convocatorias")
    assert resp.status_code == 403


async def test_get_convocatoria_ok(client: AsyncClient, auth_headers: dict):
    with patch("app.api.v1.convocatorias.SecopService.get_by_id", new_callable=AsyncMock) as mock:
        mock.return_value = MOCK_CONV
        resp = await client.get("/api/v1/convocatorias/TEST-001", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["secop_process_id"] == "TEST-001"


async def test_get_convocatoria_not_found(client: AsyncClient, auth_headers: dict):
    with patch("app.api.v1.convocatorias.SecopService.get_by_id", new_callable=AsyncMock) as mock:
        mock.return_value = None
        resp = await client.get("/api/v1/convocatorias/FAKE-999", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_convocatoria_502(client: AsyncClient, auth_headers: dict):
    from app.services.secop_service import SecopServiceError
    with patch("app.api.v1.convocatorias.SecopService.get_by_id", new_callable=AsyncMock) as mock:
        mock.side_effect = SecopServiceError("timeout")
        resp = await client.get("/api/v1/convocatorias/ANY", headers=auth_headers)
    assert resp.status_code == 502
    assert resp.json()["detail"]["code"] == "SECOP_ERROR"
