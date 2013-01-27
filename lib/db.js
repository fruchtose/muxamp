var connectionPooler = require('generic-pool'),
	mysql			 = require('mysql'),
	Q				 = require('q'),
	config			 = require('./config');

var pool = null;

var createPool = function() {
	return connectionPooler.Pool({
		name: 'mysql',
		create: function(callback) {
			var connection = mysql.createConnection({
				host: config.get('muxamphost'),
				database: config.get('muxampdb'),
				user: config.get('muxampuser'),
				password: config.get('muxamppassword')
			});
			connection.connect(function(err) {
				callback(err, connection);
			});
		},
		destroy: function(connection) {
			connection.end();
		},
		max: 5
	});
}

var verify = function(action) {
	return !!config.get('muxamp:db:' + action.toString().toLowerCase());
};

module.exports = {
	canRead: function() {
		return verify('read');
	},
	canWrite: function() {
		return verify('write');
	},
	getConnectionPool: function() {
		if (!pool) {
			pool = createPool();
		}
		return pool;
	},
	verify: verify
};