import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_get_profile_ok(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/profile", headers=auth_headers)
    assert resp.status_code == 200
    assert "email" in resp.json()


async def test_get_profile_unauthorized(client: AsyncClient):
    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 403


async def test_update_profile_ok(client: AsyncClient, auth_headers: dict):
    resp = await client.put("/api/v1/profile", json={"full_name": "Updated Name"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"
