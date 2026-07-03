# Resumen AI First - Rafael Peña - 2026-07-03

> **Nota sobre el autor:** la plantilla recibida traía el título con "Emmanuel Ortega", pero
> el nombre de archivo (`RAFAEL_PENA`), el repositorio (`pena1rafael-jikk`) y el autor en
> `git`/`SOUL.md` corresponden a **Rafael Peña**. Se usa ese nombre. Corregir si aplica.
>
> Documento basado en evidencia verificable del repositorio a 2026-07-03. No se adorna:
> lo no comprobable se marca como **pendiente** o **no verificado**.

---

## 1. Resumen ejecutivo

Se construyó el **Portal de Convocatorias Públicas**, una aplicación web full-stack que permite explorar, filtrar y guardar convocatorias públicas del SECOP consumiendo datos en vivo desde `datos.gov.co` (Socrata Open Data API).

- **Qué resuelve:** el portal oficial del SECOP es lento, no permite guardar procesos ni persistir búsquedas. Esta aplicación ofrece búsqueda con filtros combinables, guardado de convocatorias con snapshot inmutable y búsquedas reutilizables.
- **Estado actual:** producto **funcional y demostrado end-to-end**. La **suite de tests fue ejecutada y pasa: 24 passed** (ver §4), tras corregir la infraestructura de tests que estaba rota. Las correcciones ya están **commiteadas y pusheadas** a GitHub (commit `8aa891f`).
- **Regla del reto cumplida:** cero código manual — todo el código fue generado por LLMs bajo dirección spec-first.
- **Debilidades honestas:** (1) los tests **no corrían** hasta hoy: los modelos usaban tipos exclusivos de PostgreSQL (`JSONB`, PK `BigInteger`) incompatibles con el SQLite de los tests, y un mock de test era inconsistente — todo eso se corrigió en esta sesión y ya está en GitHub; (2) la **trazabilidad de git es baja** (4 commits, con poca granularidad); (3) **no hay despliegue en la nube** — el despliegue es local vía Docker Compose.

---

## 2. Contexto del reto

- **Programa:** Jikkosoft AI-First · Fase 1 · Track DEV.
- **Objetivo del reto:** demostrar capacidad de construir software dirigiendo agentes de IA (no escribiendo código a mano). El diferencial se mide por la **profundidad de las especificaciones**, la orquestación de modelos y la autonomía para desbloquear.
- **Dominio fijo:** Portal de Convocatorias Públicas. La diferenciación proviene de la calidad de la spec, no del dominio.
- **Propósito del portal:** acercar la información de contratación pública colombiana (SECOP) a ciudadanos, PYMES y veedurías, con una experiencia de búsqueda y guardado que el portal oficial no ofrece.

---

## 3. Avances realizados desde la semana pasada hasta hoy

### Producto / funcionalidad
- Flujo E2E completo: registro → búsqueda en vivo → guardar bookmark (con snapshot SECOP) → ver/eliminar guardados → editar perfil.
- Búsquedas guardadas reutilizables (parámetros de filtro persistidos por nombre).

### Frontend / UI
- Angular 20 standalone: 6 pantallas (login, register, convocatorias, detalle, bookmarks, perfil).
- Rediseño de UI con design system propio (tipografía Plus Jakarta Sans, paleta navy/CTA, contraste WCAG) y estados obligatorios loading / error / empty.
- `proxy.conf.json` para enrutar `/api` al backend dentro de la red Docker.

### Backend / datos
- FastAPI (Python 3.12) con capas estrictas: `api/v1` → `services` → `repositories` → `models`.
- `SecopService` como único punto de integración con `datos.gov.co` (escape SoQL, timeout 10s, errores → 502).
- PostgreSQL 16: 3 tablas (`users`, `bookmarks`, `saved_searches`), soft-delete, partial unique index, índice GIN sobre snapshot JSONB.

