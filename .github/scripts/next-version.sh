#!/usr/bin/env bash
# Calcula a versão (tag vX.Y.Z) de um merge na main. Usado pelo Backend CI/CD
# e pelo Frontend CI/CD, para que os dois cheguem sempre na MESMA versão.
#
# Regras:
#   - Se já existe uma tag v* apontando para o commit do merge, reaproveita.
#     (É o caso do segundo workflow quando o PR mexe no backend e no frontend.)
#   - Senão, parte da maior tag v* do repositório (ordem semver, não a última
#     release criada) e incrementa conforme o tipo de mudança do PR:
#       novo-marco -> major | nova-feature-refactor -> minor | bug-fix -> patch
#   - "outros" não gera versão: imprime vazio e a imagem sai como dev-<sha>.
#
# Os dois workflows rodam ao mesmo tempo partindo da mesma maior tag e do
# mesmo tipo de mudança, então calculam o mesmo número mesmo sem a tag existir.
#
# Uso: next-version.sh <change_type> <sha_do_merge>
set -euo pipefail

change_type="$1"
sha="$2"

git fetch --quiet --force --tags origin

existing="$(git tag --points-at "$sha" --list 'v[0-9]*' --sort=-v:refname | head -n 1)"
if [[ -n "$existing" ]]; then
  echo "Commit $sha já tem a tag $existing; reaproveitando." >&2
  echo "$existing"
  exit 0
fi

if [[ "$change_type" == "outros" ]]; then
  echo "Tipo 'outros': sem nova versão." >&2
  echo ""
  exit 0
fi

latest="$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1)"
latest="${latest:-v0.0.0}"
IFS='.' read -r major minor patch <<< "${latest#v}"

case "$change_type" in
  novo-marco) major=$((major + 1)); minor=0; patch=0 ;;
  nova-feature-refactor) minor=$((minor + 1)); patch=0 ;;
  bug-fix) patch=$((patch + 1)) ;;
  *)
    echo "Tipo de mudança desconhecido: '$change_type'" >&2
    exit 1
    ;;
esac

next="v${major}.${minor}.${patch}"
echo "Última versão: $latest -> nova: $next ($change_type)" >&2
echo "$next"
