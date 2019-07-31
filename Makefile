.DEFAULT_GOAL = all
.PHONY = pretty_backend pretty_frontend

JS_SOURCES = $(shell find src -name "*.js")
RUST_SOURCES = $(shell find backend/src -name "*.rs")
SCSS_SOURCES = $(shell find scss -name "*.scss")

all: backend frontend

backend: backend/target/debug/personalidol

backend/target/debug/personalidol: $(RUST_SOURCES)
	cd backend && cargo build

build/index.css: $(SCSS_SOURCES)
	yarn run sass:build

build/index.html: $(JS_SOURCES)
	yarn run build

flow.watch: node_modules
	yarn run flow:watch:inotify

frontend: build/index.html build/index.css

node_modules: yarn.lock
	yarn install --network-timeout 9000000

pretty: pretty_backend pretty_frontend

pretty_backend:
	rustup component add rustfmt
	cd backend && cargo fmt --all

pretty_frontend:
	yarn run prettier

sass.watch:
	yarn run sass:watch

test: test.backend test.frontend

test.backend: $(RUST_SOURCES)
	cd backend && cargo test

test.frontend: $(JS_SOURCES) node_modules
	yarn run test:once

test.frontend.watch: node_modules
	yarn run test

start: node_modules
	yarn run start
