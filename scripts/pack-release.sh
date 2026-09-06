#!/usr/bin/env bash

#
#  This script will package the script into a release zip file.
#
#  It requires the following dependencies: 7z, jq and pnpm
#


set -o errexit   # abort on nonzero exit status
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes

no_dep_exit_code=3

e() {
  >&2 echo "$1"
}

from_build=false
if [[ "${1:-}" == "--from-build" && "$#" == 1 ]]; then
  from_build=true
elif [[ "$#" != 0 ]]; then
  e "Usage: $0 [--from-build]"
  exit 2
fi

jq_cmd="$(command -v jq || true)"
pnpm_cmd="$(command -v pnpm || true)"
sz_cmd="$(command -v 7z || true)"

if ! [ -x "${jq_cmd}" ]; then
  e "required dependency not found: jq not found in the path or not executable"
  exit ${no_dep_exit_code}
fi

if [[ "$from_build" == false ]] && ! [ -x "${pnpm_cmd}" ]; then
  e "required dependency not found: pnpm not found in the path or not executable"
  exit ${no_dep_exit_code}
fi

if ! [ -x "${sz_cmd}" ]; then
  e "required dependency not found: 7z not found in the path or not executable"
  exit ${no_dep_exit_code}
fi

declare -a PACKAGE_FILES=(
    'README.md'
    'logo.svg'
    'LICENSE'
    'docs'
)

cd "$(dirname "$0")" && cd ..

VERSION=$("$jq_cmd" -r .version "package.json")
NAME=$("$jq_cmd" -r .name "package.json")
PACKAGED="$NAME-$VERSION.zip"

if [[ ! "$NAME" =~ ^[a-zA-Z0-9._-]+$ || ! "$VERSION" =~ ^[a-zA-Z0-9._+-]+$ ]]; then
  e "Invalid release name or version"
  exit 2
fi

if [[ "$from_build" == false ]]; then
  e "Installing dependencies ..."
  "$pnpm_cmd" install --frozen-lockfile

  e "Building standalone ..."
  "$pnpm_cmd" run make-standalone
fi

release_root="$PWD"
release_tmp="$(mktemp -d "$release_root/.release-stage.XXXXXXXX")"
trap 'rm -rf -- "$release_tmp"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir "$release_tmp/standalone"
cp -R build "$release_tmp/build"
mv "$release_tmp/build/standalone.php" "$release_tmp/standalone/indexer.php"

for FILE in "${PACKAGE_FILES[@]}"; do
    cp -R "$FILE" "$release_tmp/$FILE"
done

e "Creating release file ..."
(
  cd "$release_tmp"
  "$sz_cmd" a -tzip "$PACKAGED" standalone build "${PACKAGE_FILES[@]}"
  "$sz_cmd" t "$PACKAGED"
)
mv -f -- "$release_tmp/$PACKAGED" "$release_root/$PACKAGED"

e "> $PACKAGED"
