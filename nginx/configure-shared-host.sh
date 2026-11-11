#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo 'Execute como root (sudo).' >&2
  exit 1
fi

letsencrypt_email="${1:-${LETSENCRYPT_EMAIL:-}}"
if [[ ! "${letsencrypt_email}" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo 'Informe um e-mail válido do Let’s Encrypt como primeiro argumento.' >&2
  exit 1
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

for command in nginx certbot curl; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "Comando obrigatório não encontrado: ${command}" >&2
    exit 1
  fi
done

if ! curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1:8081/api/health >/dev/null; then
  echo 'O Qualeider não está saudável em 127.0.0.1:8081.' >&2
  exit 1
fi

install -d -m 755 /var/www/letsencrypt/.well-known/acme-challenge

# Algumas VMs já possuem outro site explicitamente marcado como default_server.
# Nginx não aceita dois defaults no mesmo endereço; nesse caso, preservamos o
# existente e instalamos apenas os virtual hosts exatos do Qualeider.
if grep -RslE 'listen[[:space:]].*default_server' \
  /etc/nginx/sites-enabled --exclude=00-default-deny | grep -q .; then
  rm -f /etc/nginx/sites-enabled/00-default-deny
  echo 'default_server existente preservado.'
else
  install -m 644 "${script_dir}/default-deny.example.conf" \
    /etc/nginx/sites-available/00-default-deny
  ln -sfn /etc/nginx/sites-available/00-default-deny \
    /etc/nginx/sites-enabled/00-default-deny
fi

install -m 644 "${script_dir}/qual-bootstrap-http.example.conf" \
  /etc/nginx/sites-available/qualeider-bootstrap
ln -sfn /etc/nginx/sites-available/qualeider-bootstrap \
  /etc/nginx/sites-enabled/qualeider-bootstrap

nginx -t
systemctl reload nginx

certbot certonly \
  --webroot \
  --webroot-path /var/www/letsencrypt \
  --cert-name alexandrejota.me \
  --domains alexandrejota.me,www.alexandrejota.me,qualact.alexandrejota.me \
  --email "${letsencrypt_email}" \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

install -m 644 "${script_dir}/host-nginx.example.conf" \
  /etc/nginx/sites-available/qualeider
ln -sfn /etc/nginx/sites-available/qualeider \
  /etc/nginx/sites-enabled/qualeider
rm -f /etc/nginx/sites-enabled/qualeider-bootstrap

nginx -t
systemctl reload nginx

curl --fail --silent --show-error --max-time 15 \
  https://alexandrejota.me/api/health >/dev/null
curl --fail --silent --show-error --max-time 15 \
  https://alexandrejota.me/ >/dev/null

echo 'Roteamento do Qualeider configurado com sucesso.'
