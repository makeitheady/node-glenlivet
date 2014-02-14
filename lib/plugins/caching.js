var md5 = require('MD5'),
    _ = require('underscore');

module.exports = function (cache) {
    return function () {
        var bottle = this;
        var options = bottle.options.caching || {};
        var responseProperty = options.responseProperty || 'json';
        var expiration = options.expiration || 60000;

        this.middleware('request', function (request, next, done) {
            request.cacheKey = createCacheKey(request, options.ignoreKeys);
            request.doInvalidateCache = request.overrides._invalidate === '1';
            request.doSkipCache = request.overrides._nocache === '1';
            
            //Listen for option to invalidate the cache
            if (request.doInvalidateCache) {
                cache.invalidate('glenlivet_responses', request.cacheKey);
            }
            
            //Listen for option to skip cache read
            if (request.doSkipCache) {
                next();
                return;
            }
        
            cache.read('glenlivet_responses', request.cacheKey, function (err, value) {
                var out = {};
                
                if (value) {
                    out[responseProperty] = value;
                    done(out);
                } else {
                    next();
                }
            });
        });

        this.middleware('response', function (request, response, next) {
            if (request.doSkipCache === false && response[responseProperty]) {
                cache.write('glenlivet_responses', request.cacheKey, response[responseProperty]);
                expiration && cache.setExpiration('glenlivet_responses', request.cacheKey, expiration);
            }

            next();
        });
    };
};

var createCacheKey = function (request, ignoreKeys) {
    var overrides = {};
    ignoreKeys = ignoreKeys || [];

    //Filter out anything that's underscored
    //or configured to be ignored
    _.each(request.overrides, function (v, k) {
        if (k[0] !== '_' && ignoreKeys.indexOf(k) < 0) {
            overrides[k] = v;
        }
    });

    var json = JSON.stringify({
        source: request.options.source,
        params: request.options.params,
        overrides: overrides
    });

    return md5(json);
};