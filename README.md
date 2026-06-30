# Portal de Convocatorias Públicas

Portal web para explorar, filtrar y guardar convocatorias SECOP de Colombia vía datos.gov.co.

## Requisitos

- Docker Desktop (con Docker Compose v2)
- Git

## Levantar el stack

```bash
cp .env.example .env
# Edita .env con tus valores (mínimo cambia SECRET_KEY)
docker compose up --build
```

Servicios disponibles:

| Servicio | URL |
|---------|-----|
| Frontend Angular | http://localhost:4200 |
| Backend API | http://localhost:8000 |
| API Docs (OpenAPI) | http://localhost:8000/docs |

## Credenciales de prueba

Regístrate en http://localhost:4200/register con cualquier email válido.

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Correr tests backend
docker compose exec backend pytest --tb=short

# Correr lint backend
docker compose exec backend ruff check .

# Correr tests frontend
docker compose exec frontend ng test --watch=false
```

## Stack

- **Backend**: FastAPI (Python 3.12) + PostgreSQL 16 + JWT
- **Frontend**: Angular 20 standalone
- **Integración SECOP**: datos.gov.co SODA API (sin API key)
- **Infraestructura**: Docker Compose