### Autenticación
- JWT HS256 (python-jose) + hashing bcrypt (passlib); `get_current_user` como dependencia; auto-login tras registro; interceptor que inyecta el Bearer solo en `/api/`.

### Despliegue
- Orquestación local con Docker Compose (`docker compose up --build` levanta DB + backend + frontend).
- **No verificado / pendiente:** no existe despliegue en la nube ni URL pública (ver §4 y §8).

### Documentación
- `README.md` reescrito como manual de arranque multiplataforma (Windows/Mac/Linux) con troubleshooting.
- `SOUL.md` ampliado con las 7 secciones obligatorias.
- 5 especificaciones en `spec/` (spec-01 a spec-05) + `TEMPLATE.md` + `PLAN.md`.

### Demo / presentación
- Video de demostración E2E grabado con Playwright: `demo/screenshots/demo-portal-secop.webm` (~3.7 MB), con cursor animado y subtítulos por paso.

### Uso de agentes IA
- Metodología spec-first dirigida por specs de profundidad B.
- Revisión de código multi-agente que detectó 10 bugs; los prioritarios fueron corregidos y commiteados.

---

## 4. Evidencia técnica

**Repositorio (verificado):**
- Remote: `git@github.com:pena1rafael-jikk/dev-reto-ai-first.git`
- Rama `main` sincronizada con `origin/main` (sin commits pendientes de push).
- Árbol de trabajo limpio (solo este archivo de resumen figura como nuevo/untracked).

**Commits existentes (`git log`):**
```
a511bb8 · 2026-07-01 · feat(docs): mejorar la documentación del README.md
19ea91b · 2026-07-01 · feat(auth): streamline registration response handling
29d3a72 · 2026-06-30 · feat: Implement phased implementation plan for Public Call Portal
```
> Solo **3 commits**. La granularidad es baja (debilidad de trazabilidad), aunque el contenido —incluidas las correcciones del code review— sí está persistido en `HEAD` y en el remoto.

**Correcciones del code review verificadas en HEAD (`git grep`):**
- `backend/app/models/{user,bookmark,saved_search}.py` → `DateTime(timezone=True)` en las columnas de timestamp.
- `backend/app/repositories/bookmark_repository.py` → `async def soft_delete(self, bm: Bookmark)` (sin doble fetch).

**Métricas del árbol (conteo directo):**
| Área | Evidencia |
|------|-----------|
| Backend | 32 archivos `.py` en `backend/app/` |
| Tests backend | 7 archivos `.py` en `backend/tests/` |
| Frontend | 27 archivos `.ts` en `frontend/src/` |
| Specs | 7 archivos `.md` en `spec/` |
| Migración | `migrations/001_initial_schema.sql` |

**Resultado de tests (ejecutado y verificado hoy, 2026-07-03):**
```
pytest -q  →  24 passed in 5.25s
```
Los 24 tests cubren auth, perfil, convocatorias, bookmarks y búsquedas. **Importante y honesto:** la suite **no corría** antes de esta sesión — fallaba con 24 errores. Para que corriera hubo que corregir:
- `models/bookmark.py`, `models/saved_search.py`: `JSONB` → `JSONB().with_variant(JSON(), "sqlite")` (JSONB no compila en SQLite).
- `models/{user,bookmark,saved_search}.py`: PK `BigInteger` → `BigInteger().with_variant(Integer(), "sqlite")` (SQLite solo autoincrementa `INTEGER PRIMARY KEY`).
- `tests/test_bookmarks.py`: un mock inconsistente (el conv devuelto tenía distinto `secop_process_id` que el body) impedía detectar el duplicado. Producción era correcta; el test estaba mal.

Estas correcciones ya están **commiteadas y pusheadas** (commit `8aa891f feat(models): ajustar tipos de columnas para compatibilidad con SQLite`); `main` sincronizado con `origin/main`, árbol limpio.

