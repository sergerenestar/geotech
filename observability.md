# GeoTech Lab — Observability Plan

## Current State

| Component | What exists | Gap |
|---|---|---|
| All 16 Spring Boot services | `spring-boot-starter-actuator` in `pom.xml` | Only `health` + `info` exposed — no Prometheus scrape, no tracing |
| `application.properties` (all services) | `management.endpoints.web.exposure.include=health,info` | `/actuator/prometheus` not exposed; no OTel config |
| `docker-compose.yml` | 16 services + postgres + nginx + web | No Prometheus, Grafana, Loki, Tempo, or OTel Collector |
| `infra/nginx/nginx.conf` | Routing + CORS | No `stub_status` metrics endpoint |
| `apps/web` (Next.js) | None | No server-side tracing, no client-side vitals beacon |

---

## Target Architecture

```
Browser / Mobile
      │
      ▼
Nginx :8888  ──stub_status──► nginx-prometheus-exporter ──►┐
      │                                                      │
      ▼                                                      │
Spring Boot services (16)                                    │
  - HTTP metrics via Micrometer                             │
  - Traces via OTel SDK ──────────────────────────────────►│
      │                                                      ▼
      ▼                                              OTel Collector :4317/4318
PostgreSQL ──pg_stat_*──► postgres-exporter ──────────────► │
                                                             │
                                           ┌─────────────────┼─────────────────┐
                                           ▼                 ▼                 ▼
                                       Prometheus         Loki              Tempo
                                           │                 │                 │
                                           └────────────┬────┘                 │
                                                        ▼                      │
                                                    Grafana :3001 ◄────────────┘
                                               (metrics + logs + traces linked)
```

---

## Services Inventory

| Container | Service | Port |
|---|---|---|
| `geotech-auth` | auth-service | 8080 |
| `geotech-project` | project-service | 8081 |
| `geotech-test-wc` | test-wc-service | 8082 |
| `geotech-test-ll` | test-ll-service | 8083 |
| `geotech-test-ps` | test-ps-service | 8084 |
| `geotech-test-proctor` | test-proctor-service | 8085 |
| `geotech-test-sg` | test-sg-service | 8086 |
| `geotech-test-perm` | test-perm-service | 8087 |
| `geotech-test-ds` | test-ds-service | 8088 |
| `geotech-test-uc` | test-uc-service | 8089 |
| `geotech-report` | report-service | 8090 |
| `geotech-test-cbr` | test-cbr-service | 8091 |
| `geotech-test-consol` | test-consol-service | 8092 |
| `geotech-ai` | ai-assistant-service | 8093 |
| `geotech-media` | media-service | 8094 |
| `geotech-notify` | notification-service | 8095 |

---

## Implementation — 4 Phases

### Phase 1 — Metrics (Prometheus + Grafana)

**Goal:** Every service exposes `/actuator/prometheus`; Grafana shows live dashboards.

#### 1a. Add deps to every `pom.xml`

Same two deps in all 16 `pom.xml` files — no version needed (managed by Spring Boot BOM):

