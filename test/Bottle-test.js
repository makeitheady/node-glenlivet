var http = require('http'),
    express = require('express'),
    should = require('should'),
    Bottle = require('../lib/Bottle');

var KvParamTest = function (description, type, property) {
    describe(description, function () {
        it('should attach default params', function (done) {
            var VALUE = 'bar';
        
            var params = {}; params[type] = { foo: VALUE };
        
            var bottle = new Bottle({
                source: 'POST http://localhost',
                params: params
            });

            bottle.middleware('request', function (request, next) {
                request.get(property).foo.should.equal(VALUE);
                done();
            });
        
            bottle.serve();
        });
    
        it('should use overridden params', function (done) {
            var VALUE = 'test';
        
            var params = {}; params[type] = { foo: 'bar' };
        
            var bottle = new Bottle({
                source: 'POST http://localhost',
                params: params
            });

            bottle.middleware('request', function (request, next) {
                request.get(property).foo.should.equal(VALUE);
                done();
            });
        
            bottle.serve({ foo: VALUE });
        });
    
        it('should map keys to their aliases', function (done) {
            var VALUE = 'bar';
        
            var params = {}; params[type] = { foo: { map: 'biz' } };
        
            var bottle = new Bottle({
                source: 'POST http://localhost',
                params: params
            });
        
            bottle.middleware('request', function (request, next) {
                request.get(property).biz.should.equal(VALUE);
                done();
            });
        
            bottle.serve({ foo: VALUE });
        });
    });
};

describe('Bottle', function () {
    describe('GET requests', function () {
        it('should respond with content of page', function (done) {
            var BODY = '<html><body></body></html>',
                PORT = 10001;
            
            var bottle = new Bottle({
                source: 'GET http://localhost:' + PORT
            });
                
            var app = express(),
                server = http.createServer(app);
            
            app.get('/', function (req, resp) {
                resp.send(BODY);
            });
            
            server.listen(PORT, function () {            
                bottle.serve(function (err, request, response) {
                    server.close();
                    should.equal(response.error, null);
                    response.body.should.equal(BODY);
                    done();
                });
            });
        });
    });
    
    describe('URIs', function () {
        it('should be assembled with default URIs when no overrides', function (done) {
            var bottle = new Bottle({
                source: 'GET http://localhost/:foo/:bar/:biz:baz',
                params: {
                    uri: {
                        'foo': 'hello',
                        'bar': 'world',
                        'biz': 'hi',
                        'baz': 'there'
                    }
                }
            });
            
            bottle.middleware('request', function (request, next) {
                request.get('uri').should.equal('http://localhost/hello/world/hithere');
                done();
            });
            
            bottle.serve();
        });
        
        it('should use overrides when provided', function () {
            var bottle = new Bottle({
                source: 'POST http://localhost/:foo/bar',
                params: {
                    uri: {
                        'foo': 'hello'
                    }
                }
            });

            bottle.middleware('request', function (request, next) {
                request.get('uri').should.equal('http://localhost/test/bar');
            });
            
            bottle.serve({ foo: 'test' });
        });
    });
    
    describe('middleware', function () {
        it('should allow init middleware', function (done) {
            var bottle = new Bottle({
                source: 'GET http://localhost:93939',
                plugins: [
                    function () {
                        this.middleware('init', function () {
                            done();
                        });
                    }
                ]
            });
        });
        
        it('should allow request middleware', function (done) {
            var bottle = new Bottle({
                source: 'GET http://localhost:93939',
                plugins: [
                    function () {
                        this.middleware('request', function () {
                            done();
                        });
                    }
                ]
            });
            
            bottle.serve(function () {});
        });
        
        it('should allow response middleware', function (done) {
            var BODY = 'Hello, world!',
                PORT = 10005;
            
            var bodyLength = function () {
                this.middleware('response', function (request, response, next) {
                    response.bodyLength = response.body.length;
                    next();
                });
            };
                
            var app = express(),
                server = http.createServer(app);
            
            app.get('/', function (req, resp) {
                resp.send(BODY);
            });
            
            server.listen(PORT, function () {            
                bottle.serve(function (err, request, response) {
                    server.close();
                    should.equal(response.error, null);
                    response.bodyLength.should.equal(BODY.length);
                    done();
                });
            });
            
            var bottle = new Bottle({
                source: 'GET http://localhost:' + PORT,
                plugins: [bodyLength]
            });
        });
    });
    
    KvParamTest('Query params', 'get', 'qs');
    
    KvParamTest('Post body params', 'post', 'form');
});

module.exports = Bottle;