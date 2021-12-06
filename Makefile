define FOREACH
	for DIR in packages/*; do \
		if [ -d $$DIR ]; then \
			echo $$DIR; \
			$(MAKE) -C $$DIR $(1); \
		fi \
	done
endef

# Real targets

yarn.lock: package.json packages/*/package.json

node_modules:
	yarn install --check-files --frozen-lockfile --non-interactive

# Phony targets

.PHONY: bootstrap
bootstrap: node_modules

.PHONY: fmt
fmt: prettier

.PHONY: prettier
prettier: bootstrap
	$(call FOREACH,prettier)

.PHONY: clean
clean:
	$(call FOREACH,clean)
	rm -rf node_modules

.PHONY: ncu
ncu:
	$(call FOREACH,ncu)

.PHONY: purge
purge: clean
	$(call FOREACH,purge)
	rm -f yarn.lock

.PHONY: release
release: bootstrap
	$(MAKE) -C packages/bootstrap release

.PHONY: test
test: bootstrap
	$(call FOREACH,test)
