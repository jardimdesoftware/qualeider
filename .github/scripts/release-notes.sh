#!/usr/bin/env bash
# Prepara a release de uma versão para um componente (backend ou frontend).
#
# 1. Garante que a imagem do OUTRO componente também tenha a tag da versão.
#    Se o PR só mexeu em um lado, o outro workflow não roda; aqui a imagem
#    `latest` dele (a que está em produção) recebe a mesma tag, sem rebuild.
#    Se o outro workflow também rodar, ele publica a imagem nova por cima.
# 2. Escreve em release-notes.md a seção deste componente. Os dois workflows
#    usam append_body, então a release final tem as duas seções.
#
# Uso: release-notes.sh <backend|frontend> <vX.Y.Z>
# Precisa de docker logado no GHCR com permissão de escrita em packages.
set -euo pipefail

component="$1"
tag="$2"
registry="ghcr.io/${GITHUB_REPOSITORY_OWNER}"

case "$component" in
  backend) other=frontend ;;
  frontend) other=backend ;;
  *) echo "Componente inválido: $component" >&2; exit 1 ;;
esac

image="${registry}/qualeider-${component}"
other_image="${registry}/qualeider-${other}"
other_note="atualizada neste merge"

if docker buildx imagetools inspect "${other_image}:${tag}" > /dev/null 2>&1; then
  echo "${other_image}:${tag} já existe."
else
  echo "Marcando ${other_image}:latest como ${tag} (sem mudanças no ${other} neste merge)."
  docker buildx imagetools create --tag "${other_image}:${tag}" "${other_image}:latest"
  other_note="sem mudanças neste merge; mesma imagem da versão anterior"
fi

title="$(tr '[:lower:]' '[:upper:]' <<< "${component:0:1}")${component:1}"

cat > release-notes.md <<EOF
### 🐳 ${title}
\`docker pull ${image}:${tag}\`
- Multi-arch: \`linux/amd64\` e \`linux/arm64\`
- Trivy sem CRITICAL/HIGH com correção disponível (detalhes na aba Security)
- Imagem do ${other} nesta versão: \`${other_image}:${tag}\` (${other_note})

EOF

cat release-notes.md
