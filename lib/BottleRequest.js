var request = require('request'),
    BottleResponse = require('./BottleResponse');

var BottleRequest = function (specs) {
    this.bottle = specs.bottle;
    this.overrides = specs.overrides || {};
    this.options = specs.bottle.options || {};
    
    this._requestOptions = {
        method: this.bottle.options.method
    };
};

BottleRequest.prototype.get = function (key) {
    return this._requestOptions[key];
};

BottleRequest.prototype.set = function (key, value) {
    this._requestOptions[key] = value;
    return this;
};

BottleRequest.prototype.exec = function (callback) {
    request(this._requestOptions, function (err, request, body) {
        callback(new BottleResponse(err, request, body));
    });
    
    return this;
};

module.exports = BottleRequest;