var fs = require('fs'),
     _ = require('underscore'),
     getProperty = require('../getProperty');

var defaults = {
    bottleRequest: [],
    bottleResponse: [],
    bottle: [],
    secrets: []
};

var logStream;

module.exports = function () {
    var bottle = this,
        options = _.extend({}, defaults, bottle.options.log || {});

    if (!logStream) {
        logStream = options.filename ? fs.createWriteStream(options.filename, {flags: 'a'}) : process.stdout;
    }

    this.middleware('after response', function (bottleRequest, bottleResponse, next) {
        var logItem = {
            timestamp: new Date().toGMTString(),
            bottle: bottle.options.name
        };

        var i, propName;

        for (i = 0; i < options.bottleRequest.length; i++) {
            propName = options.bottleRequest[i];
            logItem[propName] = getProperty(bottleRequest, propName);
        }

        for (i = 0; i < options.bottleResponse.length; i++) {
            propName = options.bottleResponse[i];
            logItem[propName] = getProperty(bottleResponse, propName);
        }

        for (i = 0; i < options.bottle.length; i++) {
            propName = options.bottle[i];
            logItem[propName] = getProperty(bottle, propName);
        }

        var overrides = bottleRequest.overrides;
        logItem.overrides = {};
        for (var key in overrides) if (overrides.hasOwnProperty(key)) {
            if (options.secrets.indexOf(key) < 0) {
                logItem.overrides[key] = overrides[key];
            } else {
                logItem.overrides[key] = '[hidden]';
            }
        }

        try {
            logStream.write(JSON.stringify(logItem) + '\n');
        } catch (e) {
            // let's not let writing to the log crash the server, shall we?
            console.error('Log error: ', e);
        }

        next();
    });
};