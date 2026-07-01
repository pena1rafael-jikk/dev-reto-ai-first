# SOUL.md — Portal de Convocatorias Públicas

**Autor:** Rafael Peña · joserafaelpenamena@gmail.com
**Repositorio:** https://github.com/pena1rafael-jikk/dev-reto-ai-first
**Programa:** Jikkosoft AI-First · Fase 1 · Track DEV
**Stack:** Angular 20 · FastAPI (Python 3.12) · PostgreSQL 16 · Docker Compose · datos.gov.co (SODA API)

---

## 1. Qué construí y qué problema resuelve

### El problema

El SECOP (Sistema Electrónico de Contratación Pública) publica en `datos.gov.co` todas las convocatorias del Estado colombiano: licitaciones, concursos, contrataciones directas. Es información pública y valiosa —una PYME que quiere venderle al Estado, una veeduría ciudadana que quiere fiscalizar, un contratista que busca oportunidades— pero el portal oficial es lento, no permite guardar procesos de interés, no persiste búsquedas y su experiencia de filtrado es pobre. Cada consulta empieza de cero.

### Lo que construí

Un **portal web full-stack** que se sienta encima de la SODA API del SECOP y le da al ciudadano tres cosas que el portal oficial no ofrece:

1. **Búsqueda en vivo con filtros combinables** — palabra clave (full-text `$q`), entidad, departamento, estado de apertura, tipo de contrato, modalidad y rango de precio, todo traducido a cláusulas SoQL `$where` contra datos.gov.co en tiempo real.
2. **Bookmarks con snapshot inmutable** — al guardar una convocatoria no se guarda solo un ID: se persiste un *snapshot desnormalizado completo* del estado del proceso en el momento de guardarlo. Si el SECOP cambia o retira el proceso después, el usuario conserva la foto original. Esto convierte al portal en un registro histórico personal, no en un simple marcador.
3. **Búsquedas guardadas reutilizables** — el usuario nombra y persiste combinaciones de filtros frecuentes (`{q, entidad, departamento, estado_apertura, tipo_contrato, modalidad, fecha_desde, fecha_hasta, precio_min, precio_max}`) para reejecutarlas con un clic.

### El flujo central (demo E2E)

```
Registro (auto-login con JWT)
   → Browse de convocatorias en vivo desde datos.gov.co
   → Filtrar por palabra clave / entidad / departamento
   → Guardar convocatoria como bookmark (snapshot SECOP)
   → Ver "Guardados" → eliminar (soft-delete) → lista vacía
   → Perfil: actualizar nombre
```

Todo el flujo está grabado como video de demostración en [`demo/screenshots/demo-portal-secop.webm`](demo/screenshots/demo-portal-secop.webm), producido con Playwright (cursor animado, subtítulos por paso, pacing natural) sobre el stack real corriendo en Docker con datos vivos del SECOP.

---

## 2. Stack y arquitectura

### Vista de alto nivel

```
┌─────────────────────────────────────────────────────────┐
│  Angular 20 (standalone components)      :4200           │
│  Login · Register · Convocatorias · Detalle · Bookmarks  │
│  · Perfil · AuthGuard · jwtInterceptor · proxy.conf.json │
└───────────────────────┬─────────────────────────────────┘
                        │  /api/v1/*  ·  Authorization: Bearer <JWT>
                        ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI · Python 3.12 · async SQLAlchemy 2.0   :8000    │
│  api/v1 → services → repositories → models               │
│  core: config · database · security (JWT + bcrypt)       │
└──────────┬──────────────────────────────┬────────────────┘
           │                              │
           ▼                              ▼
┌────────────────────┐         ┌──────────────────────────┐
│  PostgreSQL 16     │         │  datos.gov.co · SODA API  │
│  users             │         │  p6dx-8zbt.json           │
│  bookmarks         │         │  (SecopService, httpx)    │
│  saved_searches    │         │  $q · $where · $limit     │
└────────────────────┘         └──────────────────────────┘
```

Todo levanta con un solo comando: `docker compose up --build`. El `db` tiene healthcheck; `backend` hace `depends_on` con condición de salud; `frontend` sirve Angular en modo dev con hot-reload y un proxy que reenvía `/api` al backend dentro de la red de Docker.

### Arquitectura del backend — capas estrictas

La regla de dependencia es unidireccional: **una capa solo conoce a la de abajo**. Esto mantiene el SQL confinado a un solo lugar y hace testeable cada nivel por separado.