```xml
<!-- Prometheus metrics registry -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

#### 1b. Update `application.properties` in every service

Replace:
```properties
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=always
```
With:
```properties
management.endpoints.web.exposure.include=health,info,prometheus,metrics
management.endpoint.health.show-details=always
management.endpoint.prometheus.enabled=true
management.metrics.tags.service=${spring.application.name}
management.metrics.tags.env=${APP_ENV:dev}
```

Also add `spring.application.name=<service-name>` per service so Grafana can filter by service label.

#### 1c. Add Nginx stub_status block

In `infra/nginx/nginx.conf`, inside the `server` block:

```nginx
location /nginx_status {
    stub_status;
    allow 172.0.0.0/8;   # internal Docker network only
    deny all;
}
```

#### 1d. Add observability stack to `docker-compose.yml`

```yaml
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.102.0
    container_name: geotech-otel
    command: ["--config=/etc/otel/config.yaml"]
    volumes:
      - ./infra/observability/otel-collector.yaml:/etc/otel/config.yaml:ro
    ports:
      - "4317:4317"   # gRPC
      - "4318:4318"   # HTTP
    networks: [geotech-net]

  prometheus:
    image: prom/prometheus:v2.52.0
    container_name: geotech-prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=30d
    volumes:
      - ./infra/observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks: [geotech-net]

  loki:
    image: grafana/loki:3.0.0
    container_name: geotech-loki
    command: -config.file=/etc/loki/config.yaml
    volumes:
      - ./infra/observability/loki.yaml:/etc/loki/config.yaml:ro
      - loki_data:/loki
    networks: [geotech-net]

  tempo:
    image: grafana/tempo:2.5.0
    container_name: geotech-tempo
    command: ["-config.file=/etc/tempo/config.yaml"]
    volumes:
      - ./infra/observability/tempo.yaml:/etc/tempo/config.yaml:ro
      - tempo_data:/var/tempo
    networks: [geotech-net]

  grafana:
    image: grafana/grafana:11.1.0
    container_name: geotech-grafana
    ports:
      - "3001:3000"
    environment:
      GF_AUTH_ANONYMOUS_ENABLED: "false"
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infra/observability/grafana/provisioning:/etc/grafana/provisioning:ro
    depends_on: [prometheus, loki, tempo]
    networks: [geotech-net]

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:1.1.0
    container_name: geotech-nginx-exporter
    command: --nginx.scrape-uri=http://nginx/nginx_status
    depends_on: [nginx]
    networks: [geotech-net]

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    container_name: geotech-pg-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://${POSTGRES_USER:-geotech}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-geotechdb}?sslmode=disable"
    depends_on:
      postgres:
        condition: service_healthy
    networks: [geotech-net]

# Add to volumes section:
# prometheus_data:
# loki_data:
# tempo_data:
# grafana_data:
```

#### 1e. Prometheus scrape config (`infra/observability/prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  external_labels:
    cluster: geotech-local

scrape_configs:
  - job_name: spring-services
    metrics_path: /actuator/prometheus
    static_configs:
      - targets:
          - auth-service:8080
          - project-service:8081
          - test-wc-service:8082
          - test-ll-service:8083
          - test-ps-service:8084
          - test-proctor-service:8085
          - test-sg-service:8086
          - test-perm-service:8087
          - test-ds-service:8088
          - test-uc-service:8089
          - report-service:8090
          - test-cbr-service:8091
          - test-consol-service:8092
          - ai-assistant-service:8093
          - media-service:8094
          - notification-service:8095

  - job_name: nginx
    static_configs:
      - targets: [nginx-exporter:9113]

  - job_name: postgres
    static_configs:
      - targets: [postgres-exporter:9187]
```

---

### Phase 2 — Logs (Loki + structured JSON)

**Goal:** Every service emits structured JSON logs with trace ID injected; Grafana LogQL queries work across all services.

#### 2a. Add Logback JSON encoder to each `pom.xml`

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

#### 2b. Add `logback-spring.xml` to each service (`src/main/resources/`)

```xml
<configuration>
  <springProperty scope="context" name="SERVICE_NAME" source="spring.application.name"/>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <customFields>{"service":"${SERVICE_NAME}"}</customFields>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="JSON"/>
  </root>
</configuration>
```

This automatically injects `traceId` and `spanId` into every log line once OTel tracing is wired up (Phase 3).

#### 2c. Loki config (`infra/observability/loki.yaml`)

```yaml
auth_enabled: false
server:
  http_listen_port: 3100
ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h
storage_config:
  filesystem:
    directory: /loki/chunks
limits_config:
  retention_period: 720h   # 30 days
```

#### 2d. OTel Collector log pipeline (`infra/observability/otel-collector.yaml`)

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

exporters:
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
  otlp/tempo:
    endpoint: http://tempo:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      exporters: [loki]
```

---

### Phase 3 — Distributed Tracing (OpenTelemetry + Tempo)

**Goal:** A single request (e.g., POST /api/tests/water-content) shows as one trace spanning Nginx → auth validation → test-wc-service → PostgreSQL query.

#### 3a. Add tracing deps to every `pom.xml`

```xml
<!-- Micrometer → OTel bridge -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>

<!-- Ships spans to OTel Collector -->
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

#### 3b. Add to `application.properties` in every service

```properties
# Tracing
management.tracing.sampling.probability=1.0
management.otlp.tracing.endpoint=http://otel-collector:4318/v1/traces
spring.application.name=<service-name>
```

Set `probability=0.1` in production (sample 10%). Use `1.0` in dev/staging.

#### 3c. Tempo config (`infra/observability/tempo.yaml`)

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/blocks
    wal:
      path: /var/tempo/wal
```

