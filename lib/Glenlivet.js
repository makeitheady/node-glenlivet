var http = require('http'),
    express = require('express'),
    caching = require('./plugins/caching'),
    Bottle = require('./Bottle');

var app = express(),
    server = http.createServer(app);

//Returns a function that will respond to an http request with the results of a bottle serve
var HttpBottleResponder = function (req, resp) {
    return function (err, bottleRequest, bottleResponse) {
        var value;
    
        if (!err) {
            value = bottleResponse[req.param('property')];
        } else {
            value = {
                error: err.toString()
            };
        
            resp.status(500);
        }
    
        resp.send(value);
    };
};

app.use(express.bodyParser());

app.get('/:bottle.:property', function (req, resp) {
    Glenlivet.serve(req.param('bottle'), req.query, new HttpBottleResponder(req, resp));
});

var Glenlivet = {
    _bottles: {},
    
    plugins: {
        caching: require('./plugins/caching'),
        sessions: require('./plugins/sessions'),
        htmlToJson: require('./plugins/htmlToJson')
    },
    
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
        var getParams = specs.getParams || function () { return {}; };
        
        app[specs.method.toLowerCase()](specs.path, function (req, resp) {
            var overrides = getParams(req) || {},
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
        start: function (port, callback) {
            server.listen(port, callback);
            return this;
        },
        app: app
    }
};

module.exports = Glenlivet;