var NEVER_EXPIRES = -1;
var MIN_TIME = 500;
var ONE_SECOND = 1000;
var ONE_MINUTE = 1000 * 60;
var ONE_HOUR = 1000 * 60 * 60;

function create() {
	var data = {};
	var timer = 0;

	var self = function() {
		return self.get.apply(null, arguments);
	};

	self.maxNotAccessedTimeMs = NEVER_EXPIRES;
	self.maxAliveTimeMS = NEVER_EXPIRES;
	self.fetcher = undefined;

	var toArgs = function(args) {
		return [].slice.apply(args, []);
	};

	var now = function() {
		return new Date().getTime();
	};

	var invalidate = function() {
		stopTimer();

		var date = now();

		for ( var id in data) {
			if (!isValid(data[id], date))
				self.remove(id);
		}

		startTimer();
	};

	var stopTimer = function() {
		if (timer) {
			clearTimeout(timer);
			timer = 0;
		}
	};

	var startTimer = function() {
		stopTimer();

		var timeMs;

		if (self.maxAliveTimeMS > 0 && self.maxNotAccessedTimeMs > 0)
			timeMs = Math.min(self.maxAliveTimeMS, self.maxNotAccessedTimeMs);

		else if (self.maxAliveTimeMS > 0)
			timeMs = self.maxAliveTimeMS;

		else if (self.maxNotAccessedTimeMs > 0)
			timeMs = self.maxNotAccessedTimeMs;

		else
			timeMs = -1;

		if (timeMs > 0)
			timer = setTimeout(invalidate, Math.max(timeMs, MIN_TIME));
	};

	var isValid = function(entry, date) {
		if (!entry.created)
			return false;

		if (!date)
			date = now();

		if (self.maxNotAccessedTimeMs > 0 && entry.lastTouch + self.maxNotAccessedTimeMs < date)
			return false;

		if (self.maxAliveTimeMS > 0 && entry.created + self.maxAliveTimeMS < date)
			return false;

		return true;
	};

	var getData = function(id) {
		var result = data[id];

		if (!result) {
			result = {};
			data[id] = result;
		}

		return result;
	};

	var splitArguments = function(args, removeLast) {
		var params = toArgs(args);

		var callback = undefined;
		if (params.length > 0) {
			if (removeLast === true) {
				callback = params.pop();
			} else if (removeLast === false) {
				// Do nothing
			} else if (typeof params[params.length - 1] == 'function') {
				callback = params.pop();
			}
		}

		var id = JSON.stringify(params);

		return {
			params : params,
			callback : callback,
			id : id
		};
	};

	self.get = function() {
		var args = splitArguments(arguments);
		var date = now();
		var result = getData(args.id);

		if (args.callback) {
			if (isValid(result, date)) {
				result.lastTouch = date;
				args.callback.apply(null, result.args);
				return undefined;
			}

			if (result.fetching) {
				result.callbacks.push(args.callback);

			} else {
				result.fetching = true;
				result.callbacks = [ args.callback ];

				args.params.push(function() {
					var date = now();
					result.created = date;
					result.lastTouch = date;
					result.args = toArgs(arguments);

					for ( var i in result.callbacks)
						result.callbacks[i].apply(null, result.args);

					delete result.fetching;
					delete result.callbacks;
				});

				self.fetcher.apply(null, args.params);
			}

		} else {
			if (isValid(result, date)) {
				result.lastTouch = date;

				if (result.args[0])
					return undefined;
				else
					return result.args[1];
			}
		}

		return undefined;
	};

	self.put = function() {
		var args = splitArguments(arguments, true);
		var date = now();
		var result = getData(args.id);
		result.created = date;
		result.lastTouch = date;
		result.args = [ undefined, args.callback ];
	};

	self.remove = function() {
		var args = splitArguments(arguments, false);
		delete data[args.id];
	};

	self.clear = function() {
		data = {};
	};

	self.shutdown = function() {
		stopTimer();
	};

	var assertTypes = function() {
		var args = arguments[0];
		var types = toArgs(arguments).splice(1);

		if (args.length != types.length)
			throw new Error('Wrong number of arguments. Should be ' + types.length);

		for ( var i in types) {
			var actual = typeof args[i];
			if (types[i] != actual)
				throw new Error('Wrong argument type for argument ' + i + ': expected ' + types[i] + ', actual '
						+ actual);
		}
	};

	if (arguments.length > 3)
		throw new Error('Wrong arguments');

	if (arguments.length == 3) {
		assertTypes(arguments, 'number', 'number', 'function');
		self.maxAliveTimeMS = arguments[0];
		self.maxNotAccessedTimeMs = arguments[1];
		self.fetcher = arguments[2];

	} else if (arguments.length == 2) {
		if (typeof arguments[1] == 'function') {
			assertTypes(arguments, 'number', 'function');
			self.maxAliveTimeMS = arguments[0];
			self.fetcher = arguments[1];

		} else {
			assertTypes(arguments, 'number', 'number');
			self.maxAliveTimeMS = arguments[0];
			self.maxNotAccessedTimeMs = arguments[1];
		}

	} else if (arguments.length == 1) {
		if (typeof arguments[0] == 'function') {
			self.fetcher = arguments[0];

		} else {
			assertTypes(arguments, 'number');
			self.maxAliveTimeMS = arguments[0];
		}
	}

	startTimer();

	return self;
}

exports.create = create;
exports.NEVER_EXPIRES = NEVER_EXPIRES;
exports.MIN_TIME = MIN_TIME;
exports.ONE_SECOND = ONE_SECOND;
exports.ONE_MINUTE = ONE_MINUTE;
exports.ONE_HOUR = ONE_HOUR;
exports.SET_MIN_TIME = function(timeMs) {
	MIN_TIME = Math.max(timeMs, 1);
};