| Capa | Archivo(s) | Responsabilidad | Regla |
|------|-----------|-----------------|-------|
| **Routers** | `api/v1/{auth,profile,convocatorias,bookmarks,searches}.py` | Contrato HTTP, validación Pydantic, códigos de estado, envelope `{data, meta, error}` | No contiene lógica de negocio |
| **Services** | `services/{auth,bookmark,saved_search,secop}_service.py` | Reglas de negocio, ownership checks, orquestación SECOP↔DB, traducción de errores a HTTP | No escribe SQL directo |
| **Repositories** | `repositories/{user,bookmark,saved_search}_repository.py` | Queries SQLAlchemy async — **única capa que toca SQL** | No conoce HTTP |
| **Models** | `models/{user,bookmark,saved_search}.py` | ORM mapeado 1:1 al schema PostgreSQL, tipos `DateTime(timezone=True)` | Solo estructura |
| **Core** | `core/{config,database,security}.py` | Settings (pydantic-settings), engine async + `get_db`, JWT HS256 + bcrypt, `get_current_user` | Transversal |

`SecopService` es el **único punto de salida** hacia datos.gov.co. Ningún otro módulo llama a `httpx` contra el SECOP; toda la integración externa está encapsulada, lo que permite mockearla en tests y cambiar la fuente sin tocar la lógica de negocio.

### El esquema de datos — decisiones concretas

Tres tablas (`migrations/001_initial_schema.sql`), todas con `created_at`/`updated_at` en `TIMESTAMPTZ` y soft-delete vía `deleted_at TIMESTAMPTZ NULL`:

- **`users`** — identidad. `email` con `UNIQUE` y `CHECK (email LIKE '%@%')`, `password_hash` con `CHECK (length > 0)`. Nunca almacena la contraseña en claro; solo el hash bcrypt.
- **`bookmarks`** — 15 columnas desnormalizadas del proceso SECOP **más** `secop_snapshot JSONB NOT NULL` con el JSON crudo completo de la respuesta SODA. Cada columna tiene `COMMENT ON COLUMN` que documenta su campo SODA original (ej. `departamento` ← `departamento_entidad`, `url_secop` ← el campo anidado `urlproceso.url`).
- **`saved_searches`** — `query_params JSONB` con los filtros nombrados.

Índices que reflejan el patrón de uso real:

```sql
-- Un usuario NO puede tener dos bookmarks ACTIVOS del mismo proceso.
-- El soft-delete queda fuera del índice → permite re-guardar tras eliminar.
CREATE UNIQUE INDEX uidx_bookmarks_user_process_active
    ON bookmarks (user_id, secop_process_id) WHERE deleted_at IS NULL;

-- Índices parciales: solo indexan filas vivas.
CREATE INDEX idx_bookmarks_estado_apertura ON bookmarks (estado_apertura) WHERE deleted_at IS NULL;

-- GIN sobre el snapshot completo → habilita queries JSONB ad-hoc a futuro.
CREATE INDEX idx_bookmarks_snapshot_gin ON bookmarks USING gin (secop_snapshot);
```

### La superficie REST

Contrato versionado en `/api/v1`, respuestas con envelope `{data, meta, error}`, auth por `Authorization: Bearer <JWT>`:

| Recurso | Endpoints |
|---------|-----------|
| **Auth** | `POST /auth/register` (hash bcrypt, 409 si duplicado, devuelve token) · `POST /auth/login` (verifica hash, 401 si inválido) |
| **Perfil** | `GET /profile` · `PUT /profile` (protegidos con `get_current_user`) |
| **Convocatorias** | `GET /convocatorias` (filtros → SoQL) · `GET /convocatorias/{id}` (502 si SODA cae, 404 si no existe) |
| **Bookmarks** | `GET /bookmarks` (paginado + filtros) · `POST /bookmarks` (snapshot SECOP transaccional) · `DELETE /bookmarks/{id}` (soft-delete + ownership) |
| **Búsquedas** | `GET /searches` · `POST /searches` · `PUT /searches/{id}` · `DELETE /searches/{id}` (CRUD con ownership check) |
| **Infra** | `GET /health` → 200 |

### El frontend

Angular 20 con **standalone components** (sin NgModules), rutas lazy-loaded, `AuthGuard` (`canActivate` redirige a `/login` sin token) y un `jwtInterceptor` funcional (`HttpInterceptorFn`) que inyecta el Bearer solo en llamadas `/api/` y hace logout ante 401 (excepto en endpoints de auth, para no crear loops de redirección). El registro hace auto-login: el token retornado se guarda y redirige directo a `/convocatorias`. UI con design system propio (Plus Jakarta Sans, paleta navy `#0F172A` / CTA blue `#0369A1`, contraste WCAG AAA) y estados obligatorios por pantalla: loading, error y empty.

