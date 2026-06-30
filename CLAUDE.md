# CLAUDE.md — Contrato AI Operativo

**Proyecto:** Portal de Convocatorias Públicas
**Programa:** Jikkosoft AI-First · Fase 1 · Track DEV
**Repositorio:** [github.com/pena1rafael-jikk/dev-reto-ai-first](https://github.com/pena1rafael-jikk/dev-reto-ai-first)
**Deadline entrega:** 6 jul 2026 (repo + SOUL.md antes de medianoche)
**Demo:** 7 jul 2026 · 5–7 min

---

## Reglas fundamentales del reto

1. **Cero código manual** — solo especificar, dirigir, revisar e iterar.
2. Hermes es el orquestador principal; cualquier LLM puede codificar (Sonnet, Haiku, Codex, DeepSeek, etc.).
3. El dominio es fijo: Portal de Convocatorias. La diferencia la hace la profundidad de la spec.
4. Repositorio debe ser público (GitHub o GitLab).

---

## Filosofía spec-first

Mejorar la spec es **3× más efectivo** que cambiar el modelo.

| Cambio | Ganancia promedio |
| --- | --- |
| Spec A → Spec B (~480 palabras) | +26 pts calidad |
| Haiku → Opus (misma spec) | +12 a +24 pts |

**Regla práctica:** score < 80 → la spec necesita más detalle, no un modelo más caro.

Todas las specs de base de datos siguen la estructura en [`spec/TEMPLATE.md`](spec/TEMPLATE.md). Target: **Spec-B depth**, gate de precisión ≥ 0.85.

**Specs activas:**

- [`spec-01-database-schema.md`](spec/spec-01-database-schema.md) — tablas `users`, `bookmarks`, `saved_searches`
- [`spec-02-architecture.md`](spec/spec-02-architecture.md) — capas DB / backend / frontend / integración SECOP
- [`spec-03-api-rest.md`](spec/spec-03-api-rest.md) — 15 endpoints REST, contrato JWT, formato de respuesta
- [`spec-04-integracion-secop.md`](spec/spec-04-integracion-secop.md) — `secop_service.py`, mapeo de campos SODA, manejo de errores
- [`spec-05-frontend-ux-testing.md`](spec/spec-05-frontend-ux-testing.md) — pantallas, flujos E2E, estrategia de testing

---

## Stack obligatorio

| Componente | Tecnologia | Requisito |
| --- | --- | --- |
| Autenticacion | JWT (python-jose + passlib) | Registro e inicio de sesion — tokens Bearer |
| Backend | FastAPI (Python 3.12) | REST API `/api/v1/...` — busqueda, filtros, bookmarks |
| Frontend | Angular 20 (standalone) | Browse convocatorias, favoritos y perfil de usuario |
| Base de datos | PostgreSQL 16 | Tablas: `users`, `bookmarks`, `saved_searches` |
| Integracion | datos.gov.co SODA API | Consulta en vivo de convocatorias SECOP |
| Infraestructura | Docker + Docker Compose | Un solo `docker compose up` levanta todo el stack |

---

## Integración SECOP — datos.gov.co

- Protocolo: **Socrata Open Data API (SODA)**
- Endpoint base (SECOP I): `https://www.datos.gov.co/resource/p6dx-8zbt.json`
- No requiere API key para consultas básicas
- Parámetros útiles: `$where`, `$limit`, `$offset`, `$q` (full-text search)

---

## Safe / Unsafe zones

**SAFE — Claude puede generar libremente:**

- Specs (`.md` en `spec/`)
- SQL migrations y schemas
- API endpoints y controladores
- Componentes frontend
- Tests unitarios y de integración
- Seeds y fixtures de desarrollo

**UNSAFE — requiere revisión humana antes de ejecutar:**

- Cambios en schema ya aplicado en producción
- Variables de entorno y credenciales (nunca en código, solo en `.env`)
- `git push` a rama `main`
- Llamadas reales a SECOP en ambiente de producción
- DROP / DELETE sin transacción y respaldo

---

## Modelo y orquestación

- **Modelo principal:** `claude-sonnet-4-6` — punto de equilibrio costo/calidad con Spec-B
- **Escalada a Opus:** solo si el output con Sonnet + spec mejorada sigue por debajo de 80 pts
- **Hermes como capa obligatoria** de orquestación entre modelos

### Skills disponibles

| Skill | Uso |
| --- | --- |
| `:tdd-workflow` | Desarrollo guiado por pruebas |
| `:backend-patterns` | APIs y servicios REST |
| `:security-review` | Revision de seguridad (JWT, SECOP) |
| `:database-reviewer` | Schema y queries PostgreSQL/SQLite |

---

## Convenciones

### Base de datos

- Nombres en `snake_case`, tablas en **plural** (`users`, `bookmarks`, `searches`)
- PK: `id` (serial o uuid — definir en spec)
- FK: `{table_singular}_id` (ej: `user_id`)
- Timestamps obligatorios: `created_at`, `updated_at` en todas las tablas
- Soft delete: columna `deleted_at TIMESTAMPTZ NULL` (NULL = activo)
- Dinero / precios SECOP: `NUMERIC(18,2)`, nunca `FLOAT`
- Estados: `CHECK` constraints sobre `TEXT`, no `ENUM` (más fácil de migrar)

### API

- REST con versionado en path: `/api/v1/...`
- Respuestas JSON con estructura `{ data, meta, error }`
- Auth header: `Authorization: Bearer <token>`

### Git

- Commits semánticos: `feat:`, `fix:`, `spec:`, `docs:`, `test:`
- No hacer push directo a `main` sin revisión

---

## Entregables obligatorios

- [ ] Repositorio público con README funcional — [github.com/pena1rafael-jikk/dev-reto-ai-first](https://github.com/pena1rafael-jikk/dev-reto-ai-first)
- [ ] `SOUL.md` en raíz — **vale 25% de la evaluación** (tan importante como el código)
- [ ] Specs en `spec/` siguiendo `spec/TEMPLATE.md`
- [ ] Demo funcional end-to-end: auth → browse SECOP → guardar bookmark
- [ ] Punto de control diario: 3 líneas de avance + bloqueos vía Hermes/Drive (días hábiles)

### SOUL.md debe incluir

1. Qué construiste y qué problema resuelve
2. Stack y arquitectura: componentes y cómo se conectan
3. Cómo usaste Hermes y los LLMs: skills, specs y prompts que mejor funcionaron
4. Decisiones y trade-offs
5. Bloqueos y cómo los resolviste
6. Qué mejorarías o pedirías
7. Enlace al repositorio

---

## Criterios de evaluación

| Dimension | Peso |
| --- | --- |
| Calidad del SOUL.md y trazabilidad del proceso | 25% |
| Autonomia: investigo y desbloqueo por cuenta propia | 25% |
| Orquestacion de IA: claridad de specs, iteracion, manejo de contexto | 18% |
| Funcionalidad E2E | 14% |
| Prevision y comunicacion a tiempo | 10% |
| Criterio tecnico | 8% |

---

## Comandos

```bash
# Levantar todo el stack (DB + backend + frontend)
docker compose up --build

# Solo backend en dev (con hot-reload)
docker compose up db backend

# Solo frontend en dev
docker compose up frontend

# Ejecutar migraciones
docker compose exec backend alembic upgrade head

# Tests backend
docker compose exec backend pytest

# Tests frontend
docker compose exec frontend ng test --watch=false

# Lint backend
docker compose exec backend ruff check .

# Lint frontend
docker compose exec frontend ng lint
```

---

*Contacto del programa: Diego Trujillo · [diego.trujillo@jikkosoft.com](mailto:diego.trujillo@jikkosoft.com)*
