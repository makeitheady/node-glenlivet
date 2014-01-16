var repl = require('repl'),
	   _ = require('underscore');

var currentRepl = null;

module.exports = function () {
	var bottle = this;
	var options = bottle.options.inspect || {};

	var middlewareName = options.middlewareName || 'response';

	this.middleware(middlewareName, function () {
		var args = getArgs(arguments);

		if (currentRepl) {
			exit(currentRepl);
			currentRepl = null;
		}

		var r = repl.start('» ');
		currentRepl = r;

		r.context.bottleRequest = args.bottleRequest;
		r.context.bottleResponse = args.bottleResponse || undefined;
		r.context.bottle = bottle;

		var doNotCallNext = false;
		var next = function () {
			if (doNotCallNext) return;
			doNotCallNext = true;
			args.next();
		};

		var done = function () {
			if (doNotCallNext) return;
			doNotCallNext = true;
			args.done();
		};

		r.context.next = next;
		r.context.done = done;

		if (!options.halt) {
			next();
		} else {
			r.on('exit', next);
		}
	});
};

function getArgs (args) {
	var namedArgs = {};
	args = Array.prototype.slice.call(args);
	namedArgs.bottleRequest = args[0];

	if (_.isFunction(args[1])) {
		namedArgs.next = args[1];
		namedArgs.done = args[2];
	} else {
		namedArgs.bottleResponse = args[1];
		namedArgs.next = args[2];
		namedArgs.done = args[3];
	}

	return namedArgs;
}

function exit (r) {
	r.commands['.exit'].action.call(r);
}