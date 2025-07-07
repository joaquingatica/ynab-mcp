#!/bin/bash

# build ts project

rm -rf build
tsc

# copy to build folder

rm -rf dist
mkdir -p dist
cp -r {assets,build,manifest.json,package.json,package-lock.json} dist

# prepare dist

cd dist || exit 1
npm ci --omit dev

# pack

cd .. || exit 1
dxt pack dist bin/ynab.dxt
