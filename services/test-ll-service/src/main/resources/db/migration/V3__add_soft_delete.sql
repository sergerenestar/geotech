SET search_path TO test_ll;
ALTER TABLE ll_tests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
