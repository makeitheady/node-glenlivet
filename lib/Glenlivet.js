var Bottle = require('./Bottle');

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
    }
};

module.exports = Glenlivet;