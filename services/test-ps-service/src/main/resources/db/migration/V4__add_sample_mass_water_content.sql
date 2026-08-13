ALTER TABLE test_ps.ps_tests
    ADD COLUMN IF NOT EXISTS sample_mass_g     DECIMAL(10, 3),
    ADD COLUMN IF NOT EXISTS water_content_pct DECIMAL(6, 2);
