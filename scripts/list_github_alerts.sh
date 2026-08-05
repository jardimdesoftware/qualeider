#!/usr/bin/env bash
set -euo pipefail

# Script para listar alerts do Dependabot e do Code Scanning via `gh api`
# Uso: ./scripts/list_github_alerts.sh <owner> <repo>

OWNER="$1"
REPO="$2"

echo "Listando Dependabot alerts para $OWNER/$REPO"
gh api -H "Accept: application/vnd.github+json" "/repos/$OWNER/$REPO/dependabot/alerts" > dependabot-alerts.json
echo "Dependabot alerts salvos em dependabot-alerts.json"

echo "Listando Code Scanning alerts para $OWNER/$REPO"
gh api -H "Accept: application/vnd.github+json" "/repos/$OWNER/$REPO/code-scanning/alerts" > code-scanning-alerts.json
echo "Code Scanning alerts salvos em code-scanning-alerts.json"

echo "Relatórios gerados."
