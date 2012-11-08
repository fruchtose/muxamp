var connectionPooler = require('generic-pool'),
	mysql			 = require('mysql');

module.exports = {
	getConnectionPool: function() {
		var pool = null;
		var createPool = function() {
			return connectionPooler.Pool({
				name: 'mysql',
				create: function(callback) {
					var connection = mysql.createConnection({
						host: process.env['muxamphost'],
						database: process.env['muxampdb'],
						user: process.env['muxampuser'],
						password: process.env['muxamppassword']
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
		return (function() {
			if (!pool) {
				pool = createPool();
			}
			return pool;
		})();
}
};