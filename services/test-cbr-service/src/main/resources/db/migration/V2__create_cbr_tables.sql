SET search_path TO test_cbr;

-- Main CBR test header
CREATE TABLE IF NOT EXISTS cbr_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL,
    borehole_id             UUID,
    sample_id               UUID,
    technician_id           UUID NOT NULL,
    reference               VARCHAR(100),
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- Soil properties used for ZAV and compaction reference
    specific_gravity        DECIMAL(6,4) NOT NULL DEFAULT 2.70,
    proctor_gdmax_tm3       DECIMAL(8,4),   -- DSM from reference Proctor (T/m³)
    proctor_omc_pct         DECIMAL(6,2),   -- OPM from reference Proctor (%)
    -- Ring coefficient for load calculation: load_kN = ring_reading × ring_coeff
    ring_coefficient        DECIMAL(8,5) NOT NULL DEFAULT 0.318,
    notes                   TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cbr_status CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED'))
);

CREATE INDEX idx_cbr_tests_project_id    ON cbr_tests(project_id);
CREATE INDEX idx_cbr_tests_sample_id     ON cbr_tests(sample_id);
CREATE INDEX idx_cbr_tests_technician_id ON cbr_tests(technician_id);

-- One record per compaction intensity (55, 25, or 10 blows)
CREATE TABLE IF NOT EXISTS cbr_intensities (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                 UUID NOT NULL REFERENCES cbr_tests(id) ON DELETE CASCADE,
    blows                   INT NOT NULL,           -- 55, 25 or 10
    mass_mold_g             DECIMAL(10,2),          -- Mass of mold (g)
    mass_wet_g              DECIMAL(10,2),          -- Mass mold + wet soil (g)
    mass_dry_g              DECIMAL(10,2),          -- Mass mold + dry soil (g)
    water_content_pct       DECIMAL(6,2),           -- w% computed or measured
    dry_density_tm3         DECIMAL(8,4),           -- γd (T/m³) computed
    compaction_degree_pct   DECIMAL(6,2),           -- γd/γd_max × 100 (%)
    cbr_25mm                DECIMAL(8,2),           -- CBR index at 2.5mm (%)
    cbr_50mm                DECIMAL(8,2),           -- CBR index at 5.0mm (%)
    cbr_index               DECIMAL(8,2),           -- Retained value = max(cbr_25mm, cbr_50mm)
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, blows)
);

CREATE INDEX idx_cbr_intensities_test_id ON cbr_intensities(test_id);

-- Swelling measurements over 4 days immersion
CREATE TABLE IF NOT EXISTS cbr_swelling (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intensity_id            UUID NOT NULL REFERENCES cbr_intensities(id) ON DELETE CASCADE,
    hours                   INT NOT NULL,           -- 0, 24, 48, 72, 96
    reading_mm              DECIMAL(6,2),           -- Dial gauge reading (mm)
    swelling_pct            DECIMAL(6,3),           -- (reading / specimen_height_mm) × 100
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (intensity_id, hours)
);

CREATE INDEX idx_cbr_swelling_intensity_id ON cbr_swelling(intensity_id);

-- Penetration test readings (piston load vs penetration)
CREATE TABLE IF NOT EXISTS cbr_penetration (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intensity_id            UUID NOT NULL REFERENCES cbr_intensities(id) ON DELETE CASCADE,
    penetration_mm          DECIMAL(6,3) NOT NULL,  -- 0.0 to 10.0 mm
    ring_reading            DECIMAL(10,2),           -- Raw dial gauge reading
    load_kn                 DECIMAL(8,3),            -- ring_reading × ring_coefficient
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (intensity_id, penetration_mm)
);

CREATE INDEX idx_cbr_penetration_intensity_id ON cbr_penetration(intensity_id);
