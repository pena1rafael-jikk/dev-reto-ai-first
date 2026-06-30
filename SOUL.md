# SOUL.md — Portal de Convocatorias Públicas

**Autor:** Rafael Peña · joserafaelpenamena@gmail.com
**Repositorio:** https://github.com/pena1rafael-jikk/dev-reto-ai-first
**Programa:** Jikkosoft AI-First · Fase 1 · Track DEV

---

## 1. Qué construí y qué problema resuelve

Construí un portal web donde ciudadanos colombianos pueden explorar, filtrar y guardar convocatorias públicas del SECOP sin navegar por el portal oficial, que es lento y sin filtros avanzados.

**Flujo central:** el usuario se registra → busca convocatorias en vivo desde datos.gov.co con filtros por entidad, departamento, estado y rango de precio → guarda las que le interesan como bookmarks (con snapshot del estado al momento de guardar) → persiste búsquedas frecuentes para reutilizarlas.

---

## 2. Stack y arquitectura

```
Angular 20 (puerto 4200)
    ↓ /api/v1/* con Bearer JWT
FastAPI Python 3.12 (puerto 8000)
    ├── PostgreSQL 16 → users, bookmarks, saved_searches
    └── datos.gov.co SODA API → convocatorias en vivo
```

**Capas del backend:**

| Capa | Responsabilidad |
|------|----------------|
| `api/v1/` routers | Contrato HTTP, validación, HTTP errors |
| `services/` | Lógica de negocio, ownership checks |
| `repositories/` | Queries SQLAlchemy — única capa con SQL |
| `models/` | ORM mapeados al schema PostgreSQL |
| `core/` | Config, JWT/bcrypt, sesión DB |

`SecopService` es el único punto de salida hacia datos.gov.co. Todo el stack levanta con `docker compose up --build`.

---

## 3. Cómo usé Hermes y los LLMs

### Metodología spec-first

Antes de generar código escribí 5 specs en Markdown:

| Spec | Qué define |
|------|-----------|
| `spec-01-database-schema.md` | Tablas, constraints, índices, COMMENT ON |
| `spec-02-architecture.md` | Capas, estructura de directorios, reglas de dependencia |
| `spec-03-api-rest.md` | 15 endpoints, JWT, formato `{data, meta, error}` |
| `spec-04-integracion-secop.md` | Tabla de mapeo SODA→Pydantic, escape SoQL injection |
| `spec-05-frontend-ux-testing.md` | 6 pantallas, flujo E2E, estrategia de tests |

### Lo que mejor funcionó

**1. Spec-B depth (~480 palabras por spec):** El nivel de detalle fue el mayor multiplicador de calidad. Con tabla de mapeo explícita de campos SODA, constraints exactos y ejemplos de errores, el modelo generó código correcto en la primera iteración.

**2. Cross-spec validation:** Pedir al LLM validar inconsistencias entre specs *antes* de generar código detectó 8 bugs de documentación (nombres de tabla incorrectos, referencias rotas, extensión pgcrypto innecesaria) que habrían causado errores en runtime.

**3. PLAN.md con gates por fase:** Separar la generación en 8 fases con criterio de verificación antes de avanzar evitó que errores tempranos se propagaran.

**4. Prompts específicos > prompts vagos:** "Genera SecopService con tabla de mapeo completa, escape de comillas simples en `$where`, y SecopServiceError que traduzca timeout/5xx a 502" produjo código listo. "Genera la integración SECOP" habría producido un placeholder genérico.

---

## 4. Decisiones y trade-offs

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| BIGSERIAL como PK | UUID | Menor overhead en dev, sin ventaja real para este volumen |
| Soft-delete con `deleted_at` | Hard delete | Permite re-bookmark del mismo proceso |
| `404` (no `403`) en ownership violation | `403 FORBIDDEN` | No revelar existencia de recursos ajenos |
| Sin retry en SecopService | Retry con backoff | Simplifica el contrato; un 502 es claro para el frontend |
| SQLite en tests | PostgreSQL en CI | Velocidad; los constraints críticos están en el SQL de migración |
| Snapshot JSONB completo | Solo campos mapeados | Permite queries ad-hoc futuros con GIN index |

---

## 5. Bloqueos y cómo los resolví

**Referencia rota en spec-04:** spec-04 citaba "502 SECOP_ERROR definido en spec-03" pero esa sección nunca existió en el archivo real. Lo detecté en la validación cruzada. Solución: agregar la definición formal en spec-03.

**Campo anidado `urlproceso.url`:** La SODA API devuelve la URL como objeto `{"urlproceso": {"url": "..."}}`, no como campo plano. El mapeo naive dejaba `url_secop` siempre en `None`. Solución: lógica explícita en `map_secop_response` que maneja tanto dict como string.

**Compatibilidad SQLite/PostgreSQL en tests:** SQLite no soporta `TIMESTAMPTZ` ni `JSONB`. Solución: tipos SQLAlchemy en modelos ORM (que SQLite renderiza como TEXT) y validar constraints críticos contra el SQL de migración de PostgreSQL.

---

## 6. Qué mejoraría o pediría

1. **Paginación real:** `$limit/$offset` no devuelve `total` real desde SODA. Añadiría un endpoint `$select=count(*)` para totales correctos en el frontend.
2. **Cache con TTL corto:** Redis con 5 min de TTL reduciría latencia y evitaría rate limiting en demos.
3. **SOUL.md incremental:** Escribirlo mientras avanzaba habría capturado decisiones con más fidelidad. Retroactivamente algunos trade-offs se reconstruyen, no se recuerdan.
4. **Tests E2E automatizados:** El flujo E2E quedó como validación manual. Con más tiempo lo automatizaría con Playwright.

---

## 7. Enlace al repositorio

**https://github.com/pena1rafael-jikk/dev-reto-ai-first**
