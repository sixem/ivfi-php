#!/bin/bash

declare -a PACKAGE_FILES=(
    'README.md'
    'logo.svg'
    'LICENSE'
    'docs'
)

cd "$(dirname "$0")" && cd ..

VERSION=$(jq -r .version "package.json")
NAME=$(jq -r .name "package.json")
PACKAGED="$NAME-$VERSION.zip"

npm install
npm run make-standalone

mkdir "standalone"
mv "build/standalone.php" "standalone/indexer.php"

7z a "$PACKAGED" "standalone/"
7z a "$PACKAGED" "build/"

rm -rf "build" "standalone"

for FILE in "${PACKAGE_FILES[@]}"; do
    echo "Adding $FILE ..."
    7z a "$PACKAGED" "$FILE"
done

printf "\n\n>> $PACKAGED\n"