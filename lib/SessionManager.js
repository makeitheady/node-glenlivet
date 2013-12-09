var Session = require('./Session');

var SessionManager = function (cache) {
    this._cache = cache;
};

SessionManager.prototype.read = function (id, callback) {
    this._cache.read('sessions', id, function (err, data) {
        var session = null;
        
        if (data) {
            if (data.cookies && data.cookies.length) {
                for (var i = 0; i < data.cookies.length; i++) {
                    if (!(data.cookies[i].expires instanceof Date)) {
                        data.cookies[i].expires = new Date(data.cookies[i].expires);
                    }
                }
            }

            session = new Session();
            session._id = id;
            session.jar.cookies = data.cookies;
            session.meta = data.meta;
        }
        
        callback(err, session);
    });
    
    return this;
};

SessionManager.prototype.save = function (session, callback) {
    this._cache.write('sessions', session._id, {
        id: session._id,
        cookies: session.jar.cookies,
        meta: session.meta || {}
    }, callback);
    
    return this;
};

SessionManager.prototype.generateSession = function () {
    return new Session();
};

module.exports = SessionManager;