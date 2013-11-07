var Session = require('./Session');

var SessionManager = function (cache) {
    this._cache = cache;
};

SessionManager.prototype.read = function (id, callback) {
    this._cache.read('sessions', id, function (err, meta) {
        var session = null;
        
        if (meta) {
            session = new Session();
            session._id = id;
            session.jar.cookies = meta.cookies;
        }
        
        callback(err, session);
    });
    
    return this;
};

SessionManager.prototype.save = function (session, callback) {
    this._cache.write('sessions', session._id, {
        id: session._id,
        cookies: session.jar.cookies
    }, callback);
    
    return this;
};

SessionManager.prototype.generateSession = function () {
    return new Session();
};

module.exports = SessionManager;