---

## 3. Cómo usé Hermes y los LLMs

Este es el corazón del reto: **cero código manual**. Mi trabajo fue especificar, dirigir, revisar e iterar; los LLMs escribieron cada línea. Hermes actuó como la **capa de orquestación obligatoria** entre modelos, y la disciplina spec-first fue el multiplicador de calidad.

### 3.1 Metodología spec-first — la spec como interfaz

Antes de generar una sola línea de código escribí **5 specs en Markdown** siguiendo `spec/TEMPLATE.md`, todas con profundidad *Spec-B* (~480 palabras cada una) y gate de precisión ≥ 0.85:

| Spec | Qué define | Nivel de detalle que marcó la diferencia |
|------|-----------|------------------------------------------|
| `spec-01-database-schema.md` | Tablas, constraints inline, índices, `COMMENT ON` | Tipos exactos (`NUMERIC(18,2)`, no `FLOAT`), partial unique index, mapeo columna→campo SODA |
| `spec-02-architecture.md` | Capas, estructura de directorios, regla de dependencia | Qué capa puede importar a cuál — evitó SQL disperso |
| `spec-03-api-rest.md` | Endpoints, JWT, envelope `{data, meta, error}` | Código de estado por caso de error (409/401/404/502) |
| `spec-04-integracion-secop.md` | Tabla de mapeo SODA→Pydantic, escape SoQL, manejo de errores | Nombres crudos de campos SODA (`descripci_n_del_procedimiento`) uno por uno |
| `spec-05-frontend-ux-testing.md` | 6 pantallas, flujo E2E, estados UI, testing | Estados loading/error/empty como requisito, no opcional |

La lección medible del programa —"mejorar la spec es 3× más efectivo que cambiar el modelo"— se cumplió literalmente: cuando el output bajaba de 80 pts, **la solución nunca fue escalar a un modelo más caro, sino agregar detalle a la spec**. La spec es la interfaz entre mi intención y el código; su ambigüedad es el techo de la calidad.

### 3.2 Hermes como orquestador

Hermes coordinó el ciclo entre modelos según la regla de escalada del proyecto:

- **Modelo base: `claude-sonnet-4-6`** — punto de equilibrio costo/calidad para generar código a partir de specs de profundidad B. Hizo la gran mayoría del trabajo: schema SQL, endpoints, servicios, componentes Angular, tests.
- **Escalada a Opus** solo cuando el output de Sonnet + spec mejorada seguía por debajo del umbral, o para tareas de criterio arquitectónico (como refinar este mismo SOUL.md y consolidar la revisión de código).
- **Hermes como capa entre modelos** — no llamé a cada LLM aislado; los enruté a través de Hermes para mantener contexto compartido y decidir cuándo un output requería otro modelo o una spec más profunda.

### 3.3 Skills que usé y para qué

| Skill | Dónde lo apliqué |
|-------|------------------|
| `:database-reviewer` | Validar el schema PostgreSQL: constraints, índices parciales, elección `TIMESTAMPTZ` vs `TIMESTAMP` |
| `:backend-patterns` | Diseño de las capas service/repository y el contrato REST |
| `:security-review` | Revisión del flujo JWT, hashing bcrypt, escape de SoQL injection, ownership checks |
| `:tdd-workflow` | Estrategia de tests con `pytest` + `httpx.AsyncClient` en modo ASGI |
| `/code-review` (multi-agente) | Revisión de alto esfuerzo de todo el árbol al cierre — encontró 10 bugs reales (ver §5) |
| `/ui-ux-pro-max` | Rediseño del frontend con design system coherente y accesible |
| `/ui-demo` | Grabación del video de demostración E2E con Playwright (discover → rehearse → record) |

### 3.4 Los patrones de prompt que mejor funcionaron

**1. Especificidad quirúrgica > instrucción vaga.** El contraste más claro:

> ❌ *"Genera la integración SECOP"* → produce un placeholder genérico.
>
> ✅ *"Genera `SecopService` con la tabla de mapeo completa de spec-04, escape de comillas simples en las cláusulas `$where`, timeout de 10s en `httpx.AsyncClient`, y un `SecopServiceError` que traduzca timeout/error de red/5xx a HTTP 502; devuelve `None` en el 404 lógico de SODA"* → produce código listo para producción a la primera.

