#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
project_root="$PWD"

for command in docker php; do
  command -v "$command" >/dev/null || { echo "Required command: $command" >&2; exit 1; }
done
for file in build/indexer.php build/standalone.php vendor/bin/phpunit; do
  test -f "$file" || { echo "Missing $file; run pnpm make-standalone and composer install first." >&2; exit 1; }
done
versions=("$@")
if [[ ${#versions[@]} == 0 ]]; then versions=(8.2 8.3 8.4 8.5); fi
for version in "${versions[@]}"; do
  [[ "$version" =~ ^[78]\.[0-9]+$ ]] || { echo "Invalid PHP version: $version" >&2; exit 1; }
done

scratch="$(mktemp -d /tmp/ivfi-php-matrix.XXXXXXXX)"
container=""
cleanup() {
  if [[ -n "$container" ]]; then docker rm -f "$container" >/dev/null 2>&1 || true; fi
  rm -rf -- "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# The host runs PHPUnit; only the generated application runs in the target PHP.
cat > "$scratch/php" <<'WRAPPER'
#!/usr/bin/env bash
exec docker exec -i -w "$PWD" "$IVFI_PHP_CONTAINER" \
  php -d error_reporting=32767 -d display_errors=stderr -d log_errors=1 "$@"
WRAPPER
chmod +x "$scratch/php"
export IVFI_PHP_BINARY="$scratch/php"
export TMPDIR="$scratch"

for version in "${versions[@]}"; do
  image="php:$version-cli-alpine"
  docker pull "$image"
  container="ivfi-php-${version//./-}-$$"
  docker run -d --rm --name "$container" --user "$(id -u):$(id -g)" \
    --read-only --tmpfs /tmp --network none --cap-drop ALL \
    --security-opt no-new-privileges \
    --mount "type=bind,source=$project_root,target=$project_root,readonly" \
    --mount "type=bind,source=$scratch,target=$scratch" \
    "$image" sleep infinity >/dev/null
  export IVFI_PHP_CONTAINER="$container"
  docker exec "$container" php --version
  for variant in indexer.php standalone.php; do
    echo "Testing PHP $version / $variant"
    docker exec "$container" php -l "$project_root/build/$variant"
    IVFI_PHP_VARIANT="$variant" php vendor/bin/phpunit --configuration tests/php --do-not-cache-result
  done
  docker rm -f "$container" >/dev/null
  container=""
done
