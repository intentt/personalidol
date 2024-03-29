.DEFAULT_GOAL := release

ASSETS_BASE_PATH ?= /g/personalidol/assets
NODE_ENV ?= production
LOCALES_LOAD_PATH ?= /g/personalidol/locales/{{lng}}/{{ns}}.json
SERVICE_WORKER_BASE_PATH ?= /g/personalidol
STATIC_BASE_PATH ?= /g/personalidol

BUILD_ID ?= $(shell sh ./scripts/helper_build_id.sh)
CACHE_BUST ?= $(addprefix _v=,$(BUILD_ID))

# service worker is a special case not included here
JS_TARGETS_BASENAME := \
	createScenes \
	index \
	worker_atlas \
	worker_dynamics \
	worker_gltf \
	worker_offscreen \
	worker_progress \
	worker_quakemaps \
	worker_textures

JS_TARGETS := $(addsuffix _$(BUILD_ID).js,$(JS_TARGETS_BASENAME))
JS_TARGETS := $(JS_TARGETS) $(addsuffix .map,$(JS_TARGETS))
JS_TARGETS := $(addprefix public/lib/,$(JS_TARGETS))

TS_ENTRYPOINTS := $(addsuffix .ts,$(JS_TARGETS_BASENAME))
TS_ENTRYPOINTS := $(addprefix ./packages/bootstrap/src/,$(TS_ENTRYPOINTS))

define ESBUILD =
	yarn run esbuild \
		--bundle \
		--define:__ASSETS_BASE_PATH=\"$(ASSETS_BASE_PATH)\" \
		--define:__BUILD_ID=\"$(BUILD_ID)\" \
		--define:__CACHE_BUST=\"$(CACHE_BUST)\" \
		--define:__LOCALES_LOAD_PATH=\"$(LOCALES_LOAD_PATH)\" \
		--define:__LOG_LEVEL=\"trace\" \
		--define:__SERVICE_WORKER_BASE_PATH=\"$(SERVICE_WORKER_BASE_PATH)\" \
		--define:__STATIC_BASE_PATH=\"$(STATIC_BASE_PATH)\" \
		--define:process.env.NODE_ENV=\"$(NODE_ENV)\" \
		--entry-names="./[name]_$(BUILD_ID)" \
		--format=esm \
		--log-limit=0 \
		--minify \
		--outdir=./public/lib \
		--platform=browser \
		--sourcemap \
		--target=safari13 \
		--tree-shaking=true \
		--tsconfig=tsconfig.json \
		$(1) \
	;
endef

define FOREACH
	for DIR in packages/*; do \
		if [ -d $$DIR ]; then \
			echo $$DIR; \
			$(MAKE) -C $$DIR $(1); \
		fi \
	done
endef

$(JS_TARGETS): public/lib
	$(call ESBUILD, $(TS_ENTRYPOINTS))

electron/main.js: src/electron.ts
	yarn run esbuild \
		--bundle \
		--entry-names="./main" \
		--external:electron \
		--log-limit=0 \
		--minify \
		--outdir=./electron \
		--platform=node \
		--tsconfig=tsconfig.json \
		src/electron.ts \
	;

public/index.html: public/index.mustache public/lib/index_$(BUILD_ID).js scripts/build_mustache.js
	ASSETS_BASE_PATH=$(ASSETS_BASE_PATH) \
	BUILD_ID=$(BUILD_ID) \
	CACHE_BUST=$(CACHE_BUST) \
	STATIC_BASE_PATH=${STATIC_BASE_PATH} \
		node ./scripts/build_mustache.js

public/lib:
	mkdir -p public/lib

public/lib/ammo.wasm.js: public/lib
	cp `node -e "console.log(require.resolve('ammo.js/builds/ammo.wasm.js'))"` ./public/lib/ammo.wasm.js

public/lib/ammo.wasm.wasm: public/lib
	cp `node -e "console.log(require.resolve('ammo.js/builds/ammo.wasm.wasm'))"` ./public/lib/ammo.wasm.wasm

.INTERMEDIATE: public/lib/service_worker_$(BUILD_ID).js
public/lib/service_worker_$(BUILD_ID).js: public/lib packages/bootstrap/src/service_worker.ts
	$(call ESBUILD, packages/bootstrap/src/service_worker.ts)

.INTERMEDIATE: public/lib/service_worker_$(BUILD_ID).js.map
public/lib/service_worker_$(BUILD_ID).js.map: public/lib public/lib/service_worker_$(BUILD_ID).js

public/service_worker.js public/service_worker_$(BUILD_ID).js.map: public/lib/service_worker_$(BUILD_ID).js public/lib/service_worker_$(BUILD_ID).js.map
	cp public/lib/service_worker_$(BUILD_ID).js ./public/service_worker.js
	cp public/lib/service_worker_$(BUILD_ID).js.map ./public/service_worker_$(BUILD_ID).js.map

node_modules: yarn.lock
	yarn install --check-files --frozen-lockfile --non-interactive

yarn.lock: package.json

# Phony targets

.PHONY: clean
clean:
	$(call FOREACH,clean)
	rm -rf node_modules

.PHONY: electron
electron: node_modules public/index.html electron/main.js
	yarn run electron ./electron/main.js

.PHONY: fmt
fmt: prettier

.PHONY: ncu
ncu: node_modules
	yarn run ncu -u

.PHONY: prettier
prettier: node_modules
	yarn run prettier --write --print-width 120 "packages/*/src/**/*.{ts,tsx}"

.PHONY: public.watch
public.watch:
	NODE_ENV=development ./scripts/watch_trigger.sh $(MAKE) "$${PWD}/packages/*/src $${PWD}/public/*.mustache" "release.tsc"

.PHONY: release
release: \
	node_modules \
	public/index.html \
	public/lib/ammo.wasm.js \
	public/lib/ammo.wasm.wasm \
	public/service_worker.js \
	public/service_worker_$(BUILD_ID).js.map \
	$(JS_TARGETS)

.PHONY: release.tsc
release.tsc: tsc release

.PHONY: tsc
tsc: node_modules
	yarn run tsc --noEmit

.PHONY: tsc.watch
tsc.watch: node_modules
	yarn run tsc --noEmit --watch
