var request = require('request'),
    md5 = require('MD5');

var Session = function () {
    this._id = generateId();
    this.jar = request.jar();
    this.meta = {};
};

Session.prototype.consumeResponseHeaders = function (headers) {
    this._consumeCookies(headers['set-cookie'] || headers['Set-Cookie']);
    return this;
};

Session.prototype._clearCookies = function () {
    this.jar = request.jar();
    return this;
};

Session.prototype._consumeCookies = function (data) {
    var jar = this.jar;

    if (typeof data === 'object') {
        data.forEach(function (cookie) {
            jar.add(request.cookie(cookie));
        });
    } else if (typeof data === 'string') {
        jar.add(request.cookie(data));
    }
    
    return this;
};

var generateId = function () {
    return md5(Date.now() + Math.random());
};

module.exports = Session;