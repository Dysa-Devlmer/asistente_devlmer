# Terraform - Staging Environment

Infrastructure as Code para el ambiente de staging del sistema POS Venta.

## 📋 Requisitos Previos

### Herramientas Necesarias
- [Terraform](https://www.terraform.io/downloads) >= 1.6.0
- [AWS CLI](https://aws.amazon.com/cli/) >= 2.0
- [kubectl](https://kubernetes.io/docs/tasks/tools/) >= 1.28
- [helm](https://helm.sh/docs/intro/install/) >= 3.x

### Credenciales AWS
```bash
aws configure
# AWS Access Key ID: [TU_ACCESS_KEY]
# AWS Secret Access Key: [TU_SECRET_KEY]
# Default region: us-east-1
# Default output format: json
```

Verificar acceso:
```bash
aws sts get-caller-identity
```

## 🚀 Uso

### 1. Inicialización

```bash
cd terraform/staging

# Copiar variables de ejemplo
cp terraform.tfvars.example terraform.tfvars

# Editar terraform.tfvars con valores reales
nano terraform.tfvars

# Inicializar Terraform
terraform init
```

### 2. Planificación

```bash
# Ver qué recursos se crearán
terraform plan

# Guardar plan para revisión
terraform plan -out=tfplan
```

### 3. Aplicación

```bash
# Aplicar cambios (requiere confirmación)
terraform apply

# O aplicar plan guardado
terraform apply tfplan
```

**Tiempo estimado:** 15-20 minutos (EKS toma más tiempo)

### 4. Configurar kubectl

```bash
# Obtener comando de configuración desde outputs
terraform output configure_kubectl

# Ejecutar (ejemplo):
aws eks update-kubeconfig --name pos-venta-staging --region us-east-1

# Verificar acceso
kubectl get nodes
```

## 📦 Recursos Creados

Este Terraform crea los siguientes recursos:

### Networking
- ✅ VPC (10.0.0.0/16)
- ✅ 2 Subnets públicas
- ✅ 2 Subnets privadas
- ✅ 2 Subnets de base de datos
- ✅ NAT Gateway
- ✅ Internet Gateway
- ✅ Route Tables

### Kubernetes
- ✅ EKS Cluster (control plane)
- ✅ Node Group (2-4 nodes t3.medium)
- ✅ Security Groups

### Database
- ✅ RDS PostgreSQL Primary (db.t3.medium, 100 GB)
- ✅ RDS Read Replica
- ✅ Automated backups (7 días)
- ✅ Performance Insights

### Cache
- ✅ ElastiCache Redis (cache.t3.micro)
- ✅ Subnet Group
- ✅ Security Group

### Secrets
- ✅ JWT Secret (auto-generado)
- ✅ DB Connection details
- ✅ Secrets Manager secrets

## 🔍 Outputs Importantes

```bash
# Ver todos los outputs
terraform output

# Outputs específicos
terraform output eks_cluster_endpoint
terraform output rds_primary_endpoint
terraform output redis_endpoint
```

## 🛠️ Comandos Útiles

### Verificar estado
```bash
terraform show
terraform state list
```

### Actualizar infraestructura
```bash
# Editar variables en terraform.tfvars
terraform plan
terraform apply
```

### Destruir infraestructura
```bash
# ⚠️ CUIDADO: Elimina TODOS los recursos
terraform destroy
```

### Importar recursos existentes
```bash
terraform import <resource_type>.<name> <resource_id>
```

## 📝 Estructura de Archivos

```
terraform/staging/
├── main.tf                    # Recursos principales
├── variables.tf               # Definición de variables
├── terraform.tfvars.example   # Ejemplo de valores
├── terraform.tfvars           # Valores reales (no versionado)
├── .gitignore                 # Archivos ignorados
└── README.md                  # Esta documentación
```

## 🔐 Seguridad

### Archivos Sensibles
- `terraform.tfvars` → **NO VERSIONAR** (contiene valores reales)
- `*.tfstate` → **NO VERSIONAR** (contiene datos sensibles)
- Usar **backend remoto S3** para state en equipo

### Backend Remoto (Recomendado)

1. Crear bucket S3 para state:
```bash
aws s3api create-bucket \
  --bucket pos-venta-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket pos-venta-terraform-state \
  --versioning-configuration Status=Enabled
```

2. Crear tabla DynamoDB para lock:
```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

3. Descomentar bloque `backend` en `main.tf`:
```hcl
backend "s3" {
  bucket         = "pos-venta-terraform-state"
  key            = "staging/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"
}
```

4. Migrar state:
```bash
terraform init -migrate-state
```

## 💰 Costos

**Estimado mensual:** ~$373 USD

Desglose:
- EKS Control Plane: $73
- EC2 Nodes (2x t3.medium): $60
- RDS Primary: $65
- RDS Replica: $65
- Redis: $13
- ALB: $23
- Storage/Network: ~$70

### Optimizaciones
- Usar Spot instances para nodes (-50%)
- Apagar staging en noches/fines de semana (-40%)
- Reserved instances para RDS (-30%)

## 🐛 Troubleshooting

### Error: Cluster already exists
```bash
# Verificar clusters existentes
aws eks list-clusters

# Si existe, importar:
terraform import module.eks.aws_eks_cluster.this pos-venta-staging
```

### Error: Insufficient capacity
```bash
# Cambiar región o AZ en terraform.tfvars
aws_region = "us-west-2"
```

### Error: State lock
```bash
# Si el plan falló, eliminar lock manualmente
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID": {"S": "pos-venta-terraform-state/staging/terraform.tfstate"}}'
```

## 📚 Referencias

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest)
- [VPC Module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest)
- [RDS Module](https://registry.terraform.io/modules/terraform-aws-modules/rds/aws/latest)

## 🤝 Contribuciones

Para modificar la infraestructura:

1. Crear branch: `git checkout -b infra/descripcion`
2. Modificar Terraform files
3. Ejecutar `terraform plan` y revisar cambios
4. Commit y push
5. Crear PR para revisión
6. Después de aprobación: `terraform apply`

---

**Última actualización:** 2025-01-15
**Versión Terraform:** 1.6.0
