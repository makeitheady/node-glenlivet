var repl = require('repl');

module.exports = function () {
	this.middleware('response', function (bottleRequest, bottleResponse, next, done) {
		var options = this.options.repl || {};
		var r = repl.start('» ');

		r.context.bottleRequest = bottleRequest;
		r.context.bottleResponse = bottleResponse;
		r.context.next = next;
		r.context.done = done;
		r.context.bottle = this;

		if (!options.halt) {
			next();
		} else {
			r.on('exit', next);
		}
	});
};