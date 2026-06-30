# Spec 02 — Portal de Convocatorias Publicas: Arquitectura del Sistema

> Stack: FastAPI (Python 3.12) + Angular 20 + PostgreSQL 16 + Docker Compose + JWT.
> Scope: capas del sistema, estructura de directorios, reglas arquitecturales, infraestructura.
> Gate: precision >= 0.85. Target: Spec-B depth (~480 palabras).
> Referencias: spec-01-database-schema.md

## Domain

El Portal de Convocatorias Publicas es un sistema web de tres capas: base de datos
relacional (PostgreSQL 16), API REST (FastAPI), e interfaz de usuario (Angular 20).
Las tres capas se orquestan con Docker Compose para que cualquier persona que clone
el repositorio pueda levantar el stack completo con un solo comando sin instalar
dependencias de lenguaje directamente en su maquina. La capa de integracion con
datos.gov.co (SECOP via SODA API) vive exclusivamente dentro del backend.

## Scope (capas y componentes)

Cuatro capas definidas. El gate penaliza capas o servicios inventados fuera de este listado.

**Capa de datos** — PostgreSQL 16:
Servicio `db` en Docker Compose. Tablas definidas en spec-01 (users, bookmarks,
saved_searches). Accedida unicamente por la capa de repositorios del backend.

**Capa de backend** — FastAPI (Python 3.12):
Servicio `backend`. Cinco sub-capas internas ordenadas de mas abstracta a mas concreta:
- `api/v1/` (Routers): contrato HTTP publico, validacion de entrada via Pydantic.
- `services/`: logica de negocio y cliente SODA. Unica capa que llama a SECOP.
- `repositories/`: acceso a datos via SQLAlchemy ORM. Unica capa con SQL.
- `models/`: entidades ORM (User, Bookmark, SavedSearch).
- `schemas/`: DTOs Pydantic para request y response.
- `core/`: configuracion (pydantic-settings), seguridad JWT, sesion de DB.

**Capa de frontend** — Angular 20 standalone:
Servicio `frontend`. Cuatro sub-capas:
- `core/`: AuthService, JwtInterceptor (agrega Bearer header), AuthGuard, API clients.
- `features/`: componentes standalone por dominio (auth, convocatorias, bookmarks, profile).
- `shared/`: componentes, pipes y directivas reutilizables.
- `models/`: interfaces TypeScript que mapean los DTOs del backend.

**Capa de integracion externa** — datos.gov.co SODA API:
No es un servicio Docker. Es consumida por `secop_service.py` via httpx.
Endpoint base: `https://www.datos.gov.co/resource/p6dx-8zbt.json`.

## Tech stack

- PostgreSQL 16-alpine (imagen Docker oficial).
- Python 3.12-slim: fastapi, uvicorn, sqlalchemy, alembic, httpx, pydantic-settings,
  python-jose[cryptography], passlib[bcrypt], pytest, ruff.
- Angular 20: standalone components, provideHttpClient, provideRouter, lazy loading.
  Nginx-alpine en produccion para servir /dist y hacer proxy de /api al backend.
- Docker Compose v2 con healthcheck en db antes de arrancar backend.
- Alembic para migraciones versionadas de PostgreSQL.

## Conventions

**Backend (Python)**:
- Routers: `{recurso}.py` en `app/api/v1/` (auth.py, bookmarks.py, etc.).
- Services: `{recurso}_service.py` con clases `{Recurso}Service`.
- Repositories: `{recurso}_repository.py` con clases `{Recurso}Repository`.
- Models SQLAlchemy: singular (User, Bookmark, SavedSearch).
- Schemas Pydantic: sufijo `Create`, `Update`, `Out` (BookmarkCreate, BookmarkOut).
- Variables de entorno: UPPER_SNAKE_CASE en .env, leidas via `core/config.py`.

**Frontend (TypeScript)**:
- API clients: `{recurso}.api.ts` en `core/api/`.
- Modelos: `{recurso}.model.ts` en `models/`.
- Componentes standalone: un directorio por feature con barrel export `index.ts`.
- Rutas: lazy loading con `loadComponent` en `app.routes.ts`.

**Infraestructura**:
- Secrets en `.env` — nunca en docker-compose.yml ni en codigo fuente.
- `.env.example` en el repo con valores de ejemplo sin secretos reales.

## Integrity rules

1. Frontend llama unicamente a `/api/v1/...` — nunca a PostgreSQL directamente.
2. Routers (`api/v1/`) llaman solo a Services — nunca a Repositories ni a Models ORM.
3. Repositories son la unica capa autorizada para emitir queries SQL (SQLAlchemy ORM).
4. `secop_service.py` es el unico punto de salida hacia datos.gov.co.
5. JWT se decodifica y valida en `core/security.py` via dependencia FastAPI (`Depends`).
6. CORS configurado en `main.py` con origins desde variable de entorno `CORS_ORIGINS`.
7. Migraciones siempre via Alembic — nunca DDL manual en produccion.

## Safe-change rules

- Nuevos endpoints: agregar router en `api/v1/` y registrar en `main.py` sin tocar capas inferiores.
- Nuevas tablas: nueva migracion Alembic + nuevo model + nuevo repository sin modificar
  migrations existentes.
- Cambios de schema Angular: actualizar `models/` y el API client antes que los componentes.
- Variables de entorno nuevas: agregar en `.env.example` y en `core/config.py` con valor default.
- El servicio `db` debe tener healthcheck antes de que `backend` arranque para evitar
  connection errors al inicio del contenedor.

## Out of scope

- CI/CD y GitHub Actions: no requerido para el reto.
- HTTPS/TLS: demo corre en HTTP local.
- Redis, colas de mensajes o workers asincronos.
- WebSockets o notificaciones push.
- Despliegue en cloud (AWS, GCP, Railway, etc.).
- Angular SSR / Universal.
- Multi-tenancy o manejo de organizaciones.

## Deliverable

Dos artefactos generados a partir de esta spec:

**1. Arbol de directorios completo** (texto plano, sin codigo de implementacion):
Muestra cada archivo y carpeta de `backend/`, `frontend/` y la raiz del repo,
con comentario inline del proposito de cada archivo clave.

**2. Archivos de infraestructura**:
- `docker-compose.yml`: servicios `db` (postgres:16-alpine con healthcheck),
  `backend` (uvicorn --reload) y `frontend` (ng serve), volumen `pgdata`.
- `docker-compose.override.yml`: bind mounts para hot-reload en dev.
- `.env.example`: claves `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `POSTGRES_HOST`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`,
  `SODA_BASE_URL`, `CORS_ORIGINS`.
- `.gitignore`: cubre `.env`, `__pycache__`, `node_modules`, `/dist`.

Sin codigo Python ni TypeScript de implementacion — solo estructura e infraestructura.
