#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
project_root="$PWD"
test_tmp="$(mktemp -d)"
trap 'rm -rf -- "$test_tmp"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir -p "$test_tmp/project/scripts"
cp scripts/pack-release.sh "$test_tmp/project/scripts/"
cp -R package.json build README.md logo.svg LICENSE docs "$test_tmp/project/"
cd "$test_tmp/project"

archive="$(jq -r '.name + "-" + .version + ".zip"' package.json)"
mkdir standalone
touch standalone/keep-me obsolete.txt
7z a -tzip "$archive" obsolete.txt >/dev/null

for attempt in 1 2; do
  bash scripts/pack-release.sh --from-build
  7z x "$archive" "-o$test_tmp/extracted-$attempt" >/dev/null
  extracted="$test_tmp/extracted-$attempt"
  test ! -e "$extracted/obsolete.txt"
  test ! -e "$extracted/build/standalone.php"
  test -s "$extracted/build/indexer.php"
  test -s "$extracted/build/indexer/main.js"
  test -s "$extracted/build/indexer/css/style.css"
  test -s "$extracted/standalone/indexer.php"
  diff -r --exclude=standalone.php build "$extracted/build"
  cmp build/standalone.php "$extracted/standalone/indexer.php"
  for file in README.md logo.svg LICENSE docs; do
    diff -r "$file" "$extracted/$file"
  done
  diff -r "$project_root/build" build
  test -f standalone/keep-me
done

# A failed packaging run must preserve the previous release.
cp "$archive" "$test_tmp/previous.zip"
mv LICENSE LICENSE.saved
if bash scripts/pack-release.sh --from-build; then
  echo "Packaging unexpectedly succeeded without LICENSE" >&2
  exit 1
fi
cmp "$archive" "$test_tmp/previous.zip"
diff -r "$project_root/build" build
test -f standalone/keep-me
shopt -s nullglob
staging_dirs=(.release-stage.*)
test "${#staging_dirs[@]}" -eq 0
echo "Release packaging checks passed."
