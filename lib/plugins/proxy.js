/**
 * This is used to have glenlivet requests go through a proxy.  This will only work on bottles.  Any
 * requests made directly will need to handle their own proxy management.
 */

module.exports = function (proxyUriString) {
  return function () {
    this.middleware('request', function (request, next, done) {
      // If proxyUriString is false, the proxy will be skipped
      if (proxyUriString) {
        request._requestOptions['proxy'] = proxyUriString;
        request._requestOptions['http-proxy'] = proxyUriString;
        request._requestOptions['rejectUnauthorized'] = false;
      }
      next();
    });
  };
};