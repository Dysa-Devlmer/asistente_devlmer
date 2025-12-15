# PLAYBOOK: DEPLOYMENT STAGING

**Versión:** 1.0.0
**Fecha:** 2025-01-15
**Ambiente:** Staging
**Autor:** Equipo DevOps/Backend

---

## 📋 TABLA DE CONTENIDOS

1. [Pre-requisitos](#pre-requisitos)
2. [Preparación del Deploy](#preparación-del-deploy)
3. [Proceso de Deployment](#proceso-de-deployment)
4. [Validación Post-Deploy](#validación-post-deploy)
5. [Rollback](#rollback)
6. [Troubleshooting](#troubleshooting)
7. [Checklist](#checklist)

---

## ✅ PRE-REQUISITOS

### Accesos Requeridos

- [ ] **AWS Console:** Acceso con permisos para EKS, RDS, Secrets Manager
- [ ] **AWS CLI:** Configurado con credenciales (`aws sts get-caller-identity`)
- [ ] **kubectl:** Configurado para cluster staging (`kubectl cluster-info`)
- [ ] **Docker:** Para build de imágenes
- [ ] **GitHub:** Push access al repositorio
- [ ] **Slack:** Acceso a canal `#staging-deploys`

### Herramientas Instaladas

```bash
# Verificar versiones
terraform --version    # >= 1.6.0
kubectl version        # >= 1.28
helm version           # >= 3.x
docker --version       # >= 24.x
aws --version          # >= 2.x
```

### Variables de Entorno

```bash
# Configurar variables necesarias
export AWS_REGION=us-east-1
export CLUSTER_NAME=pos-venta-staging
export ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
export IMAGE_TAG=$(git rev-parse --short HEAD)
```

---

## 🔧 PREPARACIÓN DEL DEPLOY

### 1. Verificar Estado de la Infraestructura

```bash
# Verificar cluster EKS está activo
aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.status'
# Esperado: "ACTIVE"

# Verificar nodes disponibles
kubectl get nodes
# Esperado: 2+ nodes en estado Ready

# Verificar RDS disponible
aws rds describe-db-instances \
  --db-instance-identifier pos-venta-staging-db \
  --query 'DBInstances[0].DBInstanceStatus'
# Esperado: "available"

# Verificar Redis disponible
aws elasticache describe-cache-clusters \
  --cache-cluster-id pos-venta-staging-redis \
  --query 'CacheClusters[0].CacheClusterStatus'
# Esperado: "available"
```

### 2. Obtener Endpoints de Infraestructura

```bash
# PostgreSQL Primary
export DB_HOST=$(terraform output -raw rds_primary_endpoint | cut -d: -f1)
echo "DB_HOST: $DB_HOST"

# Redis
export REDIS_HOST=$(terraform output -raw redis_endpoint)
echo "REDIS_HOST: $REDIS_HOST"

# Verificar conectividad desde un pod temporal
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h $DB_HOST -U postgres -d pos_venta -c "SELECT version();"
```

### 3. Preparar Secrets en Kubernetes

```bash
# Obtener password de RDS desde Secrets Manager
export DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id pos-venta/staging/rds/password \
  --query 'SecretString' --output text)

# Obtener JWT secret
export JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id pos-venta/staging/jwt-secret \
  --query 'SecretString' --output text)

# Crear namespace staging (si no existe)
kubectl create namespace staging --dry-run=client -o yaml | kubectl apply -f -

# Crear secret en K8s
kubectl create secret generic app-secrets \
  --namespace=staging \
  --from-literal=DB_HOST=$DB_HOST \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=pos_venta \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=$DB_PASSWORD \
  --from-literal=REDIS_HOST=$REDIS_HOST \
  --from-literal=REDIS_PORT=6379 \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --dry-run=client -o yaml | kubectl apply -f -

# Verificar secret creado
kubectl get secret app-secrets -n staging
```

### 4. Ejecutar Migraciones de Base de Datos

```bash
# Conectar a RDS y ejecutar migraciones
kubectl run -it --rm db-migrate \
  --image=$ECR_REGISTRY/pos-venta-api:$IMAGE_TAG \
  --namespace=staging \
  --env="DB_HOST=$DB_HOST" \
  --env="DB_PASSWORD=$DB_PASSWORD" \
  --restart=Never \
  -- npm run migration:run

# Verificar migraciones aplicadas
kubectl logs db-migrate -n staging
```

**Checklist Migraciones:**
- [ ] Sin errores en logs
- [ ] Tabla `migrations` actualizada
- [ ] Tablas nuevas creadas (si aplica)

---

## 🚀 PROCESO DE DEPLOYMENT

### Paso 1: Build de Imagen Docker

```bash
# Navegar al directorio backend
cd backend

# Build de imagen
docker build \
  -t $ECR_REGISTRY/pos-venta-api:$IMAGE_TAG \
  -t $ECR_REGISTRY/pos-venta-api:latest \
  --build-arg NODE_ENV=staging \
  .

# Verificar imagen creada
docker images | grep pos-venta-api
```

### Paso 2: Push a ECR

```bash
# Login a ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Push con tag de commit
docker push $ECR_REGISTRY/pos-venta-api:$IMAGE_TAG

# Push tag latest
docker push $ECR_REGISTRY/pos-venta-api:latest

# Verificar imagen en ECR
aws ecr describe-images \
  --repository-name pos-venta-api \
  --image-ids imageTag=$IMAGE_TAG
```

### Paso 3: Deploy a Kubernetes

#### 3.1. Crear/Actualizar Deployment

```bash
# Aplicar deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pos-venta-api
  namespace: staging
  labels:
    app: pos-venta-api
    environment: staging
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: pos-venta-api
  template:
    metadata:
      labels:
        app: pos-venta-api
        version: $IMAGE_TAG
    spec:
      containers:
      - name: api
        image: $ECR_REGISTRY/pos-venta-api:$IMAGE_TAG
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "staging"
        - name: PORT
          value: "3000"
        envFrom:
        - secretRef:
            name: app-secrets
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
EOF
```

#### 3.2. Crear Service

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: pos-venta-api
  namespace: staging
  labels:
    app: pos-venta-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: pos-venta-api
EOF
```

#### 3.3. Crear Ingress (ALB)

```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pos-venta-api
  namespace: staging
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  rules:
  - host: staging-api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pos-venta-api
            port:
              number: 80
EOF
```

### Paso 4: Monitorear Rollout

```bash
# Ver status del deployment
kubectl rollout status deployment/pos-venta-api -n staging

# Esperado: "deployment "pos-venta-api" successfully rolled out"

# Verificar pods
kubectl get pods -n staging -l app=pos-venta-api

# Ver logs en tiempo real
kubectl logs -f -n staging -l app=pos-venta-api --tail=50

# Verificar eventos
kubectl get events -n staging --sort-by='.lastTimestamp' | grep pos-venta-api
```

**Checklist Rollout:**
- [ ] 2/2 pods en estado `Running`
- [ ] Readiness checks pasando (1/1 READY)
- [ ] Sin errores en logs
- [ ] Sin eventos de tipo `Warning`

### Paso 5: Configurar HPA (Horizontal Pod Autoscaler)

```bash
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pos-venta-api-hpa
  namespace: staging
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pos-venta-api
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF

# Verificar HPA
kubectl get hpa -n staging
```

---

## ✅ VALIDACIÓN POST-DEPLOY

### 1. Health Checks

```bash
# Obtener ALB URL
export ALB_URL=$(kubectl get ingress pos-venta-api -n staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB URL: https://$ALB_URL"

# Health check
curl -f https://staging-api.example.com/health
# Esperado: {"status":"ok","timestamp":"..."}

# Readiness check
curl -f https://staging-api.example.com/ready
# Esperado: {"status":"ready","database":"connected","redis":"connected"}
```

### 2. Smoke Tests (Endpoints Críticos)

```bash
# Test endpoint bootstrap/meta
curl -X GET "https://staging-api.example.com/api/bootstrap/meta?sucursal_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

# Esperado: 200 OK con JSON response

# Test endpoint sync/health (Fase 1)
curl -X GET "https://staging-api.example.com/api/sync/health" \
  -w "\nHTTP Status: %{http_code}\n"

# Esperado: 200 OK
```

### 3. Verificar Conectividad Database

```bash
# Ejecutar query de prueba desde pod
kubectl exec -it -n staging deployment/pos-venta-api -- \
  psql -h $DB_HOST -U postgres -d pos_venta -c "SELECT COUNT(*) FROM sucursal;"

# Esperado: Resultado sin errores
```

### 4. Verificar Conectividad Redis

```bash
# Test desde pod
kubectl exec -it -n staging deployment/pos-venta-api -- \
  redis-cli -h $REDIS_HOST PING

# Esperado: PONG
```

### 5. Verificar Logs (Sin Errores)

```bash
# Últimos 100 logs
kubectl logs -n staging deployment/pos-venta-api --tail=100 | grep -i error

# Esperado: Sin errores críticos
```

### 6. Verificar Métricas en Prometheus

```bash
# Port-forward a Prometheus
kubectl port-forward -n monitoring svc/prometheus-server 9090:80 &

# Abrir browser: http://localhost:9090

# Queries de validación:
# - up{job="pos-venta-api"} → Debe ser 1 (up)
# - http_requests_total{app="pos-venta-api"} → Debe estar incrementando
# - process_resident_memory_bytes{app="pos-venta-api"} → < 1GB
```

### 7. Verificar Alertas (Grafana)

```bash
# Port-forward a Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80 &

# Abrir browser: http://localhost:3000
# User: admin / Pass: (ver secret)

# Verificar:
# - Sin alertas activas (firing)
# - Dashboard "Application Performance" mostrando tráfico
```

---

## 🔄 ROLLBACK

### Escenarios de Rollback

**Triggers para rollback:**
- Error rate > 10% por 5 minutos
- Pods en `CrashLoopBackOff`
- Health checks fallando
- Bug crítico detectado

### Rollback Automático (Kubernetes)

```bash
# Ver historial de deployments
kubectl rollout history deployment/pos-venta-api -n staging

# Rollback a versión anterior
kubectl rollout undo deployment/pos-venta-api -n staging

# Rollback a revisión específica
kubectl rollout undo deployment/pos-venta-api -n staging --to-revision=3

# Monitorear rollback
kubectl rollout status deployment/pos-venta-api -n staging
```

### Rollback Manual (Image Tag)

```bash
# Identificar imagen anterior
export PREVIOUS_TAG=abc1234

# Actualizar deployment
kubectl set image deployment/pos-venta-api \
  api=$ECR_REGISTRY/pos-venta-api:$PREVIOUS_TAG \
  -n staging

# Verificar rollout
kubectl rollout status deployment/pos-venta-api -n staging
```

### Rollback de Migraciones

```bash
# Si migraciones fallan, revertir manualmente
kubectl run -it --rm db-rollback \
  --image=$ECR_REGISTRY/pos-venta-api:$PREVIOUS_TAG \
  --namespace=staging \
  --env="DB_HOST=$DB_HOST" \
  --env="DB_PASSWORD=$DB_PASSWORD" \
  --restart=Never \
  -- npm run migration:revert

# Verificar estado
psql -h $DB_HOST -U postgres -d pos_venta -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
```

---

## 🐛 TROUBLESHOOTING

### Problema: Pods en `CrashLoopBackOff`

**Diagnóstico:**
```bash
kubectl describe pod <pod-name> -n staging
kubectl logs <pod-name> -n staging --previous
```

**Causas comunes:**
- DB_PASSWORD incorrecto → Verificar secret
- DB no accesible → Verificar security group
- Error en código → Revisar logs de aplicación

**Solución:**
```bash
# Recrear secret con valores correctos
kubectl delete secret app-secrets -n staging
# Recrear con valores correctos (ver paso Preparación)

# Restart deployment
kubectl rollout restart deployment/pos-venta-api -n staging
```

### Problema: Readiness Probe Failing

**Diagnóstico:**
```bash
kubectl get pods -n staging
# Verifica columna READY: 0/1 indica fallo

kubectl logs <pod-name> -n staging | grep ready
```

**Causas comunes:**
- Endpoint `/ready` retornando 500
- Database no conectada
- Redis no accesible

**Solución:**
```bash
# Verificar conectividad desde pod
kubectl exec -it <pod-name> -n staging -- sh
# Dentro del pod:
nc -zv $DB_HOST 5432
nc -zv $REDIS_HOST 6379
```

### Problema: ALB 502 Bad Gateway

**Diagnóstico:**
```bash
# Verificar target group health
aws elbv2 describe-target-health \
  --target-group-arn <arn-from-alb>

# Verificar logs de ALB
aws logs tail /aws/elasticloadbalancing/app/pos-venta-staging --follow
```

**Causas comunes:**
- Pods no healthy
- Security group bloqueando tráfico
- Timeout muy bajo

**Solución:**
```bash
# Verificar security group permite tráfico desde ALB
aws ec2 describe-security-groups --group-ids <sg-id>

# Aumentar timeout en ingress annotation
alb.ingress.kubernetes.io/target-group-attributes: idle_timeout.timeout_seconds=120
```

### Problema: Alta Latencia (> 1s)

**Diagnóstico:**
```bash
# Verificar métricas en Prometheus
http_request_duration_seconds_sum / http_request_duration_seconds_count

# Verificar slow queries en PostgreSQL
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solución:**
- Añadir índices faltantes
- Optimizar queries
- Escalar horizontalmente (aumentar replicas)

---

## 📋 CHECKLIST DE DEPLOYMENT

### Pre-Deploy
- [ ] Terraform apply completado sin errores
- [ ] EKS cluster activo
- [ ] RDS disponible
- [ ] Redis disponible
- [ ] Secrets creados en Kubernetes
- [ ] Migraciones ejecutadas exitosamente

### Durante Deploy
- [ ] Imagen Docker buildeada
- [ ] Imagen pusheada a ECR
- [ ] Deployment aplicado
- [ ] Service creado
- [ ] Ingress configurado
- [ ] HPA configurado
- [ ] Rollout completado (2/2 pods Running)

### Post-Deploy
- [ ] Health check respondiendo 200
- [ ] Readiness check respondiendo 200
- [ ] Smoke tests pasando
- [ ] Database conectada
- [ ] Redis conectado
- [ ] Sin errores en logs
- [ ] Métricas en Prometheus actualizándose
- [ ] Sin alertas activas en Grafana
- [ ] Documentación actualizada

### Notificaciones
- [ ] Mensaje en Slack #staging-deploys
- [ ] Actualizar CHANGELOG.md
- [ ] Tag en Git (`git tag staging-v1.0.0`)
- [ ] Notificar a QA para testing

---

## 📞 CONTACTOS Y ESCALACIÓN

### Equipo
- **Backend Lead:** Juan Pérez (@juan.perez)
- **DevOps:** María González (@maria.gonzalez)
- **On-Call:** Ver PagerDuty schedule

### Escalación
1. **Nivel 1:** Desarrollador que hizo deploy
2. **Nivel 2:** Backend Lead
3. **Nivel 3:** CTO

### Canales Slack
- `#staging-deploys` - Notificaciones de deploys
- `#staging-alerts` - Alertas automáticas
- `#incidents` - Incidents críticos

---

## 📚 REFERENCIAS

- [Documentación Terraform](./INFRA-STAGING-PLAN.md)
- [Documentación Bootstrap API](./ITERACION2-BOOTSTRAP-CATALOGO.md)
- [Kubernetes Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)

---

**Fin del Playbook**
**Versión:** 1.0.0
**Última actualización:** 2025-01-15
