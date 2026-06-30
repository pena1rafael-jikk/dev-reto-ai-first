-- Portal de Convocatorias Públicas — Initial Schema
-- spec-01-database-schema.md · PostgreSQL 16

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    email          TEXT      NOT NULL,
    password_hash  TEXT      NOT NULL,
    full_name      TEXT      NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ,

    CONSTRAINT uq_users_email       UNIQUE (email),
    CONSTRAINT chk_users_email      CHECK  (email LIKE '%@%'),
    CONSTRAINT chk_users_pwd_hash   CHECK  (length(password_hash) > 0)
);

COMMENT ON TABLE users IS
    'Identidad y autenticación de usuarios registrados.';

-- ============================================================
-- TABLE: bookmarks
-- ============================================================
CREATE TABLE bookmarks (
    id                       BIGSERIAL PRIMARY KEY,
    user_id                  BIGINT      NOT NULL,
    secop_process_id         TEXT        NOT NULL,
    entidad                  TEXT,
    nit_entidad              TEXT,
    departamento             TEXT,
    ciudad                   TEXT,
    nombre_procedimiento     TEXT,
    descripcion_procedimiento TEXT,
    precio_base              NUMERIC(18,2),
    fecha_publicacion        TIMESTAMPTZ,
    fecha_ultima_publicacion TIMESTAMPTZ,
    modalidad_contratacion   TEXT,
    tipo_contrato            TEXT,
    estado_procedimiento     TEXT,
    estado_apertura          TEXT,
    url_secop                TEXT,
    secop_snapshot           JSONB       NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at               TIMESTAMPTZ,

    CONSTRAINT fk_bookmarks_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_bookmarks_secop_id
        CHECK (length(trim(secop_process_id)) > 0)
);

COMMENT ON TABLE bookmarks IS
    'Procesos SECOP guardados por el usuario con snapshot desnormalizado de datos.gov.co.';

COMMENT ON COLUMN bookmarks.secop_process_id IS
    'id_del_proceso de la SODA API (campo original: id_del_proceso).';
COMMENT ON COLUMN bookmarks.entidad IS
    'Nombre de la entidad contratante (campo original: entidad).';
COMMENT ON COLUMN bookmarks.nit_entidad IS
    'NIT de la entidad (campo original: nit_entidad).';
COMMENT ON COLUMN bookmarks.departamento IS
    'Departamento de la entidad (campo original: departamento_entidad).';
COMMENT ON COLUMN bookmarks.ciudad IS
    'Ciudad de la entidad (campo original: ciudad_entidad).';
COMMENT ON COLUMN bookmarks.nombre_procedimiento IS
    'Nombre del proceso de contratación (campo original: nombre_del_procedimiento).';
COMMENT ON COLUMN bookmarks.descripcion_procedimiento IS
    'Descripción del proceso (campo original: descripci_n_del_procedimiento).';
COMMENT ON COLUMN bookmarks.precio_base IS
    'Cuantía estimada en COP, casteada de TEXT a NUMERIC (campo original: precio_base).';
COMMENT ON COLUMN bookmarks.fecha_publicacion IS
    'Fecha de publicación del proceso (campo original: fecha_de_publicacion_del).';
COMMENT ON COLUMN bookmarks.fecha_ultima_publicacion IS
    'Fecha de la última modificación publicada (campo original: fecha_de_ultima_publicaci).';
COMMENT ON COLUMN bookmarks.modalidad_contratacion IS
    'Modalidad de contratación (campo original: modalidad_de_contratacion).';
COMMENT ON COLUMN bookmarks.tipo_contrato IS
    'Tipo de contrato (campo original: tipo_de_contrato).';
COMMENT ON COLUMN bookmarks.estado_procedimiento IS
    'Estado del proceso en SECOP (campo original: estado_del_procedimiento).';
COMMENT ON COLUMN bookmarks.estado_apertura IS
    'Estado de apertura del proceso (campo original: estado_de_apertura_del_proceso).';
COMMENT ON COLUMN bookmarks.url_secop IS
    'URL del proceso en SECOP (campo original: urlproceso.url — campo anidado).';
COMMENT ON COLUMN bookmarks.secop_snapshot IS
    'JSON crudo completo de la respuesta SODA al momento de guardar el bookmark.';

-- ============================================================
-- TABLE: saved_searches
-- ============================================================
CREATE TABLE saved_searches (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    name         TEXT        NOT NULL,
    query_params JSONB       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT fk_saved_searches_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_saved_searches_name
        CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE saved_searches IS
    'Configuraciones de búsqueda persistidas por nombre con parámetros SODA reutilizables.';

COMMENT ON COLUMN saved_searches.query_params IS
    'Objeto JSONB con claves: q, entidad, departamento, estado_apertura, tipo_contrato, '
    'modalidad, fecha_desde, fecha_hasta, precio_min, precio_max.';

-- ============================================================
-- INDEXES
-- ============================================================

-- bookmarks
CREATE INDEX idx_bookmarks_user_id
    ON bookmarks (user_id);

CREATE INDEX idx_bookmarks_secop_process_id
    ON bookmarks (secop_process_id);

CREATE INDEX idx_bookmarks_estado_apertura
    ON bookmarks (estado_apertura)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_bookmarks_departamento
    ON bookmarks (departamento)
    WHERE deleted_at IS NULL;

-- Partial unique: un usuario no puede tener dos bookmarks activos del mismo proceso
CREATE UNIQUE INDEX uidx_bookmarks_user_process_active
    ON bookmarks (user_id, secop_process_id)
    WHERE deleted_at IS NULL;

-- GIN para queries JSONB ad-hoc sobre el snapshot completo
CREATE INDEX idx_bookmarks_snapshot_gin
    ON bookmarks USING gin (secop_snapshot);

-- saved_searches
CREATE INDEX idx_saved_searches_user_id
    ON saved_searches (user_id);
