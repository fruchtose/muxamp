var express = require('express'), app = express.createServer();
var search = require('./server/search').search();

app.use(express.static(__dirname + '/public'));
var fs = require('fs');

app.get('/', function(req, res) {
	/*var data =fs.readFileSync('playlist.html');
	res.send(data);*/
	var file = __dirname + '/public/playlist.html';
	console.log('Request for ' + file.toString());
	fs.readFile(file, 'utf8', function(err, text) {
		res.send(text);
	});
});

app.get('/search\/:site/:query?', function(req, res, next) {
	var site = req.params.site, query = req.params.query;
	if (undefined != site) {
		console.log('Request for search results.');
		query = decodeURIComponent(query || "");
		search.search(query, site).done(function(results) {
			res.send(JSON.stringify(results));
		});
	}
	else {
		next();
	}
});

app.listen(3000);
console.log("Server started.");
