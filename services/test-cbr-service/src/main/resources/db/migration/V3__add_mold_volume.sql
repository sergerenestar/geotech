ALTER TABLE test_cbr.cbr_tests
    ADD COLUMN IF NOT EXISTS mold_volume_cm3 DECIMAL(10, 3) DEFAULT 2332.0;
