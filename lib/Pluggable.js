var _ = require('underscore');

var Pluggable = function () {
    this._middleware = {};
    this._hooks('init');
};

Pluggable.prototype.plugins = function (plugin) {
    _.each(arguments, function (plugin) {
        plugin.call(this);
    }, this);
    
    return this;
};

Pluggable.prototype.middleware = function (type, middleware) {
    if (arguments.length >= 3) {
        _.each(_.rest(arguments), _.bind(this.middleware, this, type));
        return this;
    }
    
    var arr = this._middleware[type];
    
    if (arr) {
        if (middleware instanceof Array) {
            arr = arr.concat(middleware);
        } else {
            arr.push(middleware);
        }
    } else {
        throw new Error('no such thing as ' + type + ' middleware');
    }
    
    return this;
};

Pluggable.prototype._runMiddleware = function (type, arg, callback) {
    var args = _.toArray(arguments),
        middlewareArgs = args.slice(1, args.length - 1),
        callback = arguments[arguments.length - 1];
    
    if (typeof callback !== 'function') {
        callback = function () {};
    }
    
    var _this = this,
        i = 0,
        middlewares = this._middleware[type];
        
    if (!middlewares) {
        callback(_this);
        console.warn('`' + type + '` middleware does not exist');
        return this;
    }
    
    var next = function () {
        var middleware = middlewares[i++];
    
        if (typeof middleware === 'function') {
            middleware.apply(_this, middlewareArgs.concat([next, callback]));
        } else {
            callback.call(_this);
        }
    };

    next();
    
    return this;
};

Pluggable.prototype._hooks = function () {
    _.each(arguments, function (hook) {
        this._middleware[hook] = this._middleware[hook] || [];
    }, this);
    
    return this;
};

module.exports = Pluggable;