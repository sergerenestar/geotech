-- GeoTech Lab — PostgreSQL schema initialization
-- Run once on first boot via docker-entrypoint-initdb.d/
-- Each service manages its own tables via Flyway migrations.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS test_wc;
CREATE SCHEMA IF NOT EXISTS test_ll;
CREATE SCHEMA IF NOT EXISTS test_proctor;
CREATE SCHEMA IF NOT EXISTS test_sg;
CREATE SCHEMA IF NOT EXISTS test_ps;
CREATE SCHEMA IF NOT EXISTS test_perm;
CREATE SCHEMA IF NOT EXISTS test_uc;
CREATE SCHEMA IF NOT EXISTS test_ds;
CREATE SCHEMA IF NOT EXISTS test_consol;
CREATE SCHEMA IF NOT EXISTS reports;
CREATE SCHEMA IF NOT EXISTS ai_logs;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS notifications;
