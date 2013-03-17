test:
	@NODE_ENV=test mocha

install:
	./bin/setup

.PHONY: test install