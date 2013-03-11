var fs = require('fs');

var getApplication = function() {
	var express = require('express'), 
		app = express(),
		ejs = require('ejs-locals'),
		config = require('./config');

	var env = config.get('NODE_ENV');
	var loggerFormat = config.get('log') || null;

	app.configure(function() {
		app.use(express.static(__dirname + '/../public/'));
		app.use(express.bodyParser());
		app.engine('ejs', ejs);
		app.set('view engine', 'ejs');
		app.use(express.logger(loggerFormat));
	});

	app.configure('development', function() {
	});

	app.configure('test', function() {
		app.use(express.static(__dirname + '/../publictest/'));
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
		var additionalJS = 'js/' + env;
		res.render('playlist', {environment: additionalJS});
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
		var response = {id: false, tracks: []};
		if (!queryID) {
			res.json(response);
			return
		}
		playlist.getPlaylist(queryID).then(function(results) {
			res.json({id: queryID, tracks: results});
		}).fail(function(error) {
			error && console.log('get playlist endpoint error', error);
			console.trace();
			var message = 'The specified playlist could not be located: ' + queryID;
			if (!db.canRead()) {
				message = 'Sorry, the Muxamp service is currently unavailable.';
			}
			response.error = message;
			res.json(response);
		}).done();
	});

	app.post('/playlists/save', function(req, res) {
		var query = req.body;
		if (!(query && query.length)) {
			res.json({id: false});
			return;
		}
		playlist.save(query).then(function(id) {
			res.json({
				id: id
			});
		}).fail(function(error) {
			error.message && (error = error.message);
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