**Comandos relevantes:**
```bash
docker compose up --build            # Levanta todo el stack
curl http://localhost:8000/health    # → {"status":"ok"} (verificado en sesión)
pytest -q                            # → 24 passed (ejecutado local con SQLite en memoria)
# http://localhost:4200  (frontend)  ·  http://localhost:8000/docs  (OpenAPI)
```

**URL de despliegue:** **no documentada / no existe** (despliegue local únicamente).

---

## 5. Decisiones técnicas

- **Tecnologías:** Angular 20 (standalone) + FastAPI (Python 3.12, async SQLAlchemy 2.0) + PostgreSQL 16 + Docker Compose. Stack impuesto por el reto y respetado.
- **Despliegue:** Docker Compose local con un solo comando; healthcheck en DB y `depends_on` por condición de salud. Se optó por **no** configurar despliegue cloud en este período (ver bloqueos).
- **Estructura del proyecto:** capas backend con regla de dependencia unidireccional (el SQL vive solo en `repositories`); frontend por features con `core` para auth/interceptor/guard.
- **Autenticación:** JWT HS256 + bcrypt. El backend **falla al arranque** si `SECRET_KEY` queda en el valor por defecto (decisión de seguridad ruidosa). El interceptor solo adjunta el token a rutas `/api/` y evita loops de logout en endpoints de auth.
- **Integración SECOP:** encapsulada en un único servicio; snapshot JSONB completo para conservar una foto inmutable del proceso; errores externos traducidos a HTTP 502.
- **Uso de agentes IA:** orquestación de LLMs bajo la disciplina spec-first, con validación cruzada de specs antes de generar código y una revisión de código multi-agente al cierre.
- **No aplica / no verificado:** no se integraron MCP, Hermes ni OpenCode como componentes del producto en este repositorio (no hay evidencia en el árbol).

---

## 6. Investigaciones y aprendizajes

- **Spec-first supera a "cambiar de modelo":** prompts quirúrgicos (con tabla de mapeo, códigos de error y contratos explícitos) producen código correcto a la primera; los prompts vagos producen placeholders.
- **Validación cruzada de specs** antes de codificar detectó inconsistencias de documentación que habrían sido bugs de runtime.
- **SODA API del SECOP:** la URL del proceso viene como campo anidado (`urlproceso.url`), no plano — hubo que investigarlo para no dejar `url_secop` en `None`.
- **Compatibilidad de dependencias:** por qué bcrypt 4.x rompe passlib (límite estricto de 72 bytes) y por qué Angular 20 (dev-server basado en Vite) rechaza flags CLI antiguos y requiere configurar `serve` + proxy en `angular.json`.
- **Grabación de demo con Playwright:** flujo discover → rehearse → record, con inyección de cursor y subtítulos; se ensayaron y verificaron los selectores antes de grabar.
- **Despliegue gratuito (investigado, no ejecutado):** queda como pendiente evaluar plataformas para publicar el stack.

---

## 7. Entregables generados

- **Aplicación:** portal full-stack funcional (backend + frontend + DB) orquestado con Docker Compose.
- **Repositorio:** público en GitHub, sincronizado — `github.com/pena1rafael-jikk/dev-reto-ai-first`.
- **Documentación:**
  - `README.md` — manual de arranque paso a paso multiplataforma.
  - `SOUL.md` — reflexión del proceso (25% de la evaluación).
  - `spec/` — 5 especificaciones + template + plan.
  - `CLAUDE.md` — contrato operativo del proyecto.
- **Demo:** video E2E `demo/screenshots/demo-portal-secop.webm` + scripts Playwright (`demo/discover.cjs`, `demo/rehearse.cjs`, `demo/demo-record.cjs`).
- **Base de datos:** `migrations/001_initial_schema.sql`.
- **Este resumen:** `AI_FIRST_RESUMEN_RAFAEL_PENA_2026-07-03.md`.

---

