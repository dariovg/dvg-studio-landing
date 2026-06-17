#!/bin/bash
# Arregla credenciales Git rotas (gh en /tmp) y sube a GitHub.
set -e

echo "→ Comprobando commits pendientes..."
cd "$(dirname "$0")/.."
git status -sb
echo ""

echo "→ Quitando helper roto de GitHub (gh en /tmp que ya no existe)..."
git config --global --unset-all credential.https://github.com.helper 2>/dev/null || true
git config --global --unset-all credential.https://gist.github.com.helper 2>/dev/null || true
git config --global credential.helper osxkeychain

echo "→ Intentando push a origin/main..."
echo "   (Si pide login, usa tu usuario de GitHub y un Personal Access Token como contraseña)"
echo ""

git push origin main

echo ""
echo "✓ Listo. Vercel debería desplegar en 1-2 minutos."
