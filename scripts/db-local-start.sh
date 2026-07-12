#!/usr/bin/env bash
# Starts a local PostgreSQL for development using a single Docker container.
# This is a convenience for local dev only. It is not the full docker-compose
# orchestration (that comes later, in the deployment phase).
#
# Usage: npm run db:start   (or: bash scripts/db-local-start.sh)

set -euo pipefail

CONTAINER_NAME="url-shortner-db"
DB_USER="user"
DB_PASSWORD="password"
DB_NAME="url_shortner_dev"
DB_PORT="5432"

# If the container already exists, just make sure it is running.
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Container '${CONTAINER_NAME}' already exists. Starting it..."
  docker start "${CONTAINER_NAME}"
else
  echo "Creating and starting Postgres container '${CONTAINER_NAME}'..."
  docker run -d \
    --name "${CONTAINER_NAME}" \
    -e POSTGRES_USER="${DB_USER}" \
    -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -p "${DB_PORT}:5432" \
    postgres:16-alpine
fi

echo ""
echo "Postgres is running on localhost:${DB_PORT}"
echo "Connection string:"
echo "  postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
echo ""
echo "Tip: to also create the test database, run:"
echo "  docker exec -it ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c 'CREATE DATABASE url_shortner_test;'"
