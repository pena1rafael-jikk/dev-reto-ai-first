import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_search_ok(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/v1/searches", json={
        "name": "Obras Bogotá", "query_params": {"departamento": "Bogotá D.C.", "q": "obra"}
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["name"] == "Obras Bogotá"


async def test_list_searches_ok(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/searches", headers=auth_headers)
    assert resp.status_code == 200
    assert "data" in resp.json()


async def test_update_search_ok(client: AsyncClient, auth_headers: dict):
    create = await client.post("/api/v1/searches", json={
        "name": "To Update", "query_params": {}
    }, headers=auth_headers)
    sid = create.json()["data"]["id"]
    resp = await client.put(f"/api/v1/searches/{sid}", json={"name": "Updated"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["name"] == "Updated"


async def test_delete_search_ok(client: AsyncClient, auth_headers: dict):
    create = await client.post("/api/v1/searches", json={
        "name": "To Delete", "query_params": {}
    }, headers=auth_headers)
    sid = create.json()["data"]["id"]
    resp = await client.delete(f"/api/v1/searches/{sid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["deleted_at"] is not None


async def test_update_search_wrong_user(client: AsyncClient, auth_headers: dict):
    resp = await client.put("/api/v1/searches/99999", json={"name": "x"}, headers=auth_headers)
    assert resp.status_code == 404


async def test_delete_search_wrong_user(client: AsyncClient, auth_headers: dict):
    resp = await client.delete("/api/v1/searches/99999", headers=auth_headers)
    assert resp.status_code == 404
