-- AI Validation Results — stores rule-based anomaly checks per test
SET search_path TO ai_logs;

CREATE TABLE ai_validation_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id         UUID NOT NULL,
    test_type       VARCHAR(50) NOT NULL,
    ai_flag         VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message TEXT,
    rules_applied   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ai_flag CHECK (ai_flag IN ('NONE', 'WARNING', 'ERROR'))
);

CREATE INDEX idx_ai_val_test ON ai_validation_results (test_id);
CREATE INDEX idx_ai_val_type ON ai_validation_results (test_type);
