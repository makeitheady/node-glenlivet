var http = require('http'),
    express = require('express'),
    Cache = require('prolific-cache'),
    Bottle = require('../lib/Bottle');
    caching = require('../lib/plugins/caching');

describe('Caching plugin', function () {
    it('should cache the specified response data', function (done) {
        var BODY = 'Hello, world!',
            PORT = 10009;
            
        var app = express(),
            server = http.createServer(app),
            cache = new Cache();
        
        var bottle = new Bottle({
            source: 'GET http://localhost:' + PORT,
            plugins: [
                caching(cache, 'body')(10000)
            ]
        });
        
        var nmrRequests = 0;
        
        app.get('/', function (req, resp) {
            resp.send(BODY);
            nmrRequests += 1;
        });
        
        server.listen(PORT, function () {            
            bottle.serve(function (request, response) {
                response.body.should.equal(BODY);     
                       
                bottle.serve(function (request, response) {
                    server.close();
                    response.body.should.equal(BODY);
                    nmrRequests.should.equal(1);
                    done();
                });
            });
        });
    });
    
    it('should cache against source, params, and overrides', function (done) {
        var BODY = 'Hello, world!',
            PORT = 9991;
            
        var app = express(),
            server = http.createServer(app),
            cache = new Cache();
        
        var bottle = new Bottle({
            source: 'GET http://localhost:' + PORT + '/:foo',
            params: {
                uri: {
                    foo: 1
                },
                get: {
                    x: {}
                }
            },
            plugins: [
                caching(cache, 'body')(10000)
            ]
        });
        
        var nmrRequests = 0;
        
        app.get('/:foo', function (req, resp) {
            resp.send(req.param('foo') + req.query.x);
            nmrRequests += 1;
        });
        
        server.listen(PORT, function () {            
            bottle.serve({
                foo: 'bar',
                x: 3
            }, function (request, response) {
                response.body.should.equal('bar3');
                       
                bottle.serve({
                    foo: 'bar',
                    x: 3
                }, function (request, response) {
                    response.body.should.equal('bar3');
                    nmrRequests.should.equal(1);
                       
                    bottle.serve({
                        foo: 'test',
                        x: 2
                    }, function (request, response) {
                        server.close();
                        response.body.should.equal('test2');
                        nmrRequests.should.equal(2);
                        done();
                    });
                });
            });
        });
    });
});