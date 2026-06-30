import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_ok(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "new@example.com", "password": "secret123", "full_name": "New User"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["email"] == "new@example.com"


async def test_register_duplicate(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "secret123", "full_name": "Dup"}
    await client.post("/api/v1/auth/register", json=payload)
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "EMAIL_ALREADY_EXISTS"


async def test_login_ok(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com", "password": "pass1234", "full_name": "Login User"
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com", "password": "pass1234"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_invalid_credentials(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com", "password": "wrong"
    })
    assert resp.status_code == 401
    assert resp.json()["detail"]["code"] == "INVALID_CREDENTIALS"
