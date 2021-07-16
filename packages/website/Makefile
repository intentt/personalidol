ASSETS_BASE_PATH ?= /g/personalidol/assets
NODE_ENV ?= production
LOCALES_LOAD_PATH ?= /g/personalidol/locales/{{lng}}/{{ns}}.json
SERVICE_WORKER_BASE_PATH ?= /g/personalidol
STATIC_BASE_PATH ?= /g/personalidol

BUILD_ID := $(shell sh ./scripts/helper_build_id.sh)
CACHE_BUST := $(shell BUILD_ID=$(BUILD_ID) sh ./scripts/helper_cache_bust.sh)

# Real targets

.PHONY: public/index.html
public/index.html: public/index.js public/index.mustache $(SOURCES_TS)
	ASSETS_BASE_PATH=${ASSETS_BASE_PATH} \
	BUILD_ID=$(BUILD_ID) \
	CACHE_BUST=$(CACHE_BUST) \
	STATIC_BASE_PATH=${STATIC_BASE_PATH} \
		node ./scripts/build_mustache.js

public/index.js: scripts/build_public.sh $(SOURCES_TS)
	ASSETS_BASE_PATH=${ASSETS_BASE_PATH} \
	BUILD_ID=$(BUILD_ID) \
	CACHE_BUST=$(CACHE_BUST) \
	LOCALES_LOAD_PATH=$(LOCALES_LOAD_PATH) \
	NODE_ENV=${NODE_ENV} \
	SERVICE_WORKER_BASE_PATH=${SERVICE_WORKER_BASE_PATH} \
	STATIC_BASE_PATH=${STATIC_BASE_PATH} \
		./scripts/build_public.sh

# Phony targets

.PHONY: clean
clean:
	rm -rf ./node_modules
	rm -rf ./public/index.html
	rm -rf ./public/lib
	rm -rf ./public/service_worker.js
	rm -rf ./public/service_worker_*.js.map

.PHONY: ncu
ncu:
	ncu -u

.PHONY: prettier
prettier:
	yarn run prettier --write --print-width 180 "{scripts,src}/**/*.{js,ts,tsx}"

.PHONY: public.watch
public.watch:
	NODE_ENV=development ../../scripts/watch_trigger.sh $(MAKE) "$${PWD}/../*/src $${PWD}/public/*.mustache" "release" true

.PHONY: purge
purge:
	rm -f yarn.lock

.PHONY: release
release: clean public/index.html

.PHONY: test
test:
	yarn run jest

.PHONY: test.watch
test.watch:
	yarn run jest --watch

.PHONY: tsc
tsc:
	yarn run tsc --noEmit

.PHONY: tsc.watch
tsc.watch:
	yarn run tsc --noEmit --watch
