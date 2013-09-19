var http = require('http'),
    express = require('express'),
    Bottle = require('../lib/Bottle'),
    Cache = require('prolific-cache'),
    SessionManager = require('../lib/SessionManager'),
    sessionsPlugin = require('../lib/plugins/sessions');

var cache = new Cache(),
    sessionManager = new SessionManager(cache),
    sessions = sessionsPlugin(sessionManager),
    session = sessionManager.generateSession();

sessionManager.save(session, function () {
    describe('Sessions plugin', function () {
        it('should store cookies against session', function (done) {
            var PORT = '10100';
        
            var bottle = new Bottle({
                source: 'GET http://localhost:' + PORT,
                plugins: [sessions]
            });
        
            var app = express(),
                server = http.createServer(app);
            
            app.get('/', function (req, resp) {
                resp.cookie('foo', 'bar');
                resp.send('');
            });
            
            server.listen(PORT, function () {
                bottle.serve({
                    sessionId: session._id
                }, function (request, response) {
                    server.close();
                
                    sessionManager.read(session._id, function (err, session) {
                        session.jar.cookies[0].value.should.equal('bar');
                        done();
                    });
                });
            });
        });
    });
});