# Spec 03 — Portal de Convocatorias Publicas: API REST

> Stack: FastAPI (Python 3.12) + JWT (HS256) + PostgreSQL 16 + Angular 20.
> Scope: contrato REST completo entre frontend, backend y las dos fuentes de datos
> (PostgreSQL para identidad/bookmarks/busquedas, SODA API para convocatorias SECOP).
> Gate: precision >= 0.85. Target: Spec-B depth (~480 palabras).
> Referencias: spec-01-database-schema.md, spec-02-architecture.md

## Domain

Contrato HTTP que conecta las tres capas del sistema: Angular 20 consume
exclusivamente `/api/v1/...`, FastAPI orquesta dos fuentes de datos (PostgreSQL
para users/bookmarks/saved_searches, y la SODA API de datos.gov.co para
convocatorias SECOP en vivo), y JWT protege todo endpoint salvo registro y login.
Cada respuesta sigue el formato `{ data, meta, error }` definido en CLAUDE.md.

## Scope (endpoints)

Quince endpoints en cinco grupos. El gate penaliza endpoints inventados fuera de este listado.

**Auth (sin JWT)**:

- `POST /api/v1/auth/register` — body `{email, password, full_name}` → `{data: {id, email, full_name, access_token}}`. Hashea password con bcrypt, INSERT en `users`. Error 409 si email existe.
- `POST /api/v1/auth/login` — body `{email, password}` → `{data: {access_token, token_type}}`. Verifica hash bcrypt. Error 401 si credenciales invalidas.

**Perfil (JWT requerido)**:

- `GET /api/v1/profile` → `{data: {id, email, full_name, created_at}}`. SELECT users por `token.sub`.
- `PUT /api/v1/profile` — body `{full_name}` → `{data: {...}}`. UPDATE users.

**Convocatorias SECOP (JWT requerido, no toca PostgreSQL)**:

- `GET /api/v1/convocatorias` — query `q, entidad, departamento, estado_apertura, tipo_contrato, modalidad, fecha_desde, fecha_hasta, precio_min, precio_max, limit, offset` → `{data: [...], meta: {total, limit, offset}}`. Traduce a parametros SODA `$q, $where, $limit, $offset`. Error 502 si SODA no responde.
- `GET /api/v1/convocatorias/{secop_process_id}` → `{data: {...}}`. SODA con `$where=id_del_proceso='{id}'`. Errores: 404 si el proceso no existe, 502 si SODA no responde.

**Bookmarks (JWT requerido)**:

- `GET /api/v1/bookmarks` — query `entidad?, departamento?, estado_apertura?, limit, offset` → `{data: [...], meta: {...}}`. SELECT bookmarks WHERE user_id Y deleted_at IS NULL.
- `POST /api/v1/bookmarks` — body `{secop_process_id}` → `{data: {...}}`. Llama SODA para snapshot, INSERT en bookmarks. Errores: 409 si ya existe activo, 502 si SODA no responde.
- `DELETE /api/v1/bookmarks/{bookmark_id}` → `{data: {id, deleted_at}}`. Soft delete, valida ownership. Error 404 si no pertenece al usuario.

**Busquedas guardadas (JWT requerido)**:

- `GET /api/v1/searches` → `{data: [...]}`.
- `POST /api/v1/searches` — body `{name, query_params}` → `{data: {...}}`.
- `PUT /api/v1/searches/{search_id}` — body `{name?, query_params?}` → `{data: {...}}`.
- `DELETE /api/v1/searches/{search_id}` → `{data: {id, deleted_at}}`.

## Tech stack

- FastAPI con `Depends` para inyeccion de sesion DB y validacion JWT.
- `python-jose[cryptography]` para encode/decode JWT, algoritmo HS256.
- `passlib[bcrypt]` para hash de password (cost factor default).
- Pydantic v2 para schemas de request/response (`schemas/` por recurso).
- Llamadas a SODA delegadas a `SecopService` — ver spec-04 para cliente HTTP, timeout y manejo de errores.

## Conventions

- Prefijo de path: `/api/v1/` en todas las rutas.
- Header de auth: `Authorization: Bearer <token>`.
- Respuesta exitosa: `{"data": <objeto|lista>, "meta": {...}}` — `meta` solo en listas paginadas.
- Respuesta de error: `{"error": {"code": "SNAKE_CASE", "message": "texto legible"}}`.
- Paginacion: query params `limit` (default 20, max 100) y `offset` (default 0) en todo endpoint de lista.
- Nombres de query params en snake_case, igual que las columnas de BD.
- Los schemas `*Out` (BookmarkOut, SavedSearchOut, SecopConvocatoria) exponen las columnas no sensibles de la tabla o mapeo correspondiente (spec-01, spec-04) — los `{data: {...}}` de este documento no repiten ese detalle campo por campo.
- Codigo de error `502 SECOP_ERROR`: usado por cualquier endpoint que dependa de `SecopService` (convocatorias, creacion de bookmarks) cuando la SODA API no responde o retorna un error de servidor (ver spec-04).

## Integrity rules

1. Todo endpoint salvo `/auth/register` y `/auth/login` requiere JWT valido via `Depends(get_current_user)`.
2. El JWT contiene `sub` (user_id), `email`, `exp`. Expira segun `ACCESS_TOKEN_EXPIRE_MINUTES` (env var, default 60).
3. Validacion de ownership: bookmarks y saved_searches solo son visibles/modificables por su `user_id` — comparar contra `token.sub`, nunca confiar en el body. Un recurso que existe pero no pertenece al usuario responde `404 NOT_FOUND`, nunca `403`, para no revelar su existencia a terceros.
4. `POST /bookmarks` es transaccional: si la llamada a SODA falla, no se inserta el bookmark (rollback).
5. Las respuestas de error nunca exponen detalles internos (stack traces, SQL) — solo `code` y `message`.
6. Passwords nunca se devuelven en ninguna respuesta, ni siquiera hasheados.

## Safe-change rules

- Nuevos endpoints van bajo `/api/v1/` — un nuevo major version (`/api/v2/`) solo si se rompe compatibilidad.
- Nuevos query params opcionales se agregan con default `None` — no rompen clientes existentes.
- Codigos de error nuevos se documentan en este archivo antes de implementarse.
- Cambios en el payload del JWT requieren invalidar tokens existentes (todos los usuarios deben re-login).

## Out of scope

- Refresh tokens / rotacion de tokens: el access token expira y el usuario re-loguea.
- Rate limiting por usuario o IP.
- Webhooks o callbacks hacia el frontend.
- Endpoints de administracion (gestion de otros usuarios).
- Versionado de API mas alla de `/v1`.
- GraphQL o cualquier protocolo distinto a REST/JSON.

## Deliverable

Codigo FastAPI organizado segun spec-02 (`api/v1/`, `services/`, `repositories/`, `schemas/`, `core/security.py`)
que implemente exactamente los 15 endpoints listados, con:

1. Schemas Pydantic de request y response por endpoint.
2. Dependencia `get_current_user` reutilizada en todos los endpoints protegidos.
3. Manejo de errores centralizado (exception handlers de FastAPI) que produzca el formato `{error: {code, message}}`.
4. Documentacion automatica via OpenAPI (`/docs`) generada por FastAPI sin configuracion adicional.

Sin codigo frontend en esta spec — el consumo desde Angular se documenta en una spec posterior si es necesario.
