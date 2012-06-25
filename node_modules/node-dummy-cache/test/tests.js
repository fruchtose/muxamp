var cache = require('../lib/cache.js');

exports['Clear cache'] = {

};

exports['Put/get tests'] = {
	c : undefined,

	setUp : function(callback) {
		cache.SET_MIN_TIME(10);

		callback();
	},

	tearDown : function(callback) {
		c.shutdown();

		callback();
	},

	'Simple cache' : function(test) {
		c = cache.create();

		test.strictEqual(c.get(1), undefined);

		c.put(1, 'A');

		test.equal(c.get(1), 'A');

		test.done();
	},

	'Multiple values' : function(test) {
		c = cache.create();

		c.put(1, 'A');
		c.put(2, 'B');

		test.equal(c.get(1), 'A');
		test.equal(c.get(2), 'B');

		test.done();
	},

	'Cache with timer' : function(test) {
		c = cache.create(10);

		test.strictEqual(c.get(1), undefined);

		c.put(1, 'A');

		test.equal(c.get(1), 'A');

		setTimeout(function() {
			test.strictEqual(c.get(1), undefined);
			
			test.expect(3);
			test.done();
		}, 30);
	},

	'Remove' : function(test) {
		c = cache.create();

		c.put(1, 'A');

		test.equal(c.get(1), 'A');
		
		c.remove(1);

		test.strictEqual(c.get(1), undefined);
		
		test.done();
	},

	'Remove multiple' : function(test) {
		c = cache.create();

		c.put(1, 'A');
		c.put(2, 'B');

		test.equal(c.get(1), 'A');
		test.equal(c.get(2), 'B');
		
		c.remove(2);

		test.equal(c.get(1), 'A');
		test.strictEqual(c.get(2), undefined);
		
		c.remove(1);

		test.strictEqual(c.get(1), undefined);
		test.strictEqual(c.get(2), undefined);
		
		test.done();
	},
};

exports['Fetch with callback tests'] = {
	c : undefined,

	setUp : function(callback) {
		cache.SET_MIN_TIME(10);

		callback();
	},

	tearDown : function(callback) {
		c.shutdown();

		callback();
	},

	'Simple get' : function(test) {
		c = cache.create(function(id, callback) {
			callback(undefined, 'A');
		});

		c.get(1, function(err, data) {
			test.equal(data, 'A');
		});
		
		test.expect(1);
		test.done();
	},

	'Simple cache' : function(test) {
		c = cache.create(function(id, callback) {
			callback(undefined, 'A');
		});

		c.get(1, function(err, data) {
			test.equal(data, 'A');
		});

		c.get(1, function(err, data) {
			test.equal(data, 'A');
		});
		
		test.expect(2);
		test.done();
	},

	'Multiple values' : function(test) {
		var calls = 0;
		c = cache.create(function(id, callback) {
			calls++;
			callback(undefined, 'A' + id);
		});

		c.get(1, function(err, data) {
			test.equal(data, 'A1');
		});

		test.equal(calls, 1);

		c.get(2, function(err, data) {
			test.equal(data, 'A2');
		});

		test.equal(calls, 2);

		c.get(1, function(err, data) {
			test.equal(data, 'A1');
		});

		test.equal(calls, 2);

		c.get(2, function(err, data) {
			test.equal(data, 'A2');
		});

		test.equal(calls, 2);

		test.expect(8);
		test.done();
	},

	'Simple cache plus get' : function(test) {
		c = cache.create(function(id, callback) {
			callback(undefined, 'A');
		});

		test.strictEqual(c.get(1), undefined);

		c.get(1, function(err, data) {
			test.equal(c.get(1), 'A');
		});
		
		test.expect(2);
		test.done();
	},

	'Cache with timer' : function(test) {
		c = cache.create(10, function(id, callback) {
			callback(undefined, 'A');
		});

		test.strictEqual(c.get(1), undefined);

		c.get(1, function(err, data) {
			test.equal(data, 'A');
			test.equal(c.get(1), 'A');

			setTimeout(function() {
				test.strictEqual(c.get(1), undefined);

				test.done();
			}, 30);
		});
	},

	'Two gets result in only one method call' : function(test) {
		var calls = 0;
		var notifies = 0;

		var cb;
		c = cache.create(function(id, callback) {
			calls++;
			cb = callback;
		});

		c.get(1, function(err, data) {
			notifies++;
		});

		test.equal(calls, 1);
		test.equal(notifies, 0);

		c.get(1, function(err, data) {
			notifies++;
		});

		test.equal(calls, 1);
		test.equal(notifies, 0);

		c.get(1, function(err, data) {
			notifies++;
		});

		test.equal(calls, 1);
		test.equal(notifies, 0);

		cb();

		test.equal(calls, 1);
		test.equal(notifies, 3);

		test.expect(8);
		test.done();
	},

	'Timeout during fetch' : function(test) {
		var cb;
		c = cache.create(10, function(id, callback) {
			cb = callback;
		});

		var notifies = 0;
		c.get(1, function(err, data) {
			notifies++;
		});

		test.equal(notifies, 0);

		setTimeout(function() {

			test.equal(notifies, 0);

			cb();

			test.equal(notifies, 1);

			test.done();
		}, 50);
	},
};

