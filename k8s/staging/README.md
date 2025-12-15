# Kubernetes Manifests - Staging

Manifests de Kubernetes para deployment del API en ambiente staging.

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `namespace.yaml` | Namespace staging |
| `deployment.yaml` | Deployment del API (2 replicas) |
| `service.yaml` | Service ClusterIP |
| `ingress.yaml` | Ingress con ALB |
| `hpa.yaml` | Horizontal Pod Autoscaler |
| `configmap.yaml` | ConfigMap con configuración no sensible |

## 🚀 Deployment

### 1. Crear namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Crear ConfigMap

```bash
kubectl apply -f configmap.yaml
```

### 3. Crear Secrets

**IMPORTANTE:** Los secrets deben crearse manualmente con valores reales.

```bash
# Ver docs/deploy-staging.md, sección "Preparar Secrets en Kubernetes"
kubectl create secret generic app-secrets \
  --namespace=staging \
  --from-literal=DB_HOST=... \
  --from-literal=DB_PASSWORD=... \
  # ... otros secrets
```

### 4. Aplicar Deployment y Service

Antes de aplicar, reemplazar variables:

```bash
export ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
export IMAGE_TAG=$(git rev-parse --short HEAD)
export ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID
export ALB_SECURITY_GROUP_ID=sg-xxxxx

# Reemplazar variables en manifests
envsubst < deployment.yaml | kubectl apply -f -
envsubst < service.yaml | kubectl apply -f -
envsubst < ingress.yaml | kubectl apply -f -
```

### 5. Aplicar HPA

```bash
kubectl apply -f hpa.yaml
```

## 🔍 Verificación

```bash
# Ver todos los recursos
kubectl get all -n staging

# Ver pods
kubectl get pods -n staging

# Ver logs
kubectl logs -f -n staging deployment/pos-venta-api

# Ver eventos
kubectl get events -n staging --sort-by='.lastTimestamp'

# Ver HPA status
kubectl get hpa -n staging

# Describir deployment
kubectl describe deployment pos-venta-api -n staging
```

## 🔄 Actualización

### Cambiar imagen (nuevo deploy)

```bash
export NEW_TAG=abc1234

kubectl set image deployment/pos-venta-api \
  api=$ECR_REGISTRY/pos-venta-api:$NEW_TAG \
  -n staging

kubectl rollout status deployment/pos-venta-api -n staging
```

### Actualizar ConfigMap

```bash
# Editar configmap.yaml
kubectl apply -f configmap.yaml

# Restart deployment para aplicar cambios
kubectl rollout restart deployment/pos-venta-api -n staging
```

### Escalar manualmente

```bash
kubectl scale deployment pos-venta-api --replicas=3 -n staging
```

## 🐛 Troubleshooting

Ver [docs/deploy-staging.md](../../docs/deploy-staging.md#troubleshooting)

## 📚 Referencias

- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [HPA Best Practices](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
