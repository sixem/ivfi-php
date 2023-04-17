#!/usr/bin/env bash

#
#  This script will package the script into a release zip file.
#
#  It requires the following dependencies: 7z, jq and npm
#


set -o errexit   # abort on nonzero exit status
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes

no_dep_exit_code=3

where() {
  local cmd
  cmd="$(command -v "$1")"
  echo "$cmd"
}

e() {
  >&2 echo "$1"
}

jq_cmd="$(where jq)"
npm_cmd="$(where npm)"
sz_cmd="$(where 7z)"

if ! [ -x "${jq_cmd}" ]; then
  e "required dependency not found: jq not found in the path or not executable"
  exit ${no_dep_exit_code}
fi

if ! [ -x "${npm_cmd}" ]; then
  e "required dependency not found: npm not found in the path or not executable"
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

e "Installing dependencies ..."
"$npm_cmd" install

e "Building standalone ..."
"$npm_cmd" run make-standalone

mkdir "standalone"
mv "build/standalone.php" "standalone/indexer.php"

e "Creating release file ..."
"$sz_cmd" a "$PACKAGED" "standalone/"
"$sz_cmd" a "$PACKAGED" "build/"

e "Cleaning up ..."
rm -rf "build" "standalone"

for FILE in "${PACKAGE_FILES[@]}"; do
    e "Adding $FILE ..."
    "$sz_cmd" a "$PACKAGED" "$FILE"
done

e "> $PACKAGED"