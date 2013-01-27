var config = require('./lib/config');

var app = require('./lib/server').getApplication(), port = config.get('app_port');
app.listen(port, function() {
	console.log("Server started, port", port);
});