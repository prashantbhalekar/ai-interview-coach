#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "[bootstrap] docker-compose command not found. Install Docker Compose first." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[bootstrap] curl command not found. Install curl first." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[bootstrap] Docker daemon is not reachable. Start Docker Desktop/Engine and retry." >&2
  exit 1
fi

SEED=${BOOTSTRAP_SEED:-false}
BUILD=${BOOTSTRAP_BUILD:-true}
BACKEND_HEALTH_URL=${BACKEND_HEALTH_URL:-http://localhost:3001/api/v1/health}
FRONTEND_HEALTH_URL=${FRONTEND_HEALTH_URL:-http://localhost:3000/interview-coach}
MAX_WAIT_SECONDS=${BOOTSTRAP_MAX_WAIT_SECONDS:-120}

for arg in "$@"; do
  case "$arg" in
    --seed)
      SEED=true
      ;;
    --no-build)
      BUILD=false
      ;;
    --build)
      BUILD=true
      ;;
    *)
      echo "[bootstrap] Unknown argument: $arg" >&2
      echo "Usage: scripts/docker-bootstrap.sh [--seed] [--build|--no-build]" >&2
      exit 1
      ;;
  esac
done

echo "[bootstrap] Starting stack (build=$BUILD, seed=$SEED)"
if [ "$BUILD" = "true" ]; then
  docker-compose up -d --build
else
  docker-compose up -d
fi

echo "[bootstrap] Waiting for backend health: $BACKEND_HEALTH_URL"
elapsed=0
while [ "$elapsed" -lt "$MAX_WAIT_SECONDS" ]; do
  if curl -fsS "$BACKEND_HEALTH_URL" >/dev/null 2>&1; then
    echo "[bootstrap] Backend is healthy"
    break
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
  echo "[bootstrap] Backend health check timed out after ${MAX_WAIT_SECONDS}s" >&2
  docker-compose ps
  exit 1
fi

echo "[bootstrap] Running prisma deploy"
docker-compose exec -T backend pnpm --filter backend prisma:deploy

if [ "$SEED" = "true" ]; then
  echo "[bootstrap] Running prisma seed"
  docker-compose exec -T backend pnpm --filter backend prisma:seed
fi

echo "[bootstrap] Checking frontend route: $FRONTEND_HEALTH_URL"
if ! curl -fsS "$FRONTEND_HEALTH_URL" >/dev/null 2>&1; then
  echo "[bootstrap] Frontend route check failed" >&2
  docker-compose ps
  exit 1
fi

echo "[bootstrap] Stack is ready"
docker-compose ps
