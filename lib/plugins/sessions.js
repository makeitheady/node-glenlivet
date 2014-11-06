var requestClient = require('request'),
  _ = require('underscore');

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
                if (request.overrides._session) {
                  request.session = request.overrides._session;
                  request.overrides.sessionId = request.session._id;
                  next();
                  return;
                }

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

              if(request._requestOptions.propagateCookiesForRedirect){
                var redirect = response.response.headers.location,
                  followRedirect = function(location){
                    var options = {
                      followRedirect: false,
                      jar: request.session.jar,
                      uri: location
                    };

                    //In some cases the jar does not get properly translated to the cookie header. Stolen from/refer to BottleRequest.js
                    if (options.jar) {
                      options.headers = options.headers || {};
                      options.headers.cookie = (function () {
                        var cookies = options.jar.cookies,
                          parts = [];

                        _.each(cookies, function (cookie) {
                          if (typeof cookie === 'object') {
                            parts.push(cookie.name + '=' + cookie.value);
                          }
                        });

                        return parts.join('; ');
                      }());

                      delete options.jar;
                    }

                    requestClient(options, function (error, requestResponse, body) {
                      var redirect = requestResponse.headers.location;

                      if(redirect){
                        request.session.consumeResponseHeaders(requestResponse.headers);//update jar with new cookie headers.
                        followRedirect(redirect);
                      }
                      else{
                        next();
                      }
                    });
                  };

                redirect ? followRedirect(redirect) : next();
              }
              else{
                next();
              }
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
