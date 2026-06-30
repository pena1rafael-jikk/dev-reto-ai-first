# Spec 04 — Portal de Convocatorias Publicas: Integracion SECOP

> Stack: httpx.AsyncClient + datos.gov.co SODA API (SECOP I, dataset `p6dx-8zbt`).
> Scope: contrato detallado de `secop_service.py` — unica puerta de entrada/salida
> hacia datos.gov.co, consumida por los endpoints de convocatorias y bookmarks.
> Gate: precision >= 0.85. Target: Spec-B depth (~480 palabras).
> Referencias: spec-01-database-schema.md, spec-02-architecture.md, spec-03-api-rest.md

## Domain

`SecopService` es la unica capa autorizada para hablar con la SODA API de
datos.gov.co (regla de integridad #4 de spec-02). Construye queries SoQL
seguras a partir de filtros del usuario, mapea el JSON crudo de la API
(campos con tildes/abreviaciones inconsistentes) a un schema Pydantic limpio
(`SecopConvocatoria`), y traduce cualquier fallo de red o dato inesperado en
un error controlado (502 SECOP_ERROR, definido en spec-03) sin propagar
detalles internos al cliente.

## Scope (metodos)

Dos metodos publicos. El gate penaliza metodos o endpoints SODA inventados fuera de este listado.

- `search(filters: dict, limit: int, offset: int) -> list[SecopConvocatoria]` — usado por `GET /api/v1/convocatorias` (spec-03). Traduce `filters` a `$where`/`$q` y pagina con `$limit`/`$offset`.
- `get_by_id(secop_process_id: str) -> SecopConvocatoria | None` — usado por `GET /api/v1/convocatorias/{id}` y por `POST /api/v1/bookmarks` (spec-03) para obtener el snapshot que se guarda en `bookmarks.secop_snapshot` (spec-01). Retorna `None` si SODA no encuentra el proceso (404 logico, no error).

**Tabla de mapeo** (campo SODA → campo `SecopConvocatoria`, mismos nombres ya fijados en spec-01 para `bookmarks`):

| Campo SODA | Campo destino |
| --- | --- |
| id_del_proceso | secop_process_id |
| entidad | entidad |
| nit_entidad | nit_entidad |
| departamento_entidad | departamento |
| ciudad_entidad | ciudad |
| nombre_del_procedimiento | nombre_procedimiento |
| descripci_n_del_procedimiento | descripcion_procedimiento |
| precio_base | precio_base (Decimal) |
| fecha_de_publicacion_del | fecha_publicacion |
| fecha_de_ultima_publicaci | fecha_ultima_publicacion |
| modalidad_de_contratacion | modalidad_contratacion |
| tipo_de_contrato | tipo_contrato |
| estado_del_procedimiento | estado_procedimiento |
| estado_de_apertura_del_proceso | estado_apertura |
| urlproceso.url | url_secop |

## Tech stack

- `httpx.AsyncClient` con timeout de 10s, sin retry automatico — un fallo se propaga directo como 502.
- Endpoint base via env var `SODA_BASE_URL` (spec-02), sin API key.
- Pydantic v2 para `SecopConvocatoria` con validadores de campo para castear tipos.

## Conventions

- Construccion de `$where` mediante clausulas parametrizadas que escapan comillas simples del input del usuario antes de interpolar (prevenir SoQL injection en `entidad`, `departamento`, etc.).
- `$q` se usa para busqueda full-text libre (parametro `q` del endpoint).
- Fechas en formato `floating_timestamp` ISO 8601 propio de Socrata (`fecha_desde`/`fecha_hasta` se convierten a ese formato antes de interpolar en `$where`).
- Multiples filtros se combinan con `AND` dentro de una sola clausula `$where`.

## Integrity rules

1. Nunca interpolar input de usuario sin sanitizar directamente en `$where` — todo valor de texto libre pasa por escape de comillas antes de construirse la clausula.
2. Campos numericos o de fecha vacios/invalidos en la respuesta SODA se mapean a `None`, nunca lanzan excepcion de parseo.
3. El snapshot completo (`response.json()` sin transformar) se preserva intacto para `bookmarks.secop_snapshot` — el mapeo a `SecopConvocatoria` es una vista derivada, no reemplaza el crudo.
4. Timeout o status HTTP >= 500 de SODA se traduce a `SecopServiceError`, capturado por el router y devuelto como `502 SECOP_ERROR` (codigo ya definido en spec-03) — nunca se expone el mensaje crudo de httpx al cliente.
5. `get_by_id` con proceso inexistente retorna `None`, no excepcion — el router lo traduce a `404 NOT_FOUND`.

## Safe-change rules

- Agregar un filtro nuevo requiere actualizar en el mismo cambio: la tabla de mapeo, el query builder de `$where`, y el schema `SecopConvocatoria`.
- Cambiar de dataset SECOP (ej. migrar a SECOP II) requiere una nueva constante de endpoint y su propia tabla de mapeo — no reutilizar la tabla existente, los nombres de campo difieren entre datasets.
- Cambios en `ACCESS_TOKEN_EXPIRE_MINUTES` o JWT no afectan esta spec — `SecopService` no conoce JWT, solo lo invoca un router ya autenticado.

## Out of scope

- Cache de resultados SECOP (consulta siempre en vivo, segun spec-01 "Out of scope").
- Jobs de sincronizacion periodica o pre-carga de datos.
- Soporte simultaneo a multiples datasets SECOP (I y II a la vez).
- Reintentos automaticos ante fallo de red.
- Paginacion via cursor — solo `offset`/`limit` segun spec-03.
- Escritura hacia SECOP — el servicio es estrictamente de lectura.

## Deliverable

Dos archivos Python sin prosa adicional, donde el codigo y la tabla de mapeo son la unica fuente de verdad:

1. `services/secop_service.py` — clase `SecopService` con los metodos `search` y `get_by_id`, el query builder de `$where`, y el manejo de errores hacia `SecopServiceError`.
2. `schemas/secop.py` — modelo `SecopConvocatoria` (Pydantic v2) y funcion `map_secop_response(raw: dict) -> SecopConvocatoria` que aplica la tabla de mapeo.
