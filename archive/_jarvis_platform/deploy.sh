#!/bin/bash

# ============================================
# JARVIS Enterprise Deployment Script
# Automated deployment with rollback capability
# ============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
NAMESPACE="jarvis-${ENVIRONMENT}"
DEPLOYMENT_NAME="jarvis-backend"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=10

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    commands=("kubectl" "docker" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done

    log_success "All prerequisites met"
}

run_tests() {
    log_info "Running tests..."

    npm test || {
        log_error "Tests failed"
        exit 1
    }

    log_success "Tests passed"
}

build_docker_images() {
    log_info "Building Docker images..."

    # Build backend
    docker build -t "jarvis-backend:${VERSION}" -f Dockerfile.backend .

    # Build frontend
    docker build -t "jarvis-frontend:${VERSION}" -f web-interface/frontend/Dockerfile web-interface/frontend

    log_success "Docker images built successfully"
}

push_docker_images() {
    log_info "Pushing Docker images to registry..."

    REGISTRY="${DOCKER_REGISTRY:-ghcr.io/yourorg}"

    docker tag "jarvis-backend:${VERSION}" "${REGISTRY}/jarvis-backend:${VERSION}"
    docker tag "jarvis-frontend:${VERSION}" "${REGISTRY}/jarvis-frontend:${VERSION}"

    docker push "${REGISTRY}/jarvis-backend:${VERSION}"
    docker push "${REGISTRY}/jarvis-frontend:${VERSION}"

    log_success "Images pushed to registry"
}

deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes (${ENVIRONMENT})..."

    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Apply Kubernetes manifests
    kubectl apply -f k8s/deployment.yml -n $NAMESPACE

    # Update image
    kubectl set image deployment/${DEPLOYMENT_NAME} \
        backend=${REGISTRY}/jarvis-backend:${VERSION} \
        -n $NAMESPACE

    log_success "Deployment initiated"
}

wait_for_rollout() {
    log_info "Waiting for rollout to complete..."

    kubectl rollout status deployment/${DEPLOYMENT_NAME} -n $NAMESPACE --timeout=5m || {
        log_error "Rollout failed or timed out"
        return 1
    }

    log_success "Rollout completed"
}

health_check() {
    log_info "Performing health checks..."

    local retries=$HEALTH_CHECK_RETRIES
    local delay=$HEALTH_CHECK_DELAY

    while [ $retries -gt 0 ]; do
        if curl -f "https://${ENVIRONMENT}.jarvis.example.com/health" &> /dev/null; then
            log_success "Health check passed"
            return 0
        fi

        log_warning "Health check failed, retrying in ${delay}s... (${retries} retries left)"
        sleep $delay
        ((retries--))
    done

    log_error "Health check failed after all retries"
    return 1
}

smoke_tests() {
    log_info "Running smoke tests..."

    # Test API endpoints
    endpoints=(
        "/health"
        "/api/dashboard"
        "/api/status"
    )

    for endpoint in "${endpoints[@]}"; do
        if ! curl -f "https://${ENVIRONMENT}.jarvis.example.com${endpoint}" &> /dev/null; then
            log_error "Smoke test failed for ${endpoint}"
            return 1
        fi
    done

    log_success "Smoke tests passed"
}

rollback() {
    log_warning "Initiating rollback..."

    kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n $NAMESPACE

    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/${DEPLOYMENT_NAME} -n $NAMESPACE

    log_success "Rollback completed"
}

send_notification() {
    local status=$1
    local message=$2

    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 JARVIS Deployment: ${status}\\n${message}\"}" \
            "$SLACK_WEBHOOK"
    fi
}

cleanup() {
    log_info "Cleaning up old resources..."

    # Delete old replica sets
    kubectl delete rs -l app=jarvis -n $NAMESPACE \
        --field-selector=status.replicas=0 &> /dev/null || true

    log_success "Cleanup completed"
}

main() {
    echo "=================================="
    echo "  JARVIS Enterprise Deployment"
    echo "  Environment: ${ENVIRONMENT}"
    echo "  Version: ${VERSION}"
    echo "=================================="
    echo ""

    check_prerequisites

    # Pre-deployment
    run_tests
    build_docker_images
    push_docker_images

    # Store current revision for potential rollback
    PREVIOUS_REVISION=$(kubectl rollout history deployment/${DEPLOYMENT_NAME} -n $NAMESPACE | tail -2 | head -1 | awk '{print $1}')

    # Deployment
    deploy_to_kubernetes

    if ! wait_for_rollout; then
        log_error "Deployment failed"
        rollback
        send_notification "FAILED" "Deployment failed, automatic rollback initiated"
        exit 1
    fi

    # Post-deployment validation
    if ! health_check; then
        log_error "Health checks failed"
        rollback
        send_notification "FAILED" "Health checks failed, automatic rollback initiated"
        exit 1
    fi

    if ! smoke_tests; then
        log_error "Smoke tests failed"
        rollback
        send_notification "FAILED" "Smoke tests failed, automatic rollback initiated"
        exit 1
    fi

    # Success!
    cleanup

    log_success "Deployment completed successfully!"
    send_notification "SUCCESS" "Version ${VERSION} deployed to ${ENVIRONMENT}"

    echo ""
    echo "=================================="
    echo "  Deployment Summary"
    echo "=================================="
    echo "Environment: ${ENVIRONMENT}"
    echo "Version: ${VERSION}"
    echo "Namespace: ${NAMESPACE}"
    echo "Status: ✅ SUCCESS"
    echo "=================================="
}

# Handle interrupts
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
