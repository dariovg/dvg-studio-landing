#!/usr/bin/env bash
# Crea el repo en GitHub y publica (requiere: gh auth login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GH="${GH_BIN:-/tmp/gh-cli/gh_2.69.0_macOS_arm64/bin/gh}"

if ! "$GH" auth status &>/dev/null; then
  echo "Primero inicia sesión en GitHub:"
  echo "  $GH auth login"
  exit 1
fi

cd "$ROOT"
"$GH" repo create dvg-studio-landing --public --source=. --remote=origin --push --description "Landing page DVG Studio - Empleados Digitales 24/7"
"$GH" api repos/{owner}/dvg-studio-landing/pages -X POST -f build_type=workflow -f source[branch]=main -f source[path]=/ 2>/dev/null || true

echo ""
echo "✓ Repo publicado. Activa Pages en Settings → Pages si hace falta."
