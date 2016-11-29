var path = require('path'),
    _ = require('underscore'),
    cheerio = require('cheerio');

var JQUERY_PATH = path.resolve(__dirname, '../jquery.js');

var htmlToJson = function (html, structure, callback) {
    parse(html, function (err, $) {
        if (err) {
            callback(err, null);
            return;
        }

        var parseStructure = function (context, $context, structure) {
            if (!structure) {
                structure = $context;
                $context = context;
                context = {};
            }

            var methods = {
                map: function (selector, structure) {
                    var items = [];

                    $context.find(selector).each(function () {
                        var $this = $(this),
                            item = parseStructure($this, structure);

                        if (item !== null) items.push(item);
                    });

                    return items;
                }
            };

            if (typeof structure === 'function') {
                structure = structure.call(methods, $context, $);
            }

            _.each(structure, function (v, k) {
                if (typeof v === 'object') {
                    context[k] = {};
                    parseStructure(context[k], $context, v);
                } else if (typeof v === 'function') {
                    context[k] = v.call(methods, $context, $);
                }
            });

            return context;
        };

        callback(null, parseStructure($('html'), structure));
    });
};

var parse = function (html, callback) {
    process.nextTick(function () {
        callback(null, cheerio.load(html));
    });
};

module.exports = function () {
    var structure = this.options.json;

    this.middleware('response', function (request, response, next) {
        htmlToJson(response.body, structure, function (err, json) {
            response.error = err;
            response.json = json;
            next();
        });
    });
};

module.exports.parse = htmlToJson;
