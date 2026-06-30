# Plan de Implementación por Fases — Portal de Convocatorias Públicas

> Specs fuente: spec-01 (DB), spec-02 (arquitectura), spec-03 (API REST),
> spec-04 (SECOP), spec-05 (frontend/testing).
> Regla: una fase a la vez — no avanzar sin pasar el gate de verificación.

---

## Fase 0 — Esqueleto del repositorio

**Artefactos:**

- `.gitignore` — Python, Node, .env, __pycache__, /dist, node_modules
- `.env.example` — POSTGRES_DB/USER/PASSWORD/HOST, SECRET_KEY,
  ACCESS_TOKEN_EXPIRE_MINUTES, SODA_BASE_URL, CORS_ORIGINS
- `docker-compose.yml` — servicios `db` (postgres:16-alpine + healthcheck),
  `backend` (uvicorn --reload), `frontend` (ng serve); volumen `pgdata`
- `docker-compose.override.yml` — bind mounts para hot-reload dev
- Directorios vacíos `backend/app/` y `frontend/src/app/`

**Gate:** `docker compose config` sin errores; `.env.example` tiene todas las vars de spec-02.

---

## Fase 1 — Migración inicial PostgreSQL

**Artefacto:**

- `migrations/001_initial_schema.sql` — tablas `users`, `bookmarks`, `saved_searches`
  según spec-01: constraints inline, CREATE INDEX separados, COMMENT ON TABLE/COLUMN
  en columnas cuyos nombres difieren del campo SODA original

**Gate:** `docker compose up db -d` → aplicar SQL → 3 tablas, 0 errores, índices creados.

---

## Fase 2 — Backend: cimientos FastAPI

**Artefactos:**

- `backend/requirements.txt` — fastapi, uvicorn[standard], sqlalchemy[asyncio], alembic,
  httpx, pydantic-settings, python-jose[cryptography], passlib[bcrypt], asyncpg,
  pytest, pytest-asyncio, ruff
- `backend/Dockerfile` — python:3.12-slim, pip install, CMD uvicorn app.main:app --reload
- `backend/alembic.ini` + `backend/alembic/env.py`
- `backend/app/main.py` — FastAPI app, CORS desde env, routers, GET /health, exception handlers
- `backend/app/core/config.py` — pydantic-settings
- `backend/app/core/database.py` — async engine + AsyncSession + get_db
- `backend/app/core/security.py` — JWT, bcrypt, get_current_user
- `backend/app/models/user.py`, `bookmark.py`, `saved_search.py` — ORM SQLAlchemy

**Gate:** `docker compose up db backend` → GET /health 200; GET /docs carga sin errores.

---

## Fase 3 — Backend: Auth y Perfil (4 endpoints)

**Artefactos:**

- `backend/app/schemas/auth.py` — RegisterIn, LoginIn, TokenOut
- `backend/app/schemas/user.py` — ProfileOut, ProfileUpdateIn
- `backend/app/repositories/user_repository.py`
- `backend/app/services/auth_service.py`
- `backend/app/api/v1/auth.py` — POST /register, POST /login
- `backend/app/api/v1/profile.py` — GET /profile, PUT /profile

**Gate (via /docs):** registro → token; login → token; GET /profile con Bearer → datos;
409 en email duplicado; 401 en password incorrecto.

---

## Fase 4 — SECOP Service (2 endpoints)

**Artefactos:**

- `backend/app/schemas/secop.py` — SecopConvocatoria + map_secop_response
- `backend/app/services/secop_service.py` — SecopService.search, get_by_id;
  timeout 10s; escape SoQL injection; SecopServiceError en timeout/5xx
- `backend/app/api/v1/convocatorias.py` — GET /convocatorias, GET /convocatorias/{id}

**Gate:** GET /api/v1/convocatorias → datos reales de datos.gov.co; /{id_falso} → 404;
timeout simulado → 502.

---

## Fase 5 — Bookmarks y Búsquedas guardadas (9 endpoints)

**Artefactos:**

- `backend/app/schemas/bookmark.py`, `saved_search.py`
- `backend/app/repositories/bookmark_repository.py`, `saved_search_repository.py`
- `backend/app/services/bookmark_service.py` — create transaccional con snapshot SODA;
  ownership check → 404 si recurso ajeno
- `backend/app/services/saved_search_service.py`
- `backend/app/api/v1/bookmarks.py` — GET, POST, DELETE /bookmarks
- `backend/app/api/v1/searches.py` — GET, POST, PUT, DELETE /searches

**Gate:** POST bookmark → snapshot guardado; DELETE → soft-delete; 409 en duplicado
activo; 404 en recurso ajeno; 502 si SODA falla en POST.

---

## Fase 6 — Tests de backend (spec-05)

**Artefactos (pytest + httpx.AsyncClient en modo ASGI):**

- `backend/tests/conftest.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_profile.py`
- `backend/tests/test_convocatorias.py` — SODA mockeada
- `backend/tests/test_bookmarks.py`
- `backend/tests/test_searches.py`

**Gate:** `pytest --tb=short` → 0 failures; cubre caso exitoso + error por cada uno
de los 15 endpoints de spec-03.

---

## Fase 7 — Frontend Angular 20 (spec-05)

**Artefactos:**

- `frontend/Dockerfile`
- `frontend/src/app/core/` — AuthService, JwtInterceptor, AuthGuard, API clients
- `frontend/src/app/models/` — interfaces TypeScript
- `frontend/src/app/app.routes.ts` — 6 rutas lazy, AuthGuard en protegidas
- 6 componentes standalone con `.spec.ts`:
  - `features/auth/login/` — LoginComponent
  - `features/auth/register/` — RegisterComponent
  - `features/convocatorias/list/` — ConvocatoriasListComponent
  - `features/convocatorias/detail/` — ConvocatoriaDetailComponent
  - `features/bookmarks/` — BookmarksComponent
  - `features/profile/` — ProfileComponent
- Estados de UI por pantalla: loading, error, empty state

**Gate:** /login carga; register redirige a /convocatorias; AuthGuard bloquea rutas
sin token; `ng test --watch=false` → 0 failures.

---

## Fase 8 — Integración E2E y entregables finales

**Artefactos:**

- `README.md` — setup, `docker compose up --build`, credenciales de prueba
- `SOUL.md` — reflexión del proceso (25% de la evaluación)

**Flujo E2E manual obligatorio (spec-05):**

1. `docker compose up --build`
2. /register → crear cuenta → redirect a /convocatorias
3. Filtrar → guardar bookmark
4. /bookmarks → verificar → eliminar → desaparece

**Gate:** flujo E2E sin errores; repo público con todos los entregables de CLAUDE.md.

---

## Trazabilidad spec → fase

| Fase | Spec fuente principal |
|------|-----------------------|
| 0 | spec-02 (infra), CLAUDE.md |
| 1 | spec-01 (schema SQL) |
| 2 | spec-02 (estructura backend), spec-03 (stack) |
| 3 | spec-03 (endpoints auth/perfil), spec-02 (capas) |
| 4 | spec-04 (SecopService), spec-03 (endpoints convocatorias) |
| 5 | spec-03 (endpoints bookmarks/searches), spec-01 (snapshot) |
| 6 | spec-05 (estrategia testing) |
| 7 | spec-05 (pantallas, flujos), spec-02 (estructura frontend) |
| 8 | CLAUDE.md (entregables), spec-05 (E2E) |
