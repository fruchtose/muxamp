var getApplication = function() {
	var express = require('express'), 
		app = express(),
		ejs = require('ejs-locals');

	app.configure(function() {
		app.use(express.static(__dirname + '/../public/'));
		app.use(express.bodyParser());
		app.engine('ejs', ejs);
		app.set('view engine', 'ejs');
	});

	var search = require('./search').search,
		mediaRouterBase = require('./router'),
		mediaRouter = mediaRouterBase.getRouter(),
		url = require('url'),
		Q = require('q'),
		_ = require('underscore')._,
		playlist = require('./playlist'),
		cacher = require('node-dummy-cache'),
		playlistFetchCache = cacher.create(cacher.ONE_SECOND * 45, cacher.ONE_SECOND * 30),
		db = require('./db');

	app.get(/^\/([1-9][0-9]*)?$/, function(req, res) {
		res.render('playlist');
	});

	app.get('/search/:site/:page([0-9]+)/:query?', function(req, res) {
		var site = req.params.site, page = parseInt(req.params.page), query = req.params.query;
		query = decodeURIComponent(query || "");
		search(query, site, page, 25).then(function(results) {
			res.json(results.tracks);
		}).fail(function(results) {
			res.json(results || []);
		}).done();
	});

	app.get('/playlists/:queryID', function(req, res) {
		var queryID = parseInt(req.params.queryID);
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
					var response = mediaRouter.get(param).then(function(searchResults) {
						if (searchResults.tracks) {
							results[index] = searchResults.tracks;
						}
					});
					responses.push(response);
				});
			}
			Q.allResolved(responses).then(function() {
				results = _.chain(results).flatten().compact().value();
				if (!cached && results.length >= 5) {
					playlistFetchCache.put(queryID, results);
				}
				res.json({id: queryID, tracks: results});
			});
		}).fail(function(error) {
			error && console.log(error);
			console.trace();
			var message = 'The specified playlist could not be located.';
			if (!db.canRead()) {
				message = 'Sorry, the Muxamp service is currently unavailable.';
			}
			res.json({id: false, tracks: [], error: message});
		}).done();
	});

	app.post('/playlists/save', function(req, res) {
		var query = req.body;
		var qs = playlist.toQueryString(req.body);
		var existing = playlist.getID(qs);
		existing.then(function(doesExist) {
			var savedID = false;
			var responses = [], results = [], error = false;
			if (!doesExist && qs.length) {
				var saveQuery = playlist.save(query);
				saveQuery.then(function(result) {
					savedID = result;
				}, function(err) {
					error = "Your database could not be saved.";
				});
				responses.push(saveQuery);
			}
			else {
				savedID = doesExist;
			}
			Q.allResolved(responses).then(function() {
				var response = {
					id: false
				};
				if (error) {
					response.error = error;
				} else {
					response.id = savedID;
				}
				res.json(response);
			});
		}).fail(function(error) {
			error && console.log(error);
			console.trace();
			var message = 'There was a problem in the playlist service.';
			if (!db.canRead()) {
				message = 'Sorry, the Muxamp service is currently unavailable.';
			} else if (!db.canWrite()) {
				message = 'Sorry, Muxamp is currently in read-only mode.';
			}
			res.json({error: message, id: false});
		}).done();
	});

	return app;
};

module.exports = {
	getApplication: getApplication
}