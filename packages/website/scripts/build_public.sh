#!/usr/bin/env sh

# Clean up old files first.
rm -rf ./public/lib/*;
rm -f ./public/service_worker_*

# --analyze \
yarn run esbuild \
    --bundle \
    --define:__ASSETS_BASE_PATH=\"${ASSETS_BASE_PATH}\" \
    --define:__BUILD_ID=\"${BUILD_ID}\" \
    --define:__CACHE_BUST=\"${CACHE_BUST}\" \
    --define:__LOCALES_LOAD_PATH=\"${LOCALES_LOAD_PATH}\" \
    --define:__LOG_LEVEL=\"debug\" \
    --define:__SERVICE_WORKER_BASE_PATH=\"${SERVICE_WORKER_BASE_PATH}\" \
    --define:__STATIC_BASE_PATH=\"${STATIC_BASE_PATH}\" \
    --define:process.env.NODE_ENV=\"${NODE_ENV}\" \
    --entry-names="./[name]_${BUILD_ID}" \
    --format=esm \
    --log-limit=0 \
    --minify \
    --outdir=./public/lib \
    --platform=browser \
    --sourcemap \
    --target=safari14 \
    --tree-shaking=true \
    --tsconfig=tsconfig.json \
    src/createScenes.ts \
    src/index.ts \
    src/service_worker.ts \
    src/worker_atlas.ts \
    src/worker_dynamics.ts \
    src/worker_fbx.ts \
    src/worker_gltf.ts \
    src/worker_offscreen.ts \
    src/worker_progress.ts \
    src/worker_quakemaps.ts \
    src/worker_textures.ts \
;

# Service worker needs to be placed in the root directory.
mv ./public/lib/service_worker_${BUILD_ID}.js ./public/service_worker.js
mv ./public/lib/service_worker_${BUILD_ID}.js.map ./public/service_worker_${BUILD_ID}.js.map

cp `node -e "console.log(require.resolve('ammo.js/builds/ammo.wasm.wasm'))"` ./public/lib/ammo.wasm.wasm
