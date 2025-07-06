#!/bin/bash

# build ts project

rm -rf dist
tsc

# copy to bin folder

rm -rf bin
mkdir -p bin
cp -r {assets,dist,manifest.json,package.json,package-lock.json} bin

# prepare bin

cd bin || exit 1
npm ci --omit dev

# pack

cd .. || exit 1
dxt pack bin ynab.dxt
