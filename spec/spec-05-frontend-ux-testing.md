# Spec 05 — Portal de Convocatorias Publicas: Frontend UX y Testing

> Stack: Angular 20 (standalone) + Reactive Forms + pytest (backend) + Jasmine/Karma (frontend).
> Scope: pantallas, flujos de usuario, validaciones de formulario y estrategia minima
> de testing para complementar spec-01 (DB), spec-02 (arquitectura), spec-03 (API),
> spec-04 (SECOP). Cierra el flujo E2E del reto: registro -> login -> browse -> bookmark.
> Gate: precision >= 0.85. Target: Spec-B depth (~480 palabras).
> Referencias: spec-01-database-schema.md, spec-02-architecture.md, spec-03-api-rest.md, spec-04-integracion-secop.md

## Domain

Define las pantallas Angular 20 que consumen los endpoints de spec-03, sus
validaciones de formulario, y la estrategia minima de testing (backend y
frontend) requerida antes de considerar una feature terminada. Sin esta spec,
spec-02 solo fija la estructura de carpetas pero no el comportamiento visible
para el usuario ni el criterio de "hecho" para pruebas.

## Scope (pantallas y flujos)

Seis rutas. El gate penaliza pantallas inventadas fuera de este listado.

- `/login` — formulario email+password, llama `POST /auth/login`, guarda `access_token` (spec-03), redirige a `/convocatorias`.
- `/register` — formulario email+password+full_name, llama `POST /auth/register`, auto-login con el `access_token` retornado.
- `/convocatorias` — lista paginada con filtros (q, entidad, departamento, estado_apertura, fechas, precio), consume `GET /api/v1/convocatorias`. Boton "Guardar" por fila llama `POST /api/v1/bookmarks`.
- `/convocatorias/:id` — detalle de un proceso, consume `GET /api/v1/convocatorias/{id}`.
- `/bookmarks` — lista de guardados del usuario, consume `GET /api/v1/bookmarks`, boton eliminar llama `DELETE`.
- `/profile` — datos del usuario y edicion de `full_name`, consume `GET`/`PUT /api/v1/profile`.

**Flujo E2E obligatorio** (criterio de evaluacion "Funcionalidad E2E" en CLAUDE.md): registro en `/register` -> redireccion automatica a `/convocatorias` -> filtrar y ver una convocatoria -> guardar como bookmark -> verificar que aparece en `/bookmarks`.

## Tech stack

- Angular Reactive Forms (`FormGroup`, `Validators`) para validacion de formularios.
- `AuthGuard` (funcion `canActivate`) protege `/convocatorias`, `/bookmarks`, `/profile`.
- `JwtInterceptor` (definido en spec-02) agrega el Bearer header automaticamente.
- Backend: `pytest` + `httpx.AsyncClient` como test client contra la app FastAPI.
- Frontend: Jasmine/Karma via Angular CLI (`ng test`), `HttpClientTestingModule` para mockear llamadas API.

## Conventions

- Validaciones de formulario: email con `Validators.email`, password minimo 8 caracteres, `full_name` requerido no vacio. Mensajes de error en español, debajo del campo.
- Estados de UI obligatorios por pantalla con datos asincronos: loading (spinner), error (mensaje + boton reintentar), empty state (texto "No hay resultados").
- Archivos de test: backend `test_{recurso}.py` en `tests/`, frontend `{componente}.spec.ts` junto al componente.
- Rutas no autenticadas que reciben 401 disparan logout automatico (limpiar token, redirigir a `/login`).

## Integrity rules

1. Toda ruta protegida sin sesion valida redirige a `/login` antes de renderizar — nunca se muestra la pantalla y luego falla la llamada API.
2. Cada metodo publico de `services/` y `repositories/` (backend) tiene al menos un test unitario.
3. Cada endpoint de spec-03 tiene al menos un test de integracion cubriendo el caso exitoso y un caso de error (401, 404, 409 o 422 segun aplique).
4. Cada componente standalone de pantalla (no los de `shared/`) tiene al menos un test que verifica render inicial y un caso de interaccion (submit, click guardar, etc.).
5. El flujo E2E completo (registro -> browse -> bookmark) se valida manualmente antes de la demo — no requiere automatizacion E2E en esta version.

## Safe-change rules

- Nuevas pantallas siguen el patron de `features/{dominio}/` de spec-02 con su propio `.spec.ts`.
- Cambios en validaciones de formulario no rompen tests existentes — actualizar el test en el mismo commit que el `Validators`.
- Nuevos endpoints de spec-03 requieren su test de integracion antes de mergear.

## Out of scope

- Automatizacion E2E con Cypress o Playwright — el flujo se valida manualmente para la demo.
- Pruebas de regresion visual o snapshot testing.
- Auditoria de accesibilidad (WCAG) — fuera del alcance del reto.
- Internacionalizacion (i18n) — la interfaz es solo en español.
- Cobertura de codigo con umbral numerico estricto (ej. 80%) — se exige presencia de tests por capa, no un porcentaje.

## Deliverable

Componentes Angular standalone para las 6 rutas listadas (con su `.spec.ts`),
mas suite de tests backend (`tests/test_auth.py`, `tests/test_convocatorias.py`,
`tests/test_bookmarks.py`, `tests/test_searches.py`, `tests/test_profile.py`)
cubriendo los 15 endpoints de spec-03 segun las integrity rules de esta spec.
