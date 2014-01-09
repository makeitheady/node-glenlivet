var repl = require('repl');

module.exports = function () {
	this.middleware('response', function (bottleRequest, bottleResponse, next, done) {
		var options = this.options.repl || {};
		var r = repl.start('» ');

		var doNotCallNext = false;

		r.context.bottleRequest = bottleRequest;
		r.context.bottleResponse = bottleResponse;
		r.context.bottle = this;

		r.context.next = function () {
			if (doNotCallNext) return;

			doNotCallNext = true;
			next();
		};

		r.context.done = function () {
			if (doNotCallNext) return;

			doNotCallNext = true;
			done();
		};

		if (!options.halt) {
			doNotCallNext = true;
			next();
		} else {
			r.on('exit', function () {
				if (!doNotCallNext) {
					next();
				}
			});
		}
	});
};