var muxamp = require('./lib/server');

var app = muxamp.getApplication(), port = muxamp.defaultPort;
app.listen(port, function() {
	console.log("Server started, port", port);
});