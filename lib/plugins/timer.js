var _ = require('underscore');

function getNext (args) {
	args = Array.prototype.slice.call(args);
	for (var i = 0; i < args.length; i++) {
		if (_.isFunction(args[i])) {
			return args[i];
		}
	}
}

function now () {
	return new Date().getTime();
}

function Timer () {
	this.start = now();
	this.markers = {};
	this.markers.start = this.start;
	return this;
}

Timer.prototype.mark = function (name) {
	this.markers[name] = now();
	return this.markers[name];
};

Timer.prototype.end = function (name) {
	this.end = this.mark('end');
};

Timer.prototype.diff = function (name1, name2) {
	var mark1 = this.getMarker(name1);
	var mark2 = this.getMarker(name2);
	return this.convertUnits(mark2 - mark1);
};

Timer.prototype.getMarker = function (name) {
	if (this.markers.hasOwnProperty(name)) {
		return this.markers[name];
	} else {
		throw new Error('Marker "' + name + '" does not exist');
	}
};

Timer.prototype.convertUnits = function (time) {
	return this.useSeconds ? time / 1000 : time;
};

Timer.prototype.elapsed = function () {
	return this.diff('start', 'end');
};

var middlewares = [
	'before request',
	'request',
	'before response',
	'response',
	'after response'
];

module.exports = function () {
	var bottle = this;

	if (bottle.options.timer && bottle.options.timer.middlewares) {
		middlewares = bottle.options.timer.middlewares;
	}

	bottle.middleware('before request', function (bottleRequest, next) {
		bottleRequest.timer = new Timer();
		if (bottle.options.timer && bottle.options.timer.useSeconds) {
			bottleRequest.timer.useSeconds = true;
		}

		next();
	});

	middlewares.forEach(function (name) {
		bottle.middleware(name, function (bottleRequest) {
			bottleRequest.timer.mark(name);
			getNext(arguments)();
		});
	});

	bottle.middleware('after response', function (bottleRequest, bottleResponse, next) {
		var timer = bottleRequest.timer;
		timer.end();

		var timerResults = {
			total: timer.elapsed(),
			request: timer.diff('request', 'before response'),
			processing: timer.diff('before response', 'after response')
		};

		if (bottle.options.timer && bottle.options.timer.processor) {
			_.extend(timerResults, bottle.options.timer.processor(timer));
		}

		bottleRequest.timerResults = timerResults;
		next();
	});
};
