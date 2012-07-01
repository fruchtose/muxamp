var connectionPooler = require('generic-pool');

module.exports = {
	getConnectionPool: function() {
		var pool = connectionPooler.Pool({
			name: 'mysql',
			create: function(callback) {
				var mysql = require('mysql');
				var connection = mysql.createConnection({
					host: process.env['muxamphost'],
					database: process.env['muxampdb'],
					user: process.env['muxampuser'],
					password: process.env['muxamppassword']
				});
				callback(null, connection);
			},
			destroy: function(connection) {
				connection.end();
			},
			max: 1
		});
		return (function() {
			return pool;
		})();
}
};