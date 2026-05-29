SET search_path TO test_consol;

CREATE TABLE IF NOT EXISTS consol_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id               UUID,
    project_id              UUID,
    borehole_id             UUID,
    technician_id           UUID NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    specimen_diameter_mm    DECIMAL(10,3) NOT NULL,
    initial_height_mm       DECIMAL(10,3) NOT NULL,
    initial_void_ratio      DECIMAL(8,4)  NOT NULL,
    specific_gravity        DECIMAL(6,4)  NOT NULL DEFAULT 2.7,
    drainage_type           VARCHAR(15)   NOT NULL DEFAULT 'DOUBLE',
    cc                      DECIMAL(8,4),
    cs                      DECIMAL(8,4),
    sigma_p_kpa             DECIMAL(10,3),
    notes                   TEXT,
    ai_flag                 VARCHAR(10)  NOT NULL DEFAULT 'NONE',
    ai_flag_message         TEXT,
    is_deleted              BOOLEAN      NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_consol_status   CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_consol_ai_flag  CHECK (ai_flag IN ('NONE','WARNING','ERROR')),
    CONSTRAINT chk_consol_drain    CHECK (drainage_type IN ('SINGLE','DOUBLE'))
);

CREATE INDEX idx_consol_tests_project_id    ON consol_tests(project_id);
CREATE INDEX idx_consol_tests_sample_id     ON consol_tests(sample_id);
CREATE INDEX idx_consol_tests_technician_id ON consol_tests(technician_id);

CREATE TABLE IF NOT EXISTS consol_stages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id             UUID NOT NULL REFERENCES consol_tests(id) ON DELETE CASCADE,
    stage_number        INT  NOT NULL,
    load_type           VARCHAR(12) NOT NULL DEFAULT 'LOADING',
    sigma_v_kpa         DECIMAL(10,3) NOT NULL,
    e_final             DECIMAL(8,4),
    cv_m2_yr            DECIMAL(14,6),
    mv_m2_kn            DECIMAL(14,8),
    t50_min             DECIMAL(12,4),
    t90_min             DECIMAL(12,4),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_consol_load_type CHECK (load_type IN ('LOADING','UNLOADING','RELOADING')),
    UNIQUE (test_id, stage_number)
);

CREATE INDEX idx_consol_stages_test_id ON consol_stages(test_id);

CREATE TABLE IF NOT EXISTS consol_readings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id            UUID NOT NULL REFERENCES consol_stages(id) ON DELETE CASCADE,
    reading_number      INT  NOT NULL,
    time_min            DECIMAL(12,4) NOT NULL,
    dial_reading_mm     DECIMAL(10,4) NOT NULL,
    settlement_mm       DECIMAL(10,4),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (stage_id, reading_number)
);

CREATE INDEX idx_consol_readings_stage_id ON consol_readings(stage_id);
