var express = require('express'), app = express.createServer(
	express.static(__dirname + '/public'),
	express.bodyParser()
);
var search = require('./server/search').search();
var mediaRouterBase = require('./server/router');
var mediaRouter = mediaRouterBase.getRouter();
var url = require('url');
var $ = require('./server/jquery.whenall');
var playlist = require('./server/playlist');
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

app.post('/fetchplaylist', function(req, res) {
	var queryID = req.body.query;
	var exists = playlist.getString(queryID);
	var playlistString = false;
	var responses = [exists], results = [];
	var queriesResolved = $.Deferred();
	exists.done(function(doesExist) {
		playlistString = doesExist;
		var urlParams = mediaRouterBase.getURLParams(playlistString, true);
		var i;
		for (i in urlParams) {
			responses.push(mediaRouter.addResource(urlParams[i], function(searchResults) {
				results = results.concat(searchResults);
			}));
		}
		$.when.apply(null, responses).always(function() {
			res.json({id: queryID, results: results});
		});
	}).fail(function() {
		queryID = false;
		res.json({id: queryID, results: results});
	});
});

app.post('/fetchid', function(req, res) {
	var query = req.body.query;
	var existing = playlist.getID(query);
	var responses = [existing], results = [];
	var savedID = false;
	existing.done(function(doesExist) {
		if (!doesExist && query.length) {
			var saveQuery = playlist.save(query);
			saveQuery.done(function(result) {
				savedID = result;
			});
			responses.push(saveQuery);
		}
		else {
			savedID = doesExist;
		}
		$.whenAll.apply(null, responses).always(function() {
			res.json({id: savedID});
		});
	}).fail(function() {
		res.json({id: savedID});
	});
});

app.listen(process.env['app_port'] || 3000);
console.log("Server started.");
