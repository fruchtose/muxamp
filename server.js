var express = require('express'), app = express.createServer();
var search = require('./server/search').search();
var mediaRouterBase = require('./server/router');
var mediaRouter = mediaRouterBase.getRouter();
var url = require('url');
var $ = require('./server/jquery.whenall');
var playlist = require('./server/playlist');

app.use(express.static(__dirname + '/public'));
var fs = require('fs');

app.get('/', function(req, res) {
	var file = __dirname + '/public/playlist.html';
	fs.readFile(file, 'utf8', function(err, text) {
		res.send(text);
	});
});

app.get('/search\/:site/:page([0-9]+)/:query?', function(req, res) {
	var site = req.params.site, page = req.params.page, query = req.params.query;
	console.log('Request for search results.');
	query = decodeURIComponent(query || "");
	search.search(query, page, site).done(function(results) {
		res.json(results);
	});
});

app.get('/fetch', function(req, res) {
	var urlParts = url.parse(req.url, false);
	var query = urlParts.query;
	var existing = playlist.getID(query);
	var savedID = false;
	existing.done(function(doesExist) {
		if (!doesExist) {
			playlist.save(query).then(function(result) {
				savedID = result;
			});
		}
		else {
			savedID = doesExist;
		}
	});
	var urlParams = mediaRouterBase.getURLParams(query, true);
	var responses = [existing], results = [];
	var i;
	for (i in urlParams) {
		responses.push(mediaRouter.addResource(urlParams[i], function(searchResults) {
			results = results.concat(searchResults);
		}));
	}
	$.whenAll.apply(null, responses).always(function() {
		res.json({id: savedID, results: results});
	});
});

app.listen(process.env['app_port'] || 3000);
console.log("Server started.");
