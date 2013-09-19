var md5 = require('MD5'),
    _ = require('underscore');

module.exports = function (cache, responseProperty) {
    return function () {
        this.middleware('request', function (request, next, done) {
            request.cacheKey = createCacheKey(request);
            
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
            if (response[responseProperty]) {
                cache.write('glenlivet_responses', request.cacheKey, response[responseProperty], next);
                cache.setExpiration('glenlivet_responses', request.cacheKey);
            } else {
                next();
            }
        });
    };
};

var createCacheKey = function (request) {
    return md5(JSON.stringify({
        source: request.options.source,
        params: request.options.params,
        overrides: request.overrides
    }));
};