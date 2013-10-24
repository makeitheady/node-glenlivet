var http = require('http'),
    express = require('express'),
    request = require('request'),
    Glenlivet = require('../lib/Glenlivet');

describe('Bottle-serving endpoint', function () {
    describe('with no middleware', function () {
        it('should return the html of the source page', function (done) {
            var BOTTLE_NAME = Date.now(),
                SOURCE_PORT = 10006,
                GLENLIVET_PORT = 10005,
                SOURCE_URI = 'http://localhost:' + SOURCE_PORT,
                HTML = '<html><body>Hello</body></html>',
                BOTTLE_ENDPOINT = 'http://localhost:' + GLENLIVET_PORT + '/' + BOTTLE_NAME + '.body';
            
            var app = express(),
                server = http.createServer(app);
            
            //Setup mock page that Glenlivet integrates over
            app.get('/', function (req, resp) {
                resp.send(HTML);
            });
            
            //Create bottle that extracts from mock page
            Glenlivet.bottle(BOTTLE_NAME, {
                source: 'GET ' + SOURCE_URI
            });
            
            Glenlivet.server.start(GLENLIVET_PORT, function () {
                server.listen(SOURCE_PORT, function () {
                    //Once server is ready, request from the bottle endpoint
                    request(BOTTLE_ENDPOINT, function (error, response, body) {
                        body.should.equal(HTML);
                        server.close();
                        done();
                    });
                });
            });
        });
    });
});