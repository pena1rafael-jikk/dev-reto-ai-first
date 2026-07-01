# Portal de Convocatorias Públicas

Portal web para **explorar, filtrar y guardar convocatorias públicas del SECOP** (Sistema Electrónico de Contratación Pública de Colombia), consumiendo datos en vivo desde `datos.gov.co`.

Registro con JWT → búsqueda en tiempo real con filtros → guardado de convocatorias con snapshot → búsquedas reutilizables. Todo el stack (base de datos + backend + frontend) se levanta con **un solo comando**.

> **¿Solo quieres arrancarlo ya?** Salta a [🚀 Guía rápida (3 pasos)](#-guía-rápida-3-pasos).

---

## 📑 Contenido

1. [Qué necesitas antes de empezar](#1-qué-necesitas-antes-de-empezar)
2. [🚀 Guía rápida (3 pasos)](#-guía-rápida-3-pasos)
3. [Paso a paso detallado (para dummies)](#3-paso-a-paso-detallado-para-dummies)
4. [Cómo usar el portal](#4-cómo-usar-el-portal)
5. [Servicios y puertos](#5-servicios-y-puertos)
6. [Variables de entorno](#6-variables-de-entorno-env)
7. [Comandos útiles](#7-comandos-útiles)
8. [Solución de problemas (troubleshooting)](#8-solución-de-problemas-troubleshooting)
9. [Estructura del proyecto](#9-estructura-del-proyecto)
10. [Stack tecnológico](#10-stack-tecnológico)

---

## 1. Qué necesitas antes de empezar

Solo necesitas **dos programas** instalados. No necesitas Python, ni Node, ni PostgreSQL en tu máquina: **todo corre dentro de Docker**.

| Programa | Para qué sirve | Cómo instalarlo |
|----------|----------------|-----------------|
| **Docker Desktop** | Ejecuta todo el stack en contenedores aislados | Windows/Mac: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) · Linux: [docs.docker.com/engine/install](https://docs.docker.com/engine/install/) |
| **Git** | Descargar (clonar) el código | [git-scm.com/downloads](https://git-scm.com/downloads) |

### Verifica que están instalados

Abre una terminal (en Windows: **PowerShell** o **Git Bash**; en Mac/Linux: **Terminal**) y ejecuta:

```bash
docker --version
docker compose version
git --version
```

Si cada comando responde con un número de versión, estás listo. Si alguno dice *"command not found"* o *"no se reconoce"*, ese programa no está instalado o necesitas reiniciar la terminal.

> ⚠️ **Importante en Windows y Mac:** Docker Desktop debe estar **abierto y corriendo** (ícono de la ballena 🐳 en la barra de tareas) antes de continuar. Si no lo abres, cualquier comando `docker` fallará con un error de conexión.

**Requisitos de hardware recomendados:** 4 GB de RAM libres y ~2 GB de espacio en disco para las imágenes de Docker.

---

## 🚀 Guía rápida (3 pasos)

Si ya tienes Docker y Git, esto es todo:

```bash
# 1. Clonar el repositorio
git clone https://github.com/pena1rafael-jikk/dev-reto-ai-first.git
cd dev-reto-ai-first

# 2. Crear el archivo .env a partir del ejemplo
cp .env.example .env      # En Windows PowerShell usa: Copy-Item .env.example .env

# 3. Levantar todo el stack
docker compose up --build
```

Espera 2–4 minutos la primera vez (descarga imágenes y compila). Cuando veas los logs estabilizarse, abre **http://localhost:4200** en tu navegador. ✅

> 💡 El `.env.example` ya trae valores por defecto que **funcionan tal cual** para desarrollo local. No necesitas editar nada para probarlo. (Para producción sí deberías cambiar `SECRET_KEY` y `POSTGRES_PASSWORD` — ver [sección 6](#6-variables-de-entorno-env)).

---

## 3. Paso a paso detallado (para dummies)

Si la guía rápida te dejó dudas, aquí va explicado con lujo de detalle.

### Paso 1 — Descargar el código

Abre tu terminal y ubícate en una carpeta donde quieras guardar el proyecto (por ejemplo tu escritorio):

```bash
cd Desktop
git clone https://github.com/pena1rafael-jikk/dev-reto-ai-first.git
cd dev-reto-ai-first
```

`git clone` descarga todo el proyecto en una carpeta llamada `dev-reto-ai-first`, y `cd` te mete dentro de ella. **Todos los comandos siguientes se ejecutan dentro de esta carpeta.**

### Paso 2 — Crear el archivo de configuración `.env`

El proyecto lee su configuración de un archivo llamado `.env` que **no viene incluido** (por seguridad). Debes crearlo copiando la plantilla `.env.example`. Elige el comando según tu terminal:

| Terminal | Comando |
|----------|---------|
| **Git Bash / Mac / Linux** | `cp .env.example .env` |
| **Windows PowerShell** | `Copy-Item .env.example .env` |
| **Windows CMD** | `copy .env.example .env` |

Con esto ya tienes un `.env` funcional. Si quieres inspeccionarlo o cambiar algún valor, ábrelo con cualquier editor de texto (Bloc de notas, VS Code, etc.).

#### (Opcional pero recomendado) Genera un SECRET_KEY seguro

Para que los tokens JWT sean seguros, reemplaza el `SECRET_KEY` por uno aleatorio. Genera uno así:

```bash
# Con Python (si lo tienes):
python -c "import secrets; print(secrets.token_urlsafe(48))"

# O con OpenSSL (Git Bash / Mac / Linux):
openssl rand -base64 48
```

Copia el resultado y pégalo en la línea `SECRET_KEY=...` de tu `.env`.

> 🔒 El backend **se niega a arrancar** si dejas el valor literal `change-this-secret`. El valor por defecto del `.env.example` (`change-this-to-a-long-random-secret-key`) sí funciona para desarrollo, pero cámbialo para cualquier despliegue real.

### Paso 3 — Levantar el stack

```bash
docker compose up --build
```

Esto hace, en orden:

1. **Descarga** la imagen de PostgreSQL 16 y las bases para Python/Node (solo la primera vez).
2. **Construye** las imágenes del backend (FastAPI) y frontend (Angular).
3. **Arranca** la base de datos y ejecuta automáticamente la migración `migrations/001_initial_schema.sql` (crea las tablas `users`, `bookmarks`, `saved_searches`).
4. **Espera** a que la base de datos esté sana (healthcheck) antes de arrancar el backend.
5. **Sirve** el frontend Angular con hot-reload.

La primera vez tarda **2–4 minutos**. Las siguientes son casi instantáneas gracias al cache de Docker.

> 💡 **Tip:** agrega `-d` (`docker compose up --build -d`) para correrlo en segundo plano y liberar la terminal. Sin `-d`, verás los logs en vivo y con `Ctrl+C` detienes todo.

### Paso 4 — Verificar que todo arrancó bien

Abre otra terminal (o el navegador) y comprueba:

```bash
# El backend responde:
curl http://localhost:8000/health
# Debe devolver: {"status":"ok"}
```

Luego abre en tu navegador:

- **http://localhost:4200** → la aplicación web (deberías ver la pantalla de login).
- **http://localhost:8000/docs** → la documentación interactiva de la API (Swagger UI).

Si ambos cargan, **¡lo lograste!** 🎉

---

## 4. Cómo usar el portal

No hay usuario de prueba precargado: **tú creas el tuyo** en segundos.

1. Ve a **http://localhost:4200** → clic en **"Regístrate aquí"**.
2. Ingresa un nombre, un email válido (ej. `demo@ejemplo.com`) y una contraseña de **mínimo 8 caracteres**.
3. Al registrarte, el sistema hace **auto-login** y te lleva directo a la lista de convocatorias.
4. **Explora:** verás convocatorias reales traídas en vivo desde datos.gov.co.
5. **Filtra:** usa la barra de búsqueda (palabra clave, entidad, departamento) y presiona **"Buscar"**.
6. **Guarda:** presiona **"Guardar"** en cualquier convocatoria de interés.
7. **Revisa tus guardados:** ve a **"Guardados"** en el menú superior; ahí puedes **eliminar** los que ya no necesites.
8. **Perfil:** actualiza tu nombre en la sección **"Perfil"**.

> 📹 Hay un video de demostración del flujo completo en [`demo/screenshots/demo-portal-secop.webm`](demo/screenshots/demo-portal-secop.webm).

---

## 5. Servicios y puertos

Una vez levantado el stack, estos son los puntos de acceso:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend (Angular)** | http://localhost:4200 | La aplicación web que usa el usuario final |
| **Backend (API REST)** | http://localhost:8000 | La API FastAPI (`/api/v1/...`) |
| **Documentación API** | http://localhost:8000/docs | Swagger UI interactivo (probar endpoints con Bearer token) |
| **Health check** | http://localhost:8000/health | Devuelve `{"status":"ok"}` si el backend está vivo |
| **PostgreSQL** | `localhost:5432` (interno) | Base de datos (accesible solo dentro de la red Docker) |

---

## 6. Variables de entorno (`.env`)

Todas viven en el archivo `.env`. Estos son los valores por defecto y qué significan:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `POSTGRES_DB` | `convocatorias` | Nombre de la base de datos |
| `POSTGRES_USER` | `convocatorias_user` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `changeme` | Contraseña de PostgreSQL — **cámbiala en producción** |
| `POSTGRES_HOST` | `db` | Host de la DB (nombre del servicio Docker, no lo cambies en local) |
| `POSTGRES_PORT` | `5432` | Puerto de PostgreSQL |
| `SECRET_KEY` | `change-this-to-a-...` | Clave para firmar los JWT — **cámbiala en producción** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Minutos de validez del token de sesión |
| `SODA_BASE_URL` | `https://www.datos.gov.co/resource/p6dx-8zbt.json` | Endpoint de la SODA API del SECOP (no requiere API key) |
| `CORS_ORIGINS` | `http://localhost:4200` | Orígenes permitidos para llamar a la API (separados por coma) |

> ⚠️ El `.env` **nunca** se sube al repositorio (está en `.gitignore`). Solo se versiona `.env.example`.

---

## 7. Comandos útiles

Todos se ejecutan desde la raíz del proyecto (`dev-reto-ai-first/`):

```bash
# ── Ciclo de vida del stack ──────────────────────────────
docker compose up --build          # Levantar (reconstruyendo imágenes)
docker compose up -d               # Levantar en segundo plano
docker compose down                # Detener y eliminar contenedores
docker compose down -v             # Detener y BORRAR la base de datos (reset total)
docker compose restart backend     # Reiniciar solo el backend
docker compose ps                  # Ver el estado de los servicios

# ── Logs ─────────────────────────────────────────────────
docker compose logs -f             # Ver todos los logs en vivo
docker compose logs -f backend     # Solo los logs del backend
docker compose logs -f frontend    # Solo los logs del frontend

# ── Backend (tests, lint, migraciones) ───────────────────
docker compose exec backend pytest --tb=short   # Correr los tests
docker compose exec backend ruff check .         # Linter de Python
docker compose exec backend alembic upgrade head # Aplicar migraciones (si aplica)

# ── Frontend ─────────────────────────────────────────────
docker compose exec frontend ng test --watch=false  # Tests de Angular
docker compose exec frontend ng lint                 # Linter de Angular

# ── Solo una parte del stack ─────────────────────────────
docker compose up db backend       # Solo base de datos + backend
docker compose up frontend         # Solo frontend
```

---

## 8. Solución de problemas (troubleshooting)

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `Cannot connect to the Docker daemon` / `error during connect` | Docker Desktop no está abierto | Abre Docker Desktop y espera a que el ícono 🐳 deje de animarse, luego reintenta |
| `port is already allocated` / `bind: address already in use` | Otro programa usa el puerto 4200, 8000 o 5432 | Cierra ese programa, **o** edita los `ports` en `docker-compose.yml` (ej. `"8001:8000"`) |
| El backend arranca y se cae con `SECRET_KEY no configurado` | Dejaste el valor `change-this-secret` | Pon cualquier otro valor en `SECRET_KEY` dentro de `.env` (ver [sección 6](#6-variables-de-entorno-env)) |
| `.env: no such file` o variables vacías | No creaste el archivo `.env` | Ejecuta el comando de copia del [Paso 2](#paso-2--crear-el-archivo-de-configuración-env) |
| La web carga pero dice **"credenciales inválidas"** o error de red | El backend aún no terminó de arrancar | Espera ~30s tras el arranque; revisa `docker compose logs -f backend` |
| Las convocatorias no cargan | datos.gov.co lento o sin internet | Verifica tu conexión; la API del SECOP a veces responde lento. Reintenta |
| Cambié código y no se refleja | Cache o contenedor viejo | `docker compose down && docker compose up --build` |
| Todo está raro / quiero empezar de cero | Estado inconsistente | `docker compose down -v` (borra la DB) y vuelve a `docker compose up --build` |
| `no space left on device` | Docker llenó el disco con imágenes viejas | `docker system prune -a` para limpiar (ojo: borra imágenes no usadas) |

### Reinicio limpio completo

Si algo se rompió y quieres partir de cero sin residuos:

```bash
docker compose down -v          # Detiene todo y borra la base de datos
docker compose up --build       # Reconstruye y levanta desde cero
```

---

## 9. Estructura del proyecto

```
dev-reto-ai-first/
├── backend/                  # API FastAPI (Python 3.12)
│   ├── app/
│   │   ├── api/v1/           # Routers REST (auth, profile, convocatorias, bookmarks, searches)
│   │   ├── services/         # Lógica de negocio (incl. SecopService)
│   │   ├── repositories/     # Acceso a datos (SQLAlchemy async)
│   │   ├── models/           # ORM mapeado al schema PostgreSQL
│   │   ├── schemas/          # Modelos Pydantic (validación/serialización)
│   │   └── core/             # Config, base de datos, seguridad (JWT + bcrypt)
│   ├── tests/                # Tests con pytest
│   └── Dockerfile
├── frontend/                 # App Angular 20 (standalone components)
│   ├── src/app/
│   │   ├── core/             # AuthService, jwtInterceptor, AuthGuard
│   │   └── features/         # Login, Register, Convocatorias, Bookmarks, Profile
│   ├── proxy.conf.json       # Reenvía /api → backend dentro de Docker
│   └── Dockerfile
├── migrations/               # SQL de esquema (se aplica al arrancar la DB)
│   └── 001_initial_schema.sql
├── spec/                     # Especificaciones spec-first (spec-01 a spec-05)
├── demo/                     # Scripts y video de demostración (Playwright)
├── docker-compose.yml        # Definición de los 3 servicios
├── docker-compose.override.yml # Overrides de desarrollo (hot-reload)
├── .env.example              # Plantilla de variables de entorno
├── SOUL.md                   # Reflexión del proceso (entregable del reto)
└── README.md                 # Este archivo
```

---

## 10. Stack tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend** | Angular 20 (standalone components, lazy routing, JWT interceptor) |
| **Backend** | FastAPI · Python 3.12 · SQLAlchemy 2.0 async |
| **Base de datos** | PostgreSQL 16 (TIMESTAMPTZ, JSONB, índices parciales + GIN) |
| **Autenticación** | JWT HS256 (python-jose) + hashing bcrypt (passlib) |
| **Integración externa** | datos.gov.co · Socrata Open Data API (SODA) — sin API key |
| **Infraestructura** | Docker + Docker Compose (un solo `docker compose up`) |

---

## Enlaces

- **Repositorio:** https://github.com/pena1rafael-jikk/dev-reto-ai-first
- **Reflexión del proceso:** [SOUL.md](SOUL.md)
- **Especificaciones:** [`spec/`](spec/)

---

*Portal de Convocatorias Públicas · Jikkosoft AI-First · Fase 1 · Track DEV*
