module.exports = function (sessionManager) {
    return function (required) {
        required = required || false;
        
        return function () {
            var bottle = this;
            var options = bottle.options.sessions || {};

            this.middleware('init', function (next) {
                var getParams = this.options.params.get = this.options.params.get || {};
                
                getParams.sessionId = {
                    required: required,
                    description: 'A valid sessionId.'
                };
                
                next();
            });
            
            this.middleware('before request', function (request, next, done) {
                sessionManager.read(request.overrides.sessionId, function (err, session) {
                    if (session) {
                        request.set('jar', session.jar);
                        request.session = session;
                        next();
                    } else if (required) {
                        var newSession = sessionManager.generateSession();
                        sessionManager.save(newSession);
                        done({
                            json: {
                                error: 'active sessionId required',
                                sessionId: newSession._id
                            }
                        });
                    } else {
                        next();
                    }
                });
            });

            this.middleware('always', function (bottleRequest, preResponse, next) {
                if (preResponse.json && preResponse.json.error) {
                    preResponse.httpStatus = 500;
                }

                next();
            });
        
            this.middleware('response', function (request, response, next) {
                var session = request.session;
            
                if (session && response.response.headers) {
                    session.consumeResponseHeaders(response.response.headers);
                }
            
                next();
            });

            this.middleware('after response', function (request, response, next) {
                if (options.doNotSaveSession
                    || (response.error && options.doNotSaveSessionOnError)) {
                    return next();
                }

                var session = request.session;
                sessionManager.save(session);
                next();
            });
        };
    };
};