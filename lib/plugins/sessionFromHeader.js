/**
 * Used to pull the session id from the header and add it to the request overrides object.  Also allows the user
 * to name the header that the session id will be pulled from. Defaults to sessionid.
 */

module.exports = function (header) {
  return function () {
    this.middleware('before request', function (request, next, done) {
      header = header || 'sessionid';
      request.overrides.sessionId = request.overrides.headers[header.toLowerCase()];
      next();
    });
  };
};