#!/bin/bash
set -e

echo "==> Waiting for PostgreSQL..."
for i in {1..30}; do
  if python -c "import psycopg2; psycopg2.connect('postgresql://ebpuser:ebppass@ebp-postgres:5432/ebpdb')" 2>/dev/null; then
    echo "==> PostgreSQL ready."
    break
  fi
  echo "Attempt $i/30..."
  sleep 2
done

echo "==> Starting Superset..."
gunicorn \
  --bind 0.0.0.0:8088 \
  --workers 2 \
  --timeout 120 \
  --limit-request-line 0 \
  --limit-request-field_size 0 \
  "superset.app:create_app()"
