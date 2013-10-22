var md5 = require('MD5'),
    _ = require('underscore');

module.exports = function (cache, responseProperty) {
    return function (expiration) {
        return function () {
            this.middleware('request', function (request, next, done) {
                request.cacheKey = createCacheKey(request);
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
                    cache.write('glenlivet_responses', request.cacheKey, response[responseProperty], next);
                    expiration && cache.setExpiration('glenlivet_responses', request.cacheKey, expiration);
                } else {
                    next();
                }
            });
        };
    };
};

var createCacheKey = function (request) {
    return md5(JSON.stringify({
        source: request.options.source,
        params: request.options.params,
        overrides: request.overrides
    }));
};