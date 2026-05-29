SET search_path TO test_ps;
ALTER TABLE ps_tests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
