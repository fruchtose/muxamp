var muxamp = require('./lib/server'),
	config = require('./lib/config');

var app = muxamp.getApplication(),
	environment = config.get('NODE_ENV'),
	port = config.get(environment + ':port');
app.listen(port, function() {
	console.log("Server started, port", port);
});