**2. Validación cruzada de specs *antes* de generar código.** Pedirle al LLM que buscara inconsistencias entre las 5 specs detectó **8 bugs de documentación** (nombres de tabla incorrectos, referencias rotas, una extensión `pgcrypto` innecesaria) que habrían causado errores en runtime. Corregir la spec es órdenes de magnitud más barato que depurar el código generado.

**3. `PLAN.md` con gates por fase.** Descompuse la generación en **8 fases progresivas** (infra → schema → cimientos FastAPI → auth → SECOP → bookmarks/searches → tests → frontend/E2E), cada una con un criterio de verificación explícito antes de avanzar. Esto evitó que un error temprano en el schema se propagara a 40 archivos aguas abajo.

**4. Hacer que el modelo declare sus supuestos.** Antes de escribir un archivo nuevo, forzar la enumeración de sus importadores, la API afectada y el esquema de datos que toca. Convierte supuestos implícitos en decisiones revisables.

---

## 4. Decisiones y trade-offs

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| `BIGSERIAL` como PK | UUID | Menor overhead en dev; sin ventaja real para este volumen y sin exposición pública de IDs secuenciales que justifique UUID |
| Soft-delete (`deleted_at`) | Hard delete | Permite re-guardar el mismo proceso tras eliminarlo; conserva historial; el partial unique index solo aplica a filas vivas |
| Snapshot `JSONB` completo | Solo columnas mapeadas | El proceso SECOP puede cambiar/retirarse; el snapshot es una foto inmutable. El índice GIN habilita queries ad-hoc futuras sobre el JSON crudo |
| `404` (no `403`) en ownership violation | `403 FORBIDDEN` | No revelar la existencia de recursos ajenos — un `403` confirmaría que el ID existe |
| Sin retry en `SecopService` | Retry con backoff | Un `502` limpio es un contrato claro para el frontend; el retry añade complejidad y latencia sin garantía |
| SQLite en tests / PostgreSQL en runtime | PostgreSQL también en CI | Velocidad de los tests; los constraints críticos se validan contra el SQL de migración real de PostgreSQL |
| `DateTime(timezone=True)` en ORM | `DateTime` naive | Alinea el ORM con `TIMESTAMPTZ` del schema; evita el error "can't subtract offset-naive and offset-aware datetimes" en el soft-delete |
| `CHECK` sobre `TEXT` para estados | `ENUM` de Postgres | Un `CHECK` es mucho más fácil de migrar; agregar un estado no requiere `ALTER TYPE` |
| `bcrypt==3.2.2` pineado | bcrypt 4.x (última) | bcrypt 4.x rompe el `detect_wrap_bug` de passlib al forzar el límite estricto de 72 bytes (ver §5) |
| Angular standalone + proxy dev | NgModules + CORS directo | El proxy `/api → backend:8000` mantiene el frontend agnóstico del puerto del backend y evita configurar CORS para dev |

---

## 5. Bloqueos y cómo los resolví

Autonomía significa desbloquear por cuenta propia. Estos fueron los obstáculos reales y cómo los resolví investigando la causa raíz, no aplicando parches a ciegas.

### 5.1 Incompatibilidad passlib ↔ bcrypt 4.x (registro → 500)

**Síntoma:** `POST /auth/register` devolvía 500 con `ValueError: password cannot be longer than 72 bytes` desde dentro de `detect_wrap_bug` de passlib.
**Causa raíz:** bcrypt 4.x introdujo una validación estricta del límite de 72 bytes que rompe el mecanismo interno con el que passlib 1.7.4 detecta el bug de wraparound de versiones antiguas.
**Solución:** pinear `bcrypt==3.2.2` en `requirements.txt` junto a `passlib[bcrypt]==1.7.4`. No fue silenciar el error, sino identificar el cambio de contrato en la dependencia.

### 5.2 Angular 20 y el dev-server basado en Vite (frontend 404 en `/api`)

**Síntoma:** `ng serve --host 0.0.0.0 --port 4200 --poll 500` fallaba con `Unknown arguments: host, port, poll`, y el frontend llamaba a `localhost:4200/api/...` obteniendo 404.
**Causa raíz:** Angular 20 usa `@angular-devkit/build-angular:dev-server` (Vite); los flags CLI de versiones previas ya no son válidos y deben configurarse en `angular.json`.
**Solución:** (a) agregar un target `serve` en `angular.json` con `host`, `port` y `proxyConfig`; (b) crear `proxy.conf.json` que reenvía `/api → http://backend:8000` dentro de la red Docker; (c) simplificar el comando a `npx ng serve`. El frontend quedó agnóstico del puerto del backend.

