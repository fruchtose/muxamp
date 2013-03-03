var config = require('./config');

var getApplication = function() {
	var express = require('express'), 
		app = express(),
		ejs = require('ejs-locals');

	var env = config.get('NODE_ENV');
	var loggerFormat = config.get(env + ':log') || null;

	app.configure(function() {
		app.use(express.static(__dirname + '/../public/'));
		app.use(express.bodyParser());
		app.engine('ejs', ejs);
		app.set('view engine', 'ejs');
		app.use(express.logger(loggerFormat));
	});

	app.configure('production', function() {
		app.set('json spaces', 0);
	});

	var search = require('./search').search,
		url = require('url'),
		Q = require('q'),
		_ = require('underscore'),
		playlist = require('./playlist'),
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
		playlist.getPlaylist(queryID).then(function(results) {
			res.json({id: queryID, tracks: results});
		}).fail(function(error) {
			error && console.log('get playlist endpoint error', error);
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
			error && console.log('save playlist endpoint error', error);
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
	getApplication: getApplication,
}