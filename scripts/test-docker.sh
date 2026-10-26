#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for command in docker curl; do
  command -v "$command" >/dev/null || { echo "Required command: $command" >&2; exit 1; }
done
scratch="$(mktemp -d /tmp/ivfi-docker.XXXXXXXX)"
project="ivfi-smoke-$$"
export SERVEPOINT="$scratch/media" PORT=0 BIND_ADDRESS=127.0.0.1
compose=(docker compose -p "$project" -f docker/docker-compose.yml -f "$scratch/compose.yaml")
cleanup() {
  "${compose[@]}" down --remove-orphans >/dev/null 2>&1 || true
  rm -rf -- "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir -p "$SERVEPOINT/nested" "$SERVEPOINT/dotted.dir" "$SERVEPOINT/space #?% dir"
printf '0123456789abcdef' > "$SERVEPOINT/example.txt"
printf 'nested content' > "$SERVEPOINT/nested/inside.txt"
printf 'encoded content' > "$SERVEPOINT/café #?%%.txt"
printf 'private metadata' > "$SERVEPOINT/.ivfi"
printf '<?php echo "must not execute";' > "$SERVEPOINT/script.php"
ln -s /etc/passwd "$SERVEPOINT/outside.txt"
printf '<?php return ["selection" => ["enabled" => false], "format" => ["title" => "Docker %%s"]];' > "$scratch/config.php"
cat > "$scratch/compose.yaml" <<YAML
services:
  php:
    volumes:
      - type: bind
        source: $scratch/config.php
        target: /opt/ivfi/public/indexer.config.php
        read_only: true
YAML
"${compose[@]}" up --build -d --wait --wait-timeout 120
base="http://$("${compose[@]}" port indexer 8080)"
request() {
  local expected="$1" path="$2" status
  status="$(curl --silent --show-error --path-as-is -o "$scratch/body" -w '%{http_code}' "$base$path")"
  if [[ "$status" != "$expected" ]]; then
    echo "$path: expected $expected, got $status" >&2
    cat "$scratch/body" >&2
    "${compose[@]}" logs >&2
    exit 1
  fi
}
request 200 /
grep -q '<title>Docker /</title>' "$scratch/body"
grep -q '"selection":{"enabled":false}' "$scratch/body"
request 200 /indexer/main.js
request 200 /indexer/css/style.css
request 200 /nested/
grep -q 'inside.txt' "$scratch/body"
request 301 /dotted.dir
request 200 /dotted.dir/
request 200 /space%20%23%3F%25%20dir/
request 200 '/caf%C3%A9%20%23%3F%25%25.txt'
test "$(cat "$scratch/body")" = 'encoded content'
request 404 /missing/
for path in /.ivfi /indexer.config.php /standalone.php /script.php /indexer.php /.ivfi-health; do
  # The health endpoint is available only inside the web container.
  if [[ "$path" == /.ivfi-health ]]; then request 403 "$path"; else request 404 "$path"; fi
done
status="$(curl --silent --show-error -H 'Range: bytes=2-5' -o "$scratch/body" -w '%{http_code}' "$base/example.txt")"
test "$status" = 206 && test "$(cat "$scratch/body")" = 2345
status="$(curl --silent --show-error -o "$scratch/body" -w '%{http_code}' "$base/outside.txt")"
test "$status" != 200
for service in indexer php; do
  test "$("${compose[@]}" exec -T "$service" id -u)" != 0
  if "${compose[@]}" exec -T "$service" sh -c 'touch /srv/must-not-write' 2>/dev/null; then
    echo "$service can write to media" >&2
    exit 1
  fi
done
"${compose[@]}" exec -T php php -r 'exit(extension_loaded("mbstring") && extension_loaded("Zend OPcache") ? 0 : 1);'
printf '<?php return ["authentication" => ["users" => ["fixture" => "secret"]]];' > "$scratch/config.php"
"${compose[@]}" restart php
"${compose[@]}" up -d --wait --wait-timeout 120
request 401 /
status="$(curl --silent --show-error --digest -u fixture:secret -o "$scratch/body" -w '%{http_code}' "$base/")"
test "$status" = 200
grep -q '__IVFI_DATA__' "$scratch/body"
status="$(curl --silent --show-error --digest -u fixture:wrong -o "$scratch/body" -w '%{http_code}' "$base/")"
test "$status" = 401
request 200 /example.txt
echo 'Docker listing, assets, config, Digest authentication, encoded paths, range downloads, access restrictions and read-only mounts passed.'

