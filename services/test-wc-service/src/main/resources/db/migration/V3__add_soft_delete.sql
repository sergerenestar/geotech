SET search_path TO test_wc;
ALTER TABLE wc_tests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
