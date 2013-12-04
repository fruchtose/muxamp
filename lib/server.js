var fs = require('fs');

var getApplication = function() {
    var express = require('express'), 
        app = express(),
        ejs = require('ejs-locals'),
        config = require('./config');

    var env = config.get('NODE_ENV');
    var loggerFormat = config.get('muxamp:log') || null;

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


    var analytics = fs.existsSync(__dirname + '/../views/analytics.ejs');
    var search = require('./search').search,
        url = require('url'),
        Q = require('q'),
        _ = require('underscore'),
        playlist = require('./playlist'),
        db = require('./db');

    app.get(/^\/([1-9][0-9]*)?$/, function(req, res) {
        var additionalJS = 'js/' + env;
        res.render('playlist', {environment: additionalJS, analytics: analytics});
    });

    app.get('/search/:site/:page([0-9]+)/:query?', function(req, res) {
        var site = req.params.site, page = parseInt(req.params.page), query = req.params.query;
        query || (query = '');
        if (!query.length) {
            res.status(400);
            res.json({error: 'You did not enter a search query!'});
        }
        query = decodeURIComponent(query || "");
        search(query, site, page, 25).then(function(results) {
            var error = results.error;
            if (error) {
                res.status(400);
                res.json({error: error});
                return;
            }
            res.json(results.tracks || []);
        }).fail(function(results) {
            res.status(500);
            res.json({error: 'An internal error occurred.'});
        }).done();
    });

    app.get('/playlists/:queryID', function(req, res) {
        var queryID = parseInt(req.params.queryID);
        var response = {id: false, tracks: []};
        if (!_.isFinite(queryID)) {
            res.status(400);
            res.json(response);
            return;
        }
        playlist.getPlaylist(queryID).then(function(results) {
            if (results && results.length) {
                response.id = queryID;
                response.tracks = results;
            } else {
                res.status(404);
                res.json({id: false, tracks: []});
            }
            res.json(response);
        }).fail(function(error) {
            console.log(error);
            error && console.log('get playlist endpoint error', error);
            console.trace();
            var message = 'The specified playlist could not be located: ' + queryID;
            if (!db.canRead()) {
                message = 'Sorry, the Muxamp service is currently unavailable.';
            }
            response.error = message;
            res.status(500);
            res.json(response);
        }).done();
    });

    app.post('/playlists/save', function(req, res) {
        var query = req.body;
        if (!_.isArray(query) || _.isEmpty(query)) {
            if (_.isEmpty(query)) {
                // Reset Content
                res.status(205);
                res.json({id: false});
            } else {
                //Non-empty body has been sent with a non-array--must be nonsense
                var response = {id: false, error: 'A list of tracks was expected.'};
                res.status(400);
                res.json(response);
            }
            return;
        } else if (!_.every(query, function(e) { return e && e.siteCode && e.siteMediaID; })) {
            var response = {id: false, error: 'A playlist could not be parsed from the input.'};
            res.status(400);
            res.json(response);
            return;
        }
        playlist.save(query).then(function(id) {
            res.json({
                id: id
            });
        }).fail(function(error) {
            error && error.message && (error = error.message);
            error && console.log('save playlist endpoint error', error);
            console.trace();
            var message = 'There was a problem in the playlist service.';
            if (!db.canRead()) {
                message = 'Sorry, the Muxamp service is currently unavailable.';
            } else if (!db.canWrite()) {
                message = 'Sorry, Muxamp is currently in read-only mode.';
            }
            res.status(500);
            res.json({error: message, id: false});
        }).done();
    });

    return app;
};

module.exports = {
    getApplication: getApplication,
}