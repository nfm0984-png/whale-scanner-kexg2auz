#!/bin/bash
# Build app.js from src/ (needs node + esbuild/react; NODE_PATH can point at a node_modules dir)
set -e; cd "$(dirname "$0")"
NM=${NM:-./node_modules}
NODE_PATH=$NM $NM/.bin/esbuild src/main.tsx --bundle --minify --format=iife --target=es2019 --jsx=automatic --define:process.env.NODE_ENV='"production"' --outfile=app.js --log-level=warning
V=$(md5sum app.js | cut -c1-10); sed -i -E "s/app\.js\?v=[a-z0-9]+/app.js?v=$V/; s/config\.js\?v=[a-z0-9]+/config.js?v=$V/" index.html
echo "built app.js v=$V ($(wc -c < app.js) bytes)"
