var http = require('http'),
    express = require('express'),
    caching = require('./plugins/caching'),
    Bottle = require('./Bottle');

var app = express(),
    server = http.createServer(app);

app.get('/:bottle.:property', function (req, resp) {
    Glenlivet.serve(req.param('bottle'), req.query, function (err, bottleRequest, bottleResponse) {
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
    });
});

var Glenlivet = {
    _bottles: {},
    
    plugins: {
        caching: require('./plugins/caching'),
        sessions: require('./plugins/sessions'),
        htmlToJson: require('./plugins/htmlToJson')
    },
    
    bottle: function (name, specs) {
        var bottle = this._bottles[name] = new Bottle(specs);
        return bottle;
    },
    
    serve: function (name, overrides, callback) {
        var bottle = this._bottles[name];
        
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