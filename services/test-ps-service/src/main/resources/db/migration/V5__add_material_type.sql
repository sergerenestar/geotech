ALTER TABLE test_ps.ps_tests
    ADD COLUMN IF NOT EXISTS material_type   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS applicable_norm VARCHAR(100);
