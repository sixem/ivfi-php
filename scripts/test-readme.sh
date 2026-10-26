#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
project_root="$PWD"
# Build the optional feature separately so release outputs stay unchanged.
scratch="$(mktemp -d /tmp/ivfi-readme-build.XXXXXXXX)"
trap 'rm -rf -- "$scratch"' EXIT
cp -R src extras scripts tests package.json tsconfig.json build.options.json "$scratch/"
ln -s "$project_root/node_modules" "$scratch/node_modules"
ln -s "$project_root/vendor" "$scratch/vendor"
cd "$scratch"
node --input-type=module -e '
import fs from "node:fs";
const options = JSON.parse(fs.readFileSync("build.options.json", "utf8"));
options.extraFeatures.readmeSupport = true;
fs.writeFileSync("build.options.json", JSON.stringify(options));
'
node node_modules/webpack-cli/bin/cli.js --config scripts/build/webpack.config.js --mode=production
node scripts/make-standalone.js
for variant in indexer.php standalone.php; do
  echo "Testing README support / $variant"
  IVFI_PHP_VARIANT="$variant" php vendor/bin/phpunit --configuration tests/php --do-not-cache-result tests/readme
done
