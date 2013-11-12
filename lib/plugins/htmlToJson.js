var path = require('path'),
    _ = require('underscore'),
    cheerio = require('cheerio'),
    jsdom = require('jsdom');

var JQUERY_PATH = path.resolve(__dirname, '../jquery.js');

var htmlToJson = function (html, structure, callback) {
    currentParser(html, function (err, $) {
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

htmlToJson.setParser = function (name) {
    currentParser = parsers[name] || currentParser;
};

var parsers = {};

var cheerioParser = parsers.cheerio = function (html, callback) {
    process.nextTick(function () {
        callback(null, cheerio.load(html));
    });
};

var jsdomParser = parsers.jsdom = function (html, callback) {
    jsdom.env(html || '<html><body></body></html>', [JQUERY_PATH], function (err, window) {
        callback(err, window? window.$: null);
    });
};

var currentParser = jsdomParser;

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