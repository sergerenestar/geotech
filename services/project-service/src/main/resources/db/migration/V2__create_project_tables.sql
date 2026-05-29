-- project-service: core tables
SET search_path TO projects;

CREATE TABLE IF NOT EXISTS clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    contact_person  VARCHAR(200),
    email           VARCHAR(200),
    phone           VARCHAR(50),
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients(name);

CREATE TABLE IF NOT EXISTS locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    address     VARCHAR(500),
    city        VARCHAR(100),
    country     VARCHAR(100),
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    is_deleted  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_city ON locations(city);

CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code    VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    client_id       UUID,
    location_id     UUID,
    created_by      UUID NOT NULL,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_project_status CHECK (status IN ('DRAFT','ACTIVE','ON_HOLD','COMPLETED','ARCHIVED','CANCELLED','PENDING_REVIEW'))
);

CREATE INDEX idx_projects_code       ON projects(project_code);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status     ON projects(status);
CREATE INDEX idx_projects_deleted    ON projects(is_deleted);

CREATE TABLE IF NOT EXISTS boreholes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    bh_code             VARCHAR(50) NOT NULL,
    depth_m             DECIMAL(8,2),
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    groundwater_depth_m DECIMAL(8,2),
    notes               TEXT,
    created_by          UUID NOT NULL,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, bh_code)
);

CREATE INDEX idx_boreholes_project_id ON boreholes(project_id);
CREATE INDEX idx_boreholes_deleted    ON boreholes(is_deleted);

CREATE TABLE IF NOT EXISTS samples (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borehole_id     UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
    sample_code     VARCHAR(50) NOT NULL,
    depth_from_m    DECIMAL(8,2),
    depth_to_m      DECIMAL(8,2),
    soil_description TEXT,
    uscs_symbol     VARCHAR(10),
    aashto_class    VARCHAR(20),
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (borehole_id, sample_code)
);

CREATE INDEX idx_samples_borehole_id ON samples(borehole_id);
CREATE INDEX idx_samples_deleted     ON samples(is_deleted);
