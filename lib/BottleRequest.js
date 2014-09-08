var request = require('request'),
    BottleResponse = require('./BottleResponse'),
    _ = require('underscore');

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
    var _this = this,
        opts = this._requestOptions;

    if (!opts.uri) {
        process.nextTick(function () {
            callback(new BottleResponse(null, {}, {}));
        });
    } else {


        /*Cookies don't propagate through when there are redirects. When "propagateCookiesForRedirect" is set, set the "followRedirect" option
         to false in order to prevent redirects. "propagateCookiesForRedirect" flag will be used in sessions plugin,
         response middleware
         */

        if(opts.propagateCookiesForRedirect){
          opts.followRedirect = false;
        }

        //In some cases the jar does not get properly translated to the cookie header
        if (opts.jar) {
            opts.headers = opts.headers || {};
            opts.headers.cookie = (function () {
                var cookies = opts.jar.cookies,
                    parts = [];

                _.each(cookies, function (cookie) {
                    if (typeof cookie === 'object') {
                        parts.push(cookie.name + '=' + cookie.value); 
                    }
                });

                return parts.join('; ');
            }());

            delete opts.jar;
        }

        request(opts, function (err, response, body) {
            callback(new BottleResponse(err, response, body));
        });
    }
    
    return this;
};

module.exports = BottleRequest;