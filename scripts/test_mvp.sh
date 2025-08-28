#!/usr/bin/env bash
set -euo pipefail
shopt -s expand_aliases
if command -v pnpm >/dev/null 2>&1; then PM=pnpm; else PM=npm; fi
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
REPORT="${ROOT_DIR}/docs/REPORTE_QA_LOCAL_$(date +%Y%m%d-%H%M%S).md"
mkdir -p "${ROOT_DIR}/docs"

log(){ echo "[$(date +%H:%M:%S)] $*"; }
run(){ log "$*"; eval "$*"; }

pushd "$ROOT_DIR" >/dev/null
{
  echo "# QA Local — $(date -Iseconds)"
  echo
} > "$REPORT"

run "$PM install" | tee -a "$REPORT"
(run "$PM lint" && echo "Lint: OK" >> "$REPORT") || echo "Lint: FAIL" >> "$REPORT"
(run "$PM test" && echo "Tests: OK" >> "$REPORT") || echo "Tests: FAIL" >> "$REPORT"
(run "$PM build" && echo "Build: OK" >> "$REPORT") || echo "Build: FAIL" >> "$REPORT"

# Project-specific smoke hooks
if [ -f package.json ] && grep -q '"name" *: *"yega-api"' package.json; then
  # API smoke
  PORT=${PORT:-3001}
  ( $PM dev >/dev/null 2>&1 & echo $! > .qa_api.pid ) || true
  sleep 5
  echo "API /health:" >> "$REPORT"
  curl -sS "http://localhost:${PORT}/health" >> "$REPORT" || true
  echo >> "$REPORT"
  [ -f .qa_api.pid ] && kill $(cat .qa_api.pid) 2>/dev/null || true
fi

if [ -f package.json ] && grep -q '"name" *: *"yega-repartidor"' package.json; then
  echo "Repartidor build-only smoke" >> "$REPORT"
fi

if [ -f package.json ] && grep -q '"name" *: *"yega-cliente"' package.json; then
  echo "Cliente build-only smoke" >> "$REPORT"
fi

popd >/dev/null
log "Reporte: $REPORT"
