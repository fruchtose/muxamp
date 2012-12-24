var app = require('./lib/server').getApplication(),
	port = 3000;
app.listen(process.env['app_port'] || port);
console.log("Server started, port", process.env['app_port'] || port);
