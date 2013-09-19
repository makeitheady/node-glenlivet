var request = require('request'),
    md5 = require('MD5');

var Session = function () {
    this._id = generateId();
    this.jar = request.jar();
};

Session.prototype.consumeResponseHeaders = function (headers) {
    this._consumeCookies(headers['set-cookie'] || headers['Set-Cookie']);
    return this;
};

Session.prototype._consumeCookies = function (cookies) {
    var jar = this.jar;
	          
    if (typeof cookies === 'object') {
        cookies.forEach(function (cookie) {
            jar.add(cookie);
        });
    } else if (typeof cookies === 'string') {
        jar.add(cookies);
    }
    
    return this;
};

var generateId = function () {
    return md5(Date.now() + Math.random());
};

module.exports = Session;