exports['Function wrapper'] = {
	c : undefined,

	setUp : function(callback) {
		cache.SET_MIN_TIME(10);

		callback();
	},

	tearDown : function(callback) {
		c.shutdown();

		callback();
	},

	'1 param + callback' : function(test) {
		c = cache.create(function(p1, callback) {
			test.equal(p1, 1);

			callback('A', 'B', 'C');
		});

		c.get(1, function(a, b, c) {
			test.equal(a, 'A');
			test.equal(b, 'B');
			test.equal(c, 'C');

			test.done();
		});
	},

	'2 params + callback' : function(test) {
		c = cache.create(function(p1, p2, callback) {
			test.equal(p1, 1);
			test.equal(p2, 2);

			callback('A', 'B', 'C');
		});

		c.get(1, 2, function(a, b, c) {
			test.equal(a, 'A');
			test.equal(b, 'B');
			test.equal(c, 'C');

			test.done();
		});
	},

	'0 params + callback' : function(test) {
		c = cache.create(function(callback) {
			callback('A', 'B', 'C');
		});

		c.get(function(a, b, c) {
			test.equal(a, 'A');
			test.equal(b, 'B');
			test.equal(c, 'C');

			test.done();
		});
	},

	'Function style' : function(test) {
		c = cache.create(function(a, b, c, callback) {
			test.equal(a, 1);
			test.equal(b, 2);
			test.equal(c, 3);

			callback('A', 'B', 'C');
		});

		c(1, 2, 3, function(err, data1, data2) {
			test.equal(err, 'A');
			test.equal(data1, 'B');
			test.equal(data2, 'C');

			test.done();
		});
	},

	'Function style mixed' : function(test) {
		c = cache.create(function(a, b, c, callback) {
			test.equal(a, 1);
			test.equal(b, 2);
			test.equal(c, 3);

			callback(undefined, 'A');
		});

		test.strictEqual(c(1, 2, 3), undefined);

		c(1, 2, 3, function(err, data) {
			test.strictEqual(err, undefined);
			test.equal(data, 'A');
		});

		test.strictEqual(c(1, 2, 3), 'A');

		test.expect(7);
		test.done();
	},

	'Function style with timer' : function(test) {
		c = cache.create(10, function(a, b, c, callback) {
			test.equal(a, 1);
			test.equal(b, 2);
			test.equal(c, 3);

			callback(undefined, 'A');
		});

		test.strictEqual(c(1, 2, 3), undefined);

		c(1, 2, 3, function(err, data) {
			test.strictEqual(err, undefined);
			test.equal(data, 'A');
		});

		test.equal(c(1, 2, 3), 'A');

		setTimeout(function() {
			test.strictEqual(c(1, 2, 3), undefined);

			test.expect(8);
			test.done();
		}, 50);
	},
};
