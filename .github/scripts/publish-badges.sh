#!/usr/bin/env bash
# Publica arquivos SVG de badges no branch "badges".
#
# A main é protegida e não aceita push direto do GitHub Actions, então os
# badges ficam num branch separado, que só guarda os SVGs. O README aponta
# para https://raw.githubusercontent.com/<repo>/badges/<arquivo>.svg.
#
# Uso: publish-badges.sh arquivo1.svg [arquivo2.svg ...]
# Precisa de GITHUB_TOKEN (com contents: write) e GITHUB_REPOSITORY.
set -euo pipefail

url="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
dir="$(mktemp -d)"

if ! git clone -q --depth 1 --branch badges "$url" "$dir" 2>/dev/null; then
  git init -q "$dir"
  git -C "$dir" checkout -q --orphan badges
fi

cp "$@" "$dir"/
cd "$dir"
if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
fi
git add -A

if git diff --cached --quiet; then
  echo "Badges sem mudança."
  exit 0
fi

git commit -q -m "chore(badges): atualiza $(for f in "$@"; do basename "$f"; done | tr '\n' ' ')"
git push -q "$url" HEAD:badges
echo "Badges publicados no branch badges."
