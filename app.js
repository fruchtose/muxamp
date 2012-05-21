var express = require('express'), app = express.createServer();
var search = require('./server/search').search();
var mediaRouterBase = require('./server/router');
var mediaRouter = mediaRouterBase.getRouter();
var url = require('url');
var $ = require('./server/jquery.whenall');

app.use(express.static(__dirname + '/public'));
var fs = require('fs');

app.get('/', function(req, res) {
	var file = __dirname + '/public/playlist.html';
	console.log('Request for ' + file.toString());
	fs.readFile(file, 'utf8', function(err, text) {
		res.send(text);
	});
});

app.get('/search\/:site/:query?', function(req, res) {
	var site = req.params.site, query = req.params.query;
	console.log('Request for search results.');
	query = decodeURIComponent(query || "");
	search.search(query, site).done(function(results) {
		res.json(results);
	});
});

app.get('/fetch', function(req, res) {
	var urlParts = url.parse(req.url, false);
	var query = urlParts.query;
	var urlParams = mediaRouterBase.getURLParams(query, true);
	var responses = [], results = [];
	var i;
	for (i in urlParams) {
		responses.push(mediaRouter.addResource(urlParams[i], function(searchResults) {
			results = results.concat(searchResults);
		}));
	}
	$.whenAll.apply(null, responses).always(function() {
		res.json(results);
	});
});

app.listen(3000);
console.log("Server started.");
