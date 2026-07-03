import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from app.schemas.secop import SecopConvocatoria

pytestmark = pytest.mark.asyncio

MOCK_CONV = SecopConvocatoria(secop_process_id="BM-001", entidad="Entidad", departamento="Bogotá D.C.")
MOCK_RAW = {"id_del_proceso": "BM-001", "entidad": "Entidad"}


async def test_create_bookmark_ok(client: AsyncClient, auth_headers: dict):
    with patch("app.services.bookmark_service.SecopService.get_by_id", new_callable=AsyncMock) as m1, \
         patch("app.services.bookmark_service.SecopService.get_raw_by_id", new_callable=AsyncMock) as m2:
        m1.return_value = MOCK_CONV
        m2.return_value = MOCK_RAW
        resp = await client.post("/api/v1/bookmarks", json={"secop_process_id": "BM-001"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["data"]["secop_process_id"] == "BM-001"


async def test_create_bookmark_duplicate(client: AsyncClient, auth_headers: dict):
    # El conv devuelto por SECOP debe tener el mismo id que se solicita (como en producción).
    dup_conv = SecopConvocatoria(secop_process_id="BM-DUP", entidad="Entidad", departamento="Bogotá D.C.")
    with patch("app.services.bookmark_service.SecopService.get_by_id", new_callable=AsyncMock) as m1, \
         patch("app.services.bookmark_service.SecopService.get_raw_by_id", new_callable=AsyncMock) as m2:
        m1.return_value = dup_conv
        m2.return_value = {"id_del_proceso": "BM-DUP", "entidad": "Entidad"}
        await client.post("/api/v1/bookmarks", json={"secop_process_id": "BM-DUP"}, headers=auth_headers)
        resp = await client.post("/api/v1/bookmarks", json={"secop_process_id": "BM-DUP"}, headers=auth_headers)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "BOOKMARK_EXISTS"


async def test_create_bookmark_502(client: AsyncClient, auth_headers: dict):
    from app.services.secop_service import SecopServiceError
    with patch("app.services.bookmark_service.SecopService.get_by_id", new_callable=AsyncMock) as mock:
        mock.side_effect = SecopServiceError("down")
        resp = await client.post("/api/v1/bookmarks", json={"secop_process_id": "X"}, headers=auth_headers)
    assert resp.status_code == 502


async def test_list_bookmarks_ok(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/bookmarks", headers=auth_headers)
    assert resp.status_code == 200
    assert "data" in resp.json()


async def test_delete_bookmark_ok(client: AsyncClient, auth_headers: dict):
    with patch("app.services.bookmark_service.SecopService.get_by_id", new_callable=AsyncMock) as m1, \
         patch("app.services.bookmark_service.SecopService.get_raw_by_id", new_callable=AsyncMock) as m2:
        m1.return_value = SecopConvocatoria(secop_process_id="BM-DEL")
        m2.return_value = {"id_del_proceso": "BM-DEL"}
        create_resp = await client.post("/api/v1/bookmarks", json={"secop_process_id": "BM-DEL"}, headers=auth_headers)
    bm_id = create_resp.json()["data"]["id"]
    resp = await client.delete(f"/api/v1/bookmarks/{bm_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["deleted_at"] is not None


async def test_delete_bookmark_wrong_user(client: AsyncClient, auth_headers: dict):
    resp = await client.delete("/api/v1/bookmarks/99999", headers=auth_headers)
    assert resp.status_code == 404
