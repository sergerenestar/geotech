SET search_path TO test_perm;

CREATE TABLE IF NOT EXISTS perm_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id               UUID,
    project_id              UUID,
    borehole_id             UUID,
    technician_id           UUID NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    test_type               VARCHAR(20)  NOT NULL DEFAULT 'CONSTANT_HEAD',
    specimen_diameter_mm    DECIMAL(10,3) NOT NULL,
    specimen_length_mm      DECIMAL(10,3) NOT NULL,
    water_temperature_c     DECIMAL(6,2) NOT NULL DEFAULT 20.0,
    standpipe_area_cm2      DECIMAL(10,4),
    head_cm                 DECIMAL(10,3),
    k_cms                   DECIMAL(14,8),
    k_at20c_cms             DECIMAL(14,8),
    notes                   TEXT,
    ai_flag                 VARCHAR(10)  NOT NULL DEFAULT 'NONE',
    ai_flag_message         TEXT,
    is_deleted              BOOLEAN      NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_perm_status   CHECK (status   IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_perm_ai_flag  CHECK (ai_flag  IN ('NONE','WARNING','ERROR')),
    CONSTRAINT chk_perm_type     CHECK (test_type IN ('CONSTANT_HEAD','FALLING_HEAD'))
);

CREATE INDEX idx_perm_tests_project_id    ON perm_tests(project_id);
CREATE INDEX idx_perm_tests_sample_id     ON perm_tests(sample_id);
CREATE INDEX idx_perm_tests_technician_id ON perm_tests(technician_id);

CREATE TABLE IF NOT EXISTS perm_readings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id             UUID NOT NULL REFERENCES perm_tests(id) ON DELETE CASCADE,
    reading_number      INT  NOT NULL,
    flow_volume_ml      DECIMAL(10,3),
    initial_head_cm     DECIMAL(10,3),
    final_head_cm       DECIMAL(10,3),
    elapsed_time_s      DECIMAL(12,3) NOT NULL,
    k_cms               DECIMAL(14,8),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, reading_number)
);

CREATE INDEX idx_perm_readings_test_id ON perm_readings(test_id);
