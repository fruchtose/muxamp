test:
	@NODE_ENV=test mocha

install:
ifdef force
	./bin/setup --force
else
	./bin/setup
endif

.PHONY: test install