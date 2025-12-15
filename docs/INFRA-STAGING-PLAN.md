# PLAN DE INFRAESTRUCTURA - STAGING ENVIRONMENT

**Versión:** 1.0.0
**Fecha:** 2025-01-15
**Estado:** Plan Técnico
**Autor:** Equipo DevOps/Backend

---

## 📋 TABLA DE CONTENIDOS

1. [Objetivos](#objetivos)
2. [Arquitectura General](#arquitectura-general)
3. [Componentes de Infraestructura](#componentes-de-infraestructura)
4. [Especificaciones Técnicas](#especificaciones-técnicas)
5. [Networking y Seguridad](#networking-y-seguridad)
6. [Observabilidad](#observabilidad)
7. [Costos Estimados](#costos-estimados)
8. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 🎯 OBJETIVOS

### Propósito del Ambiente Staging
- **Espejo de producción:** Replicar arquitectura de producción a menor escala
- **Testing pre-release:** Validar features antes de deploy a producción
- **Performance testing:** Pruebas de carga y stress
- **Disaster recovery drills:** Practicar procedimientos de recuperación

### Requerimientos No Funcionales
- ✅ **Disponibilidad:** 95% uptime (no crítico 24/7)
- ✅ **Escalabilidad:** Horizontal (app) y Vertical (DB)
- ✅ **Observabilidad:** Logs, métricas, traces, alertas
- ✅ **Seguridad:** TLS, secrets management, network isolation
- ✅ **Backup:** Diario, retención 7 días

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGING ENVIRONMENT                       │
│                  (Cloud Provider: AWS/GCP)                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                          INTERNET                             │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│              Load Balancer (ALB/GLB)                        │
│              - TLS Termination                              │
│              - Health Checks                                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│                 Kubernetes Cluster (EKS/GKE)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Application Pods (2 replicas)           │  │
│  │  ┌──────────┐              ┌──────────┐             │  │
│  │  │ NestJS   │              │ NestJS   │             │  │
│  │  │ API      │              │ API      │             │  │
│  │  │ Pod 1    │              │ Pod 2    │             │  │
│  │  └────┬─────┘              └────┬─────┘             │  │
│  └───────┼──────────────────────────┼──────────────────┘  │
│          │                          │                      │
│          └──────────┬───────────────┘                      │
│                     │                                      │
│  ┌──────────────────▼────────────────────────────────┐    │
│  │          Redis Cache (1 instance)                  │    │
│  │          - Session storage                         │    │
│  │          - Rate limiting                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│              Managed PostgreSQL (RDS/CloudSQL)              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Primary         │─ ─ ─ ─ ▶│  Read Replica    │         │
│  │  (Write/Read)    │ Async   │  (Read-only)     │         │
│  │  db.t3.medium    │ Replica │  db.t3.medium    │         │
│  └──────────────────┘         └──────────────────┘         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                 OBSERVABILITY STACK                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐      │
│  │ Prometheus   │  │   Grafana    │  │    Loki     │      │
│  │ (Metrics)    │─▶│ (Dashboards) │◀─│   (Logs)    │      │
│  └──────────────┘  └──────────────┘  └─────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Sentry (Error Tracking)                   │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

---

## 🧱 COMPONENTES DE INFRAESTRUCTURA

### 1. Kubernetes Cluster

**Proveedor:** AWS EKS / GCP GKE

**Especificaciones:**
- **Nodes:** 2 worker nodes (t3.medium / e2-standard-2)
- **Auto-scaling:** Min 2, Max 4 nodes
- **Network:** VPC con subnets privadas
- **Version:** Kubernetes 1.28+

**Namespace Strategy:**
```yaml
# staging namespace
apiVersion: v1
kind: Namespace
metadata:
  name: staging
  labels:
    environment: staging
    team: backend
```

### 2. Application Deployment

**Replicas:** 2 pods (HA mínimo)

**Resources:**
```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

**Health Checks:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

**Auto-scaling (HPA):**
```yaml
minReplicas: 2
maxReplicas: 5
metrics:
  - type: Resource
    resource:
      name: cpu
      targetAverageUtilization: 70
```

### 3. Managed PostgreSQL

**Proveedor:** AWS RDS / GCP Cloud SQL

**Primary Instance:**
- **Tipo:** db.t3.medium (2 vCPU, 4 GB RAM)
- **Storage:** 100 GB SSD (gp3)
- **IOPS:** 3000 (baseline)
- **Multi-AZ:** No (staging, single AZ ok)
- **Version:** PostgreSQL 15.x

**Read Replica:**
- **Tipo:** db.t3.medium
- **Replication:** Async
- **Lag Target:** < 5 segundos
- **Purpose:** Offload queries de lectura (reportes, analytics)

**Backup:**
- **Automated Backups:** Diario a las 03:00 UTC
- **Retention:** 7 días
- **Point-in-Time Recovery:** Habilitado
- **Snapshots:** Manual antes de cada deploy

**Connection Pooling:**
- **PgBouncer:** Desplegado como sidecar en pods
- **Max Connections:** 100 (db) / 300 (pooler)

### 4. Redis Cache

**Proveedor:** AWS ElastiCache / GCP Memorystore

**Especificaciones:**
- **Tipo:** cache.t3.micro (0.5 GB)
- **Modo:** Standalone (no cluster en staging)
- **Persistence:** RDB snapshots cada 6 horas
- **Eviction Policy:** allkeys-lru

**Uso:**
- Session storage (JWT tokens)
- Rate limiting (redis-rate-limit)
- Cache de catálogos (TTL 5 min)

### 5. Load Balancer

**Proveedor:** AWS ALB / GCP HTTPS Load Balancer

**Configuración:**
- **Scheme:** Internet-facing
- **Protocol:** HTTPS (443)
- **TLS Certificate:** AWS ACM / Google-managed SSL
- **Health Check:** GET /health (200 OK)
- **Timeout:** 60 segundos
- **Sticky Sessions:** Habilitado (cookie-based)

**Security:**
- **Security Group:** Solo 443 desde 0.0.0.0/0
- **WAF:** Básico (rate limiting, SQL injection protection)

---

## 🔐 NETWORKING Y SEGURIDAD

### VPC Architecture

```
┌──────────────────────────────────────────────────┐
│              VPC: 10.0.0.0/16                     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │   Public Subnets (10.0.1.0/24)          │     │
│  │   - Load Balancer                       │     │
│  │   - NAT Gateway                         │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │   Private Subnets (10.0.10.0/24)        │     │
│  │   - Kubernetes Nodes                    │     │
│  │   - Application Pods                    │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │   Database Subnets (10.0.20.0/24)       │     │
│  │   - PostgreSQL Primary                  │     │
│  │   - PostgreSQL Replica                  │     │
│  │   - Redis                               │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

### Security Groups

**ALB Security Group:**
```hcl
ingress {
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

egress {
  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
}
```

**Application Security Group:**
```hcl
ingress {
  from_port       = 3000
  to_port         = 3000
  protocol        = "tcp"
  security_groups = [alb_sg_id]
}

ingress {
  from_port   = 3000
  to_port     = 3000
  protocol    = "tcp"
  cidr_blocks = ["10.0.0.0/16"] # Bastion access
}
```

**Database Security Group:**
```hcl
ingress {
  from_port       = 5432
  to_port         = 5432
  protocol        = "tcp"
  security_groups = [app_sg_id]
}
```

### Secrets Management

**Proveedor:** AWS Secrets Manager / GCP Secret Manager

**Secrets Almacenados:**
- `staging/db/credentials` → PostgreSQL user/password
- `staging/redis/auth-token` → Redis AUTH token
- `staging/app/jwt-secret` → JWT signing key
- `staging/sentry/dsn` → Sentry DSN

**Rotación:**
- DB credentials: Manual (staging, no auto-rotation)
- JWT secret: Cada 90 días

**Acceso desde K8s:**
- **External Secrets Operator:** Sync secrets a Kubernetes Secrets
- **IAM Roles for Service Accounts (IRSA):** Pods asumen rol IAM

### TLS/SSL

**Certificado:** AWS ACM / Google-managed
**Dominio:** `staging-api.example.com`
**Protocol:** TLS 1.2+ only
**Cipher Suites:** Modern (TLS_AES_128_GCM_SHA256, etc.)

---

## 📊 OBSERVABILIDAD

### 1. Prometheus (Métricas)

**Deployment:** Helm chart `prometheus-community/kube-prometheus-stack`

**Métricas Recolectadas:**
- **Node Exporter:** CPU, memoria, disco, network
- **Kube State Metrics:** Pods, deployments, services
- **Application Metrics:** Custom NestJS metrics (Prometheus client)
  - `http_requests_total`
  - `http_request_duration_seconds`
  - `db_query_duration_seconds`
  - `cache_hits_total` / `cache_misses_total`

**Retention:** 15 días

**Storage:** 50 GB Persistent Volume

### 2. Grafana (Dashboards)

**Dashboards Pre-configurados:**
- **Node Overview:** CPU, RAM, disco por node
- **Kubernetes Cluster:** Pods status, resource usage
- **Application Performance:**
  - Request rate (RPS)
  - Latency (p50, p95, p99)
  - Error rate (%)
  - Database connection pool
- **PostgreSQL:** Connections, queries/sec, cache hit ratio
- **Redis:** Memory usage, operations/sec, evictions

**Alertas:**
- CPU > 80% por 5 min
- Memory > 90% por 5 min
- Error rate > 5% por 2 min
- Database connections > 80

### 3. Loki (Logs Centralizados)

**Deployment:** Helm chart `grafana/loki-stack`

**Log Sources:**
- **Application logs:** JSON structured (Winston/Pino)
- **Nginx Ingress logs:** Access + error logs
- **PostgreSQL logs:** Slow queries (> 1s)
- **Kubernetes events:** Pod crashes, OOMKills

**Retention:** 7 días

**Storage:** 100 GB Persistent Volume

**Query Examples:**
```logql
# Errores en última hora
{namespace="staging", app="api"} |= "ERROR" | json

# Slow queries
{job="postgres"} | json | duration > 1s

# 5xx errors
{app="api"} | json | status >= 500
```

### 4. Sentry (Error Tracking)

**Plan:** Developer (hasta 5K eventos/mes)

**Configuración:**
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'staging',
  tracesSampleRate: 0.1, // 10% de requests
  integrations: [
    new ProfilingIntegration(),
  ],
});
```

**Alertas:**
- Nuevo tipo de error → Slack #staging-alerts
- Error rate > 10/min → Email a equipo

**Features Habilitados:**
- **Performance Monitoring:** Transactions, spans
- **Release Tracking:** Asociar errores a git commits
- **Source Maps:** Stack traces con código original

### 5. Distributed Tracing (Opcional - Jaeger)

**Si se requiere debugging avanzado:**
- Deployment: Jaeger all-in-one
- Sampling: 10% de requests
- Integración: OpenTelemetry SDK en NestJS

---

## 💰 COSTOS ESTIMADOS

### AWS (us-east-1)

| Componente | Spec | Costo Mensual (USD) |
|------------|------|---------------------|
| EKS Cluster | Control plane | $73 |
| EC2 Nodes | 2x t3.medium | $60 |
| RDS PostgreSQL Primary | db.t3.medium | $65 |
| RDS Read Replica | db.t3.medium | $65 |
| ElastiCache Redis | cache.t3.micro | $13 |
| ALB | 1 load balancer | $23 |
| EBS Volumes | 250 GB total | $25 |
| Data Transfer | 500 GB/month | $45 |
| Secrets Manager | 10 secrets | $4 |
| **TOTAL** | | **~$373/mes** |

### GCP (us-central1)

| Componente | Spec | Costo Mensual (USD) |
|------------|------|---------------------|
| GKE Cluster | Control plane | $73 |
| Compute Nodes | 2x e2-standard-2 | $50 |
| Cloud SQL Primary | db-standard-2 | $80 |
| Cloud SQL Replica | db-standard-2 | $80 |
| Memorystore Redis | M1 (1 GB) | $45 |
| HTTPS Load Balancer | 1 LB | $18 |
| Persistent Disks | 250 GB | $40 |
| Network Egress | 500 GB/month | $50 |
| Secret Manager | 10 secrets | $2 |
| **TOTAL** | | **~$438/mes** |

### Servicios SaaS

| Servicio | Plan | Costo Mensual (USD) |
|----------|------|---------------------|
| Sentry | Developer | $26 |
| (Opcional) Datadog | Pro | $15/host = $30 |
| **TOTAL** | | **$26 - $56** |

### **TOTAL ESTIMADO: $400 - $500/mes**

### Optimizaciones Posibles
- Spot instances para workers (-50% en compute)
- Reserved instances (-30% en RDS/Redis)
- Staging apagado en noches/fines de semana (-40% uptime)
- **Con optimizaciones: ~$250/mes**

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Base Infrastructure (Semana 1)

**Día 1-2:**
- [x] Crear VPC y subnets
- [x] Configurar security groups
- [x] Aprovisionar EKS/GKE cluster
- [x] Configurar kubectl access

**Día 3-4:**
- [x] Aprovisionar RDS PostgreSQL (primary)
- [x] Configurar backup automation
- [x] Crear read replica
- [x] Aprovisionar Redis

**Día 5:**
- [x] Configurar ALB/GLB
- [x] Crear TLS certificate
- [x] Configurar DNS (staging-api.example.com)

### Fase 2: Application Deployment (Semana 2)

**Día 1-2:**
- [x] Crear Dockerfile optimizado
- [x] Build y push imagen a ECR/GCR
- [x] Crear Kubernetes manifests (Deployment, Service, Ingress)
- [x] Configurar secrets (External Secrets Operator)

**Día 3-4:**
- [x] Deploy aplicación (2 replicas)
- [x] Configurar HPA
- [x] Validar health checks
- [x] Smoke tests

**Día 5:**
- [x] Configurar CI/CD pipeline (GitHub Actions)
- [x] Automated deploy on merge to `develop`

### Fase 3: Observability (Semana 3)

**Día 1-2:**
- [x] Deploy Prometheus + Grafana (Helm)
- [x] Configurar dashboards básicos
- [x] Configurar alertas iniciales

**Día 3:**
- [x] Deploy Loki + Promtail
- [x] Configurar log aggregation
- [x] Crear queries comunes en Grafana

**Día 4:**
- [x] Integrar Sentry
- [x] Configurar alertas a Slack
- [x] Validar error tracking

**Día 5:**
- [x] Documentación runbooks
- [x] Training a equipo

### Fase 4: Hardening & Testing (Semana 4)

**Día 1-2:**
- [x] Performance testing (k6/Artillery)
- [x] Load testing (100 RPS sustained)
- [x] Identificar bottlenecks

**Día 3:**
- [x] Disaster recovery drill (restore desde backup)
- [x] Validar RTO/RPO

**Día 4:**
- [x] Security audit (scan de vulnerabilidades)
- [x] Configurar WAF rules
- [x] Penetration testing básico

**Día 5:**
- [x] Ajustes finales
- [x] Handoff a equipo
- [x] Go-live staging

---

## 🔧 HERRAMIENTAS Y TECNOLOGÍAS

### Infrastructure as Code
- **Terraform** 1.6+ (main IaC tool)
- **Helm** 3.x (Kubernetes package manager)
- **Kustomize** (K8s manifest management)

### CI/CD
- **GitHub Actions** (pipelines)
- **Docker** (containerization)
- **ECR/GCR** (container registry)

### Monitoring Stack
- **Prometheus** (metrics collection)
- **Grafana** (visualization)
- **Loki** (log aggregation)
- **Sentry** (error tracking)

### Secrets Management
- **AWS Secrets Manager** / **GCP Secret Manager**
- **External Secrets Operator** (K8s integration)

### Database
- **PostgreSQL** 15.x
- **PgBouncer** (connection pooling)
- **pg_stat_statements** (query analysis)

---

## 📚 REFERENCIAS

- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [GCP GKE Best Practices](https://cloud.google.com/kubernetes-engine/docs/best-practices)
- [12-Factor App](https://12factor.net/)
- [PostgreSQL High Availability](https://www.postgresql.org/docs/current/high-availability.html)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

---

**Fin del documento**
**Versión:** 1.0.0
**Última actualización:** 2025-01-15