### 5.3 Referencia rota en spec-04 (detectada en validación cruzada)

**Síntoma:** spec-04 citaba "502 `SECOP_ERROR` definido en spec-03", pero esa sección nunca existió en el archivo real.
**Solución:** lo detecté al pedir validación cruzada de specs *antes* de generar código. Agregué la definición formal del error en spec-03. Un bug de documentación cazado en minutos que habría sido un bug de runtime.

### 5.4 Campo anidado `urlproceso.url` de la SODA API

**Síntoma:** `url_secop` salía siempre `None`.
**Causa raíz:** la SODA API devuelve la URL como objeto anidado `{"urlproceso": {"url": "..."}}`, no como campo plano. El mapeo naive no lo alcanzaba.
**Solución:** lógica explícita en `map_secop_response` que maneja tanto el caso dict anidado como string plano.

### 5.5 Datetime naive vs. aware en el soft-delete

**Síntoma:** `DELETE /bookmarks/{id}` fallaba con `can't subtract offset-naive and offset-aware datetimes` desde asyncpg.
**Causa raíz:** los modelos ORM usaban `DateTime` naive mientras el schema declaraba `TIMESTAMPTZ`. Un parche temporal usó `datetime.utcnow()`, pero la solución correcta era alinear el ORM.
**Solución definitiva:** `DateTime(timezone=True)` en las tres tablas y `datetime.now(UTC)` en el repositorio.

### 5.6 Hardening: 10 bugs encontrados por `/code-review` multi-agente

Al cierre corrí una revisión de código de alto esfuerzo (múltiples agentes en paralelo) que encontró **10 bugs reales**. Los prioricé por severidad y corregí los siguientes:

1. **SECRET_KEY por defecto** → `RuntimeError` al arranque si no se configuró (falla ruidosa, no silenciosa).
2. **`SecopService` solo capturaba `TimeoutException`** → cambiado a `httpx.RequestError` en los tres métodos, cubriendo fallos de DNS y conexión rechazada.
3. **Filtro de precio con check falsy** → `if precio_min is not None` en vez de `if precio_min`, para no ignorar `precio_min=0`.
4. **Envelope de respuesta de `/register` mal formado** → eliminado el spread `**result` que duplicaba claves.
5. **JWT interceptor** → el Bearer solo se envía a URLs `/api/`, y no se hace logout ante 401 de endpoints de auth (evita loops).
6–8. **Modelos ORM** → `DateTime(timezone=True)` en `users`, `bookmarks` y `saved_searches`.
9. **`soft_delete`** → recibe el objeto `Bookmark` ya cargado en vez de re-consultar por ID (elimina un doble fetch y el riesgo TOCTOU).
10. **Snapshot `None`** → `POST /bookmarks` ahora lanza 502 si el snapshot SODA viene vacío, en vez de guardar silenciosamente `{}` violando el `NOT NULL`.

---

## 6. Qué mejoraría o pediría

1. **Paginación real con totales.** `$limit`/`$offset` de SODA no devuelve un `total` real. Añadiría una consulta `$select=count(*)` para poblar el `meta.total` y dar al frontend paginación honesta en vez de "siguiente si hay más".
2. **Cache con TTL corto (Redis).** Un cache de 5 min sobre las consultas SECOP reduciría latencia y evitaría el rate limiting de datos.gov.co durante demos y picos.
3. **Tests E2E automatizados.** El flujo E2E se validó manualmente y se grabó con Playwright para la demo; el siguiente paso es convertir ese mismo script en una suite E2E que corra en CI (los selectores ya están descubiertos y ensayados).
4. **SOUL.md incremental.** Escribirlo *mientras* avanzaba habría capturado decisiones con más fidelidad. Retroactivamente algunos trade-offs se reconstruyen, no se recuerdan — el registro en caliente es más veraz que el post-mortem.
5. **Observabilidad.** Structured logging y un `/health` que verifique conectividad real a PostgreSQL y a SODA, no solo un 200 estático.
6. **Refresh tokens.** Hoy el JWT es de vida corta sin refresh; añadiría rotación para sesiones largas sin reautenticación.

---

## 7. Enlace al repositorio

**https://github.com/pena1rafael-jikk/dev-reto-ai-first**

> Portal de Convocatorias Públicas — construido bajo el reto Jikkosoft AI-First con la regla de **cero código manual**: cada línea fue generada por LLMs orquestados vía Hermes, dirigidos por specs de profundidad B, revisados e iterados por mí. La spec es el producto; el código es su compilación.
