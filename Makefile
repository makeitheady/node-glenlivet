test:
	node_modules/.bin/mocha --require should --reporter spec test
        
watch:
	node_modules/.bin/mocha --require should --reporter spec --watch test

.PHONY: all test