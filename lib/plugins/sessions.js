module.exports = function (sessionManager, required) {
    required = required || true;
    
    return function () {
        this.middleware('request', function (request, next, done) {
            sessionManager.read(request.overrides.sessionId, function (err, session) {
                if (session) {
                    request.set('jar', session.jar);
                    request.session = session;
                    next();
                } else if (required) {
                    done({
                        error: new Error('sessionId required')
                    });
                } else {
                    next();
                }
            });
        });
        
        this.middleware('response', function (request, response, next) {
            var session = request.session;
            
            if (session) {
                session.consumeResponseHeaders(response.response.headers);
                sessionManager.save(session);
            }
            
            next();
        });
    };
};