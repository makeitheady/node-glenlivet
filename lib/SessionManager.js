var Session = require('./Session');

var SessionManager = function (cache) {
    this._cache = cache;
};

SessionManager.prototype.attachEndpoints = function (app) {
    var _this = this;
    
    app.get('/sessions/new', function (req, resp) {
        var session = _this.generateSession();
        _this.save(session);
        resp.send(session);
    });
    
    app.get('/sessions/:id', function (req, resp) {
        _this.read(req.param('id'), function (err, session) {
            resp.send(session);
        });
    });
    
    app.get('/sessions/:id/logout', function (req, resp) {
        _this.read(req.param('id'), function (err, session) {
            session._clearCookies();
            _this.save(session);
            resp.send(session);
        });
    });
    
    return this;
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