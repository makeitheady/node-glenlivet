var _ = require('underscore'),
    Pluggable = require('./Pluggable'),
    BottleRequest = require('./BottleRequest');

var Bottle = function (options) {
    Pluggable.call(this);
    
    var sourceParts = options.source.split(' ');
    
    this.options = _.extend(options, {
        method: sourceParts[0].toLowerCase(),
        uriPattern: sourceParts[1],
        params: options.params || { uri: null, get: null, post: null, headers: null }
    });

    this._hooks('request', 'response');
    
    this._attachDefaultRequestMiddleware();
    
    this.plugins.apply(this, this.options.plugins);
    
    this._runMiddleware('init');
};

Bottle.prototype.__proto__ = Pluggable.prototype;

Bottle.prototype.addParam = function (type, key, options) {
    var paramType = this.options.params[type] = this.options.params[type] || {};
    paramType[key] = options;
    return this;
};

Bottle.prototype.serve = function (overrides, callback) {
    if (!callback) {
        if (typeof overrides === 'function') {
            callback = overrides;
            overrides = {};
        } else {
            callback = function () {};
        }
    }
    
    var _this = this;
    
    var bottleRequest = new BottleRequest({
        options: this.options,
        overrides: overrides
    });
    
    this._runMiddleware('request', bottleRequest, function (preResponse) {
        if (typeof preResponse !== 'undefined') {
            callback.call(_this, preResponse.error || null, bottleRequest, preResponse);
            return;
        }
        
        bottleRequest.exec(function (bottleResponse) {
            var respond = function () {
                callback.call(_this, bottleResponse.error || null, bottleRequest, bottleResponse);
            }
            
            if (bottleResponse.error) {
                respond();
                return;
            }
            
            _this._runMiddleware('response', bottleRequest, bottleResponse, respond);
        });
    });
    
    return this;
};

Bottle.prototype._eachParam = function (type, block) {
    _.each(this.options.params[type], function (param, key) {
        if (typeof param === 'string') {
            param = {
                default: param
            };
        }
    
        block(param, key);
    });
};

Bottle.prototype._attachDefaultRequestMiddleware = function () {
    this.middleware('request', uriParamParser);
    
    this.options.params.get && this.middleware('request', getParamParser);
    this.options.params.post && this.middleware('request', postParamParser);
    this.options.params.header && this.middleware('request', headerParamParser);
};

//Default request middleware
var uriParamParser = function (request, next) {
    var uri = this.options.uriPattern,
        overrides = request.overrides;
    
    this._eachParam('uri', function (param, key) {
        uri = uri.replace(new RegExp(':' + key + '(?=/|$|:)', 'g'), overrides[key] || param.default || '');
    });
    
    request.set('uri', uri);
    
    next();
};

var KvParamParser = function (type, targetProperty) {
    return function (request, next) {
        var overrides = request.overrides,
            values = {};
    
        this._eachParam(type, function (param, key) {
            var alias = param.map || null;
        
            if (overrides[key]) {
                values[alias || key] = overrides[key];
            } else if (param.default) {
                values[alias || key] = param.default;
            }
        });
    
        request.set(targetProperty, values);
    
        next();
    };
};

var getParamParser = KvParamParser('get', 'qs');

var postParamParser = KvParamParser('post', 'post');

var headerParamParser = KvParamParser('headers', 'headers');

module.exports = Bottle;