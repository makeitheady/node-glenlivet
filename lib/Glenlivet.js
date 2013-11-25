var http = require('http'),
    express = require('express'),
    _ = require('underscore'),
    caching = require('./plugins/caching'),
    Bottle = require('./Bottle'),
    SessionManager = require('./SessionManager');

var app,
    server;

//Returns a function that will respond to an http request with the results of a bottle serve
var HttpBottleResponder = function (req, resp) {
    return function (err, bottleRequest, bottleResponse) {
        var value;
    
        if (!err) {
            value = bottleResponse[req.param('property')];
        } else {
            value = {
                error: err[0]? err[0].message: err.message
            };
        
            resp.status(500);
        }
    
        resp.send(value);
    };
};

var sessionBottles = function () {
    Glenlivet.bottle('newSession', {
        title: 'New Session',
        description: 'Generates an active session.',
        source: null,
        rest: {
            path: '/sessions/new',
            method: 'get'
        },
        plugins: [
            function () {
                this.middleware('before request', function (bottleRequest, next, done) {
                    var sessionManager = Glenlivet._sessionManager,
                        session = sessionManager.generateSession();
                        
                    sessionManager.save(session);
                    
                    done({
                        json: {
                            sessionId: session._id
                        }
                    });
                });
            }
        ]
    });
    
    return this;
};

var Glenlivet = {
    _bottles: {},
    
    plugins: {
        caching: require('./plugins/caching'),
        sessions: require('./plugins/sessions'),
        htmlToJson: require('./plugins/htmlToJson')
    },
    
    init: function (options) {
        var cache = options.cache,
            sessionManager = new SessionManager(cache);
        
        //Start server
        if (options.server) {
            this.server.start(options.server.port, options.server.use, options.server.callback);
        }
        
        //Attach sessionManager to Glenlivet
        this._sessionManager = sessionManager;
        sessionBottles();
        
        //Plug cache into caching and sessions plugin
        this.plugins.sessions = this.plugins.sessions(sessionManager);
        this.plugins.caching = this.plugins.caching(cache);
        
        return this;
    },
    
    _sessionManager: null,
    
    getBottle: function (name) {
        return this._bottles[name] || null;
    },
    
    bottle: function (name, specs) {
        var bottle = this._bottles[name] = new Bottle(specs);
        
        if (specs.rest) {
            this._createRESTEndpoint(bottle, specs.rest);
        }
        
        return bottle;
    },
    
    _createRESTEndpoint: function (bottle, specs) {
        if (!this.server.app) return;
        
        var getParams = bottle.options.rest.getParams || function (req) {
            var paramMap = bottle.options.rest.paramMap || {},
                params = {};
            
            _.each(paramMap, function (type, name) {
                switch (type) {
                    case 'uri':
                        params[name] = req.param(name) || null;
                        break;
                    case 'post':
                        params[name] = req.body[name] || null;
                        break;
                }
            });
            
            return params;
        };
            
        app[specs.method.toLowerCase()](specs.path, function (req, resp) {
            var overrides = _.extend({}, req.query, req.body, getParams(req)),
                responder = new HttpBottleResponder(req, resp);
                
            bottle.serve(overrides, function (err, bottleRequest, bottleResponse) {
                //Explicitly set the "property" param, which the responder 
                //uses to pull data from Glenlivet response object
                req.params.property = 'json';
                responder.apply(this, arguments);
            });
        });
    },
    
    serve: function (name, overrides, callback) {
        var bottle = this.getBottle(name);
        
        if (bottle) {
            bottle.serve(overrides, callback);
        } else {
            callback(new Error('bottle ' + name + ' is not defined'), null);
        }
        
        return this;
    },
    
    server: {
        start: function (port, use, callback) {
            app = this.app = express();
            server = this.httpServer = http.createServer(app);
            server.listen(port, callback);
            
            this.app.use(express.bodyParser());

            if (use && use.length) {
                for (var i = 0; i < use.length; i++) {
                    this.app.use(use[i]);
                }
            }

            this.app.get('/:bottle.:property', function (req, resp) {
                Glenlivet.serve(req.param('bottle'), req.query, new HttpBottleResponder(req, resp));
            });
            
            return this;
        },
        app: null,
        httpServer: null
    }
};

module.exports = Glenlivet;