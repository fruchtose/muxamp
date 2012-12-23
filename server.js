var express = require('express'), 
	app = express(),
	ejs = require('ejs-locals');

app.configure(function() {
	app.use(express.static(__dirname + '/public/'));
	app.use(express.bodyParser());
	app.engine('ejs', ejs);
	app.set('view engine', 'ejs');
});

var search = require('./lib/search').search(),
	mediaRouterBase = require('./lib/router'),
	mediaRouter = mediaRouterBase.getRouter(),
	url = require('url'),
	Q = require('q'),
	_ = require('underscore')._,
	playlist = require('./lib/playlist'),
	cacher = require('node-dummy-cache'),
	playlistFetchCache = cacher.create(cacher.ONE_SECOND * 45, cacher.ONE_SECOND * 30);

app.get(/^\/([1-9][0-9]*)?$/, function(req, res) {
	res.render('playlist');
});

app.get('/search/:site/:page([0-9]+)/:query?', function(req, res) {
	var site = req.params.site, page = req.params.page, query = req.params.query;
	query = decodeURIComponent(query || "");
	search.search(query, page, site).then(function(results) {
		res.json(results);
	}).fail(function(results) {
		res.json(results || []);
	}).done();
});

app.get('/playlists/:queryID', function(req, res) {
	var queryID = req.params.queryID;
	var exists = playlist.getString(queryID);
	exists.then(function(doesExist) {
		var responses = [], results;
		var playlistString = doesExist;
		var cached = playlistFetchCache.get(queryID);
		if (cached) {
			results = cached;
		}
		else {
			var urlParams = mediaRouterBase.getURLParams(playlistString, true);
			results = new Array(urlParams.length);
			_.each(urlParams, function(param, index) {
				var response = mediaRouter.addResource(param).then(function(searchResults) {
					results[index] = searchResults.tracks;
				});
				responses.push(response);
			});
		}
		Q.allResolved(responses).then(function() {
			results = _.chain(results).flatten().compact().value();
			if (!cached && results.length >= 5) {
				playlistFetchCache.put(queryID, results);
			}
			res.json({id: queryID, results: results});
		});
	}).fail(function(error) {
		error && console.log(error);
		res.json({id: false, results: []});
	}).done();
});

app.post('/playlists/save', function(req, res) {
	var query = req.body;
	var qs = playlist.toQueryString(req.body);
	var existing = playlist.getID(qs);
	existing.then(function(doesExist) {
		var savedID = false;
		var responses = [], results = [];
		if (!doesExist && qs.length) {
			var saveQuery = playlist.save(query);
			saveQuery.then(function(result) {
				savedID = result;
			}).fail(function(result) {
				console.log('playlist not inserted', playlist);
			});
			responses.push(saveQuery);
		}
		else {
			savedID = doesExist;
		}
		Q.allResolved(responses).then(function() {
			res.json({id: savedID});
		});
	}).fail(function(error) {
		error && console.log(error);
		res.json({id: false});
	}).done();
});

app.listen(process.env['app_port'] || 3000);
console.log("Server started, port", process.env['app_port'] || 3000);