---

### Phase 4 — Grafana Dashboards + Alerts

Path: `infra/observability/grafana/provisioning/`

#### Dashboards to build

| Dashboard | Key panels |
|---|---|
| **Service Overview** | Request rate, p95 latency, error rate per service (all 16) |
| **Test Submission Flow** | End-to-end latency: POST test → PENDING_REVIEW → APPROVED |
| **AI Anomaly Service** | Flag rate by severity (INFO/WARNING/ERROR), Claude API latency |
| **Database** | Active connections per service (vs pool max), slow queries |
| **Nginx Gateway** | Total requests/s, 4xx/5xx rate, upstream error rate |
| **JVM Health** | Heap used, GC pause time, thread count — per service |
| **Report Generation** | PDF generation duration, report-service queue depth |

#### Alert rules (Prometheus)

```yaml
# infra/observability/grafana/provisioning/alerting/rules.yaml

groups:
  - name: geotech-slo
    rules:
      - alert: ServiceHighErrorRate
        expr: |
          sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (service)
          /
          sum(rate(http_server_requests_seconds_count[5m])) by (service)
          > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.service }} error rate > 5%"

      - alert: ServiceHighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_server_requests_seconds_bucket[5m])) by (le, service)
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.service }} p95 latency > 2s"

      - alert: ServiceDown
        expr: up{job="spring-services"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.instance }} is down"

      - alert: PostgresConnectionPoolSaturation
        expr: |
          hikaricp_connections_active / hikaricp_connections_max > 0.85
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "DB pool > 85% on {{ $labels.service }}"
```

---

## Grafana Data Source Provisioning

`infra/observability/grafana/provisioning/datasources/datasources.yaml`:

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    url: http://loki:3100
    jsonData:
      derivedFields:
        - name: TraceID
          matcherRegex: '"traceId":"(\w+)"'
          url: '$${__value.raw}'
          datasourceUid: tempo

  - name: Tempo
    type: tempo
    uid: tempo
    url: http://tempo:3200
    jsonData:
      tracesToLogsV2:
        datasourceUid: loki
        filterByTraceID: true
```

This links traces → logs → metrics in a single click in Grafana.

---

## File Structure After Implementation

```
infra/
  observability/
    otel-collector.yaml
    prometheus.yml
    loki.yaml
    tempo.yaml
    grafana/
      provisioning/
        datasources/datasources.yaml
        alerting/rules.yaml
        dashboards/
          service-overview.json
          test-submission-flow.json
          ai-anomaly-service.json
          database.json
          nginx-gateway.json
          jvm-health.json
          report-generation.json

services/
  <each-service>/
    pom.xml                         ← +micrometer-registry-prometheus
                                       +micrometer-tracing-bridge-otel
                                       +opentelemetry-exporter-otlp
                                       +logstash-logback-encoder
    src/main/resources/
      application.properties        ← +prometheus endpoint, +tracing config
      logback-spring.xml            ← structured JSON output
```

---

## Rollout Order

1. **Phase 1** — Add `micrometer-registry-prometheus` + expose `/actuator/prometheus` + bring up Prometheus + Grafana. Zero risk — additive only.
2. **Phase 2** — Swap Logback encoder to JSON. Rebuild services. Logs now parseable by Loki.
3. **Phase 3** — Add tracing deps + OTel config. Rebuild services. Traces appear in Tempo.
4. **Phase 4** — Import Grafana dashboards + wire alert rules.

Each phase is independently deployable. Phases 2–4 require a service rebuild (`mvn package -DskipTests` + `docker compose up -d --build <service>`).

---

## What You Can See After Each Phase

| After Phase | You can answer |
|---|---|
| 1 | Which services are healthy? What is the per-service request rate and error rate? Is the DB pool saturating? |
| 2 | What log lines did this request produce? Which service logged the error? |
| 3 | Which service in the chain added latency? Did the JWT validation or the DB query cause the slowdown? |
| 4 | Are we breaching SLOs? Which test type is slowest to approve? Is the AI anomaly flag rate trending up? |

---

## Access

| URL | Service |
|---|---|
| `http://localhost:3001` | Grafana (admin / `GRAFANA_PASSWORD`) |
| `http://localhost:8888/health` | Nginx health (already exists) |
| `http://<service>:808x/actuator/prometheus` | Raw metrics (internal network only) |
