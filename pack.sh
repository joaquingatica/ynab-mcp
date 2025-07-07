#!/bin/bash

set -e

DIST_DIR="dist"
BIN_DIR="bin"

# copy files to pack to dist folder

mkdir -p "$DIST_DIR"
cp -r {assets,build,manifest.json,package.json,package-lock.json} "$DIST_DIR"

# clean package.json install runtime dependencies in dist folder

cd "$DIST_DIR"
jq 'del(.main, .scripts, .devDependencies)' package.json > package.tmp.json
mv package.tmp.json package.json
npm i --omit dev
cd ..

# pack the dist folder into an extension

dxt pack "$DIST_DIR" "$BIN_DIR/ynab.dxt"
