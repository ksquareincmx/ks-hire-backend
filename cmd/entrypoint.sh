#!/bin/bash
set -e

wait-for-it ${DB_HOST:-mysql}:${DATABASE_PORT:-3306} --timeout=0

exec "$@"