## 8. Bloqueos o dificultades

**Resueltos (verificados):**
- `POST /register` → 500 por incompatibilidad passlib/bcrypt 4.x → resuelto pineando `bcrypt==3.2.2`.
- `ng serve` fallaba con flags CLI antiguos (Angular 20 / Vite) → resuelto con target `serve` en `angular.json`.
- Frontend llamaba a `:4200/api` (404) → resuelto con `proxy.conf.json` hacia `backend:8000`.
- `DELETE /bookmarks` fallaba por datetime naive/aware → resuelto con `DateTime(timezone=True)`.
- **Suite de tests rota** (24 errores): modelos con tipos exclusivos de Postgres (`JSONB`, PK `BigInteger`) incompatibles con SQLite + un mock inconsistente → resuelto con `with_variant` cross-dialecto y corrección del test. Resultado: **24 passed**.

**Abiertos / pendientes:**
- **Despliegue:** no hay configuración cloud ni URL pública; solo despliegue local vía Docker.
- **Trazabilidad de git baja:** 3 commits para todo el proyecto; falta granularidad e historial.
- **Ajustes de UI:** el rediseño está aplicado, pero no hubo una pasada final de QA visual documentada.

---

## 9. Estado actual

**Listo y verificado:**
- ✅ Correcciones del code review presentes en `HEAD` (verificado con `git grep`).
- ✅ **Tests automatizados: 24 passed** (ejecutado hoy con SQLite en memoria).
- ✅ **Commit + push realizados** (commit `8aa891f`); `main` sincronizado con `origin/main`, árbol limpio.
- ✅ Stack levanta con Docker; `GET /health` responde OK; frontend accesible; integración SECOP en vivo (verificado durante la sesión y en la demo grabada).

**Probado manualmente:**
- ✅ Flujo E2E completo (register → browse → bookmark → delete → perfil).

**Falta validar / cerrar:**
- ⚠️ Reconstrucción limpia de Docker post-correcciones con evidencia registrada.
- ⚠️ Cualquier despliegue en la nube.

---

## 10. Próximos pasos

1. ~~Commitear y pushear las correcciones de tests de hoy.~~ ✅ **Hecho** (commit `8aa891f`, pusheado a `origin/main`).
2. **Reconstruir Docker** (`docker compose up --build`) y re-verificar el E2E tras las correcciones.
3. **Mejorar trazabilidad:** commits granulares y semánticos de aquí en adelante.
4. **Evaluar despliegue** en una plataforma (documentar URL pública si se realiza).
5. **Automatizar E2E:** convertir el script Playwright de la demo en suite de CI.
6. **Mejoras de producto:** paginación con `total` real (`$select=count(*)`), cache con TTL (Redis), `/health` con verificación real de DB y SODA.

---

## 11. Conclusión

El avance del período es **sustancial y real**: hay un producto full-stack funcional, demostrado end-to-end con datos reales del SECOP, documentado con un README de arranque y un SOUL.md, con el grueso del código commiteado en GitHub, y con una **suite de tests que hoy pasa (24 passed)** tras reparar una infraestructura de tests que estaba rota. La disciplina spec-first, la resolución autónoma de bloqueos no triviales y la verificación honesta (encontrar que los tests no corrían y arreglarlos) son los puntos más fuertes.

Lo que falta para cerrar con integridad es **operativo, no de diseño**: commitear/pushear las correcciones de hoy, verificar una reconstrucción limpia de Docker, mejorar la granularidad de commits y —si se decide— publicar un despliegue. No hay riesgos técnicos abiertos; hay trabajo de cierre. La valoración honesta: **producto sólido, demostrado y ahora con tests verdes verificados, con pendientes de commit/trazabilidad y despliegue claramente identificados.**

---

*Repositorio: https://github.com/pena1rafael-jikk/dev-reto-ai-first · Reflexión completa en `SOUL.md`*
