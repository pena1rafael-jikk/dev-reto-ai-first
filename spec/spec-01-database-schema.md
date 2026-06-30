# Spec 01 — Portal de Convocatorias Publicas: Database Schema

> Stack: FastAPI + Angular 20 + PostgreSQL 16 + Docker + JWT stateless.
> Scope: tablas de identidad, bookmarks y busquedas guardadas.
> Gate: precision >= 0.85. Target: Spec-B depth (~480 palabras).

## Domain

Portal web donde usuarios colombianos registrados pueden explorar, filtrar y guardar
convocatorias publicas del Sistema Electronico para la Contratacion Publica (SECOP),
accesibles via la API abierta de datos.gov.co usando el protocolo Socrata Open Data
API (SODA). El schema gestiona tres responsabilidades: identidad y autenticacion de
usuarios, persistencia de bookmarks contra IDs de procesos SECOP con snapshot de
campos clave desnormalizados, y configuraciones de busqueda guardadas con los
parametros SODA que el usuario reutiliza.

## Scope (tables)

Tres tablas requeridas. El gate penaliza tablas inventadas fuera de este listado.

**users** — identidad y autenticacion:
id, email, password_hash, full_name, created_at, updated_at, deleted_at.

**bookmarks** — procesos SECOP guardados por el usuario. Campos desnormalizados de
la respuesta JSON de datos.gov.co para permitir filtrado sin re-consultar la API.
Columnas: id, user_id, secop_process_id (id_del_proceso de la API), entidad
(campo entidad de la API), nit_entidad, departamento (departamento_entidad),
ciudad (ciudad_entidad), nombre_procedimiento (nombre_del_procedimiento),
descripcion_procedimiento (descripci_n_del_procedimiento), precio_base (casteado
a NUMERIC desde el string de la API), fecha_publicacion (fecha_de_publicacion_del),
fecha_ultima_publicacion (fecha_de_ultima_publicaci), modalidad_contratacion
(modalidad_de_contratacion), tipo_contrato (tipo_de_contrato), estado_procedimiento
(estado_del_procedimiento), estado_apertura (estado_de_apertura_del_proceso),
url_secop (urlproceso.url), secop_snapshot (objeto JSON completo de la API),
created_at, deleted_at.

**saved_searches** — busquedas persistidas por nombre con sus parametros SODA:
id, user_id, name, query_params (JSONB con claves: q, entidad, departamento,
estado_apertura, tipo_contrato, modalidad, fecha_desde, fecha_hasta,
precio_min, precio_max), created_at, updated_at, deleted_at.

## Tech stack

- PostgreSQL 16 (sin extensiones adicionales — el hash de password se calcula en la app con bcrypt/passlib, no en la DB).
- PK: BIGSERIAL en todas las tablas (auto-increment, no UUID — menor overhead en dev).
- FK naming: {tabla_singular}_id (user_id, no users_id).
- Timestamps: TIMESTAMPTZ NOT NULL DEFAULT NOW() en created_at y updated_at.
- Soft delete: columna deleted_at TIMESTAMPTZ NULL presente en las tres tablas (NULL = registro activo).
- JSONB para secop_snapshot y query_params (schema flexible, sin columnas virtuales generadas).

## Conventions

- Nombres de tablas y columnas en snake_case, tablas en plural (users, bookmarks, saved_searches).
- Estados y modalidades como TEXT plano, sin ENUM (mas facil de migrar cuando SECOP cambia valores).
- Dinero: precio_base como NUMERIC(18,2), nunca FLOAT ni TEXT.
- Los campos que provienen de la API SECOP conservan significado semantico en el nombre
  de columna aunque el nombre original de la API use abreviaciones o tildes.
- Booleanos: columna adjudicado si se necesita en el futuro sera BOOLEAN, no TEXT 'Si'/'No'.

## Integrity rules

- users.email: NOT NULL, UNIQUE, CHECK (email LIKE '%@%').
- users.password_hash: NOT NULL, CHECK (length(password_hash) > 0).
- bookmarks.user_id: FK users.id ON DELETE CASCADE (borrar usuario borra sus bookmarks).
- bookmarks.secop_process_id: NOT NULL.
- bookmarks: PARTIAL UNIQUE INDEX (user_id, secop_process_id) WHERE deleted_at IS NULL
  — un usuario no puede tener dos bookmarks activos del mismo proceso.
- bookmarks.secop_snapshot: NOT NULL (siempre se guarda el JSON completo al momento de marcar).
- saved_searches.user_id: FK users.id ON DELETE CASCADE.
- saved_searches.name: NOT NULL, CHECK (length(trim(name)) > 0).
- saved_searches.query_params: NOT NULL (puede ser objeto vacio {} pero no NULL).

## Safe-change rules

- Nuevas columnas siempre nullable o con DEFAULT explicito para no romper filas existentes.
- Sin renombrado de columnas sin migracion versionada y despliegue coordinado.
- Indice en cada FK antes de consultas de produccion:
  - idx_bookmarks_user_id ON bookmarks(user_id)
  - idx_bookmarks_secop_process_id ON bookmarks(secop_process_id)
  - idx_bookmarks_estado_apertura ON bookmarks(estado_apertura) WHERE deleted_at IS NULL
  - idx_bookmarks_departamento ON bookmarks(departamento) WHERE deleted_at IS NULL
  - idx_saved_searches_user_id ON saved_searches(user_id)
  - GIN idx_bookmarks_snapshot ON bookmarks USING gin(secop_snapshot) (queries JSONB ad-hoc)
- El PARTIAL UNIQUE de bookmarks usa WHERE deleted_at IS NULL para permitir re-bookmarkear
  despues de un soft-delete.

## Out of scope

- Tabla de roles o permisos: un solo tipo de usuario en esta version.
- Cache de convocatorias SECOP: la API se consulta en vivo; el snapshot se guarda solo en bookmarks.
- Tabla de sesiones: JWT es stateless, no requiere almacenamiento server-side.
- OAuth o login social: solo email + password en esta version.
- Tags o carpetas de bookmarks: v2.
- Historial de cambios de estado en contratos SECOP: fuera del alcance del reto.
- Tabla de notificaciones o alertas: fuera del alcance del reto.

## Deliverable

Un archivo SQL unico (`migrations/001_initial_schema.sql`) con:

1. CREATE TABLE en orden de dependencias: users primero, luego bookmarks y saved_searches.
2. Todos los constraints inline (PRIMARY KEY, NOT NULL, UNIQUE, CHECK, FOREIGN KEY).
3. CREATE INDEX separados despues de los CREATE TABLE.
4. COMMENT ON TABLE para las tres tablas.
5. COMMENT ON COLUMN para columnas cuyo nombre difiere del campo original de la API SECOP
   (ej: secop_process_id, nombre_procedimiento, precio_base, etc.).
6. Sin prosa, sin bloques markdown, solo SQL valido para PostgreSQL 16.
