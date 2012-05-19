var express = require('express'), app = express.createServer();
var $ = require('jQuery');
app.use(express.static(__dirname + '/public'));
var fs = require('fs');

app.get(/.*/, function(req, res) {
	/*var data =fs.readFileSync('playlist.html');
	res.send(data);*/
	var file = req.url;
	if (file == '/') {
		file = '/public/playlist.html';
	}
	file = __dirname + file;
	console.log('Request for ' + file.toString());
	fs.readFile(file, 'utf8', function(err, text) {
		res.send(text);
	});
});

app.listen(3000);
console.log("Server started.");
