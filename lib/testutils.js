var http     = require('http'),
    should   = require('chai').should(),
    _        = require('underscore'),
    Q        = require('q'),
    config   = require('./config'),
    search     = require('./search'),
    playlist = require('./playlist'),
    muxamp   = require('../lib/server').getApplication();

var expectError = function(deferred, callback, done) {
    return deferred.then(function(results) {
        should.not.exist(results);
        _.isFunction(done) && done();
    }).fail(function(error) {
        callback(error);
        _.isFunction(done) && done();
    }).done();
};

var expectSuccess = function(deferred, callback, done) {
    return deferred.then(function(results) {
        callback(results);
        _.isFunction(done) && done();
    }).fail(function(error) {
        throw error;
        _.isFunction(done) && done();
    }).done();
};

var expectErrorMessage = function(deferred, done) {
    var readError = function(data) {
        should.exist(data);
    };
    expectError(deferred, readError, done);
}

var serverTestSetup = function(context, done) {
    context.app = http.createServer(muxamp);
    context.app.on('listening', function() {
        done();
    });
    context.app.listen(config.get('muxamp:port'));
};

var serverTestTeardown = function(context, done) {
    context.app.on('close', function() {
        done();
    });
    context.app.close();
};

var seed = function(count) {
    if (config.get('NODE_ENV') == 'production') {
        throw new Error('Database cannot seeded in production mode.');
    }
    return search.search('youtube', 'ytv', 0,  count).then(function(tracks) {
        tracks = tracks.tracks || [];
        var playlists = [];
        _(count).times(function() {
            var playlist = [], size = _.random(1, 7);
            _(size).times(function() {
                var index = _.random(count - 1), track = tracks[index];
                playlist.push({siteCode: track.siteCode, siteMediaID: track.siteMediaID});
            });
            playlists.push(playlist);
        });
        return playlists;
    }).then(function(playlists) {
        return _(playlists).map(function(list) {
            return playlist.save(list);
        });
    }).then(function(promises) {
        return Q.allResolved(promises);
    });
};

var cleanDb = function() {
    return function(done) {
        return playlist.deleteAll().then(function() {
            done();
        });
    };
};

var cleanAndPopulate = function(count) {
    return function(done) {
        if (config.get('NODE_ENV') == 'production') {
            throw new Error('Database cannot seeded in production mode.');
        }
        return playlist.deleteAll().then(function() {
            return seed(count);
        }).then(function() {
            return playlist.count();
        }).done(function() {
            done();
        });
    };
};

module.exports = {
    expectError: expectError,
    expectErrorMessage: expectErrorMessage,
    expectSuccess: expectSuccess,
    hooks: {
        server: {
            before: function(context) {
                return function(done) {
                    serverTestSetup(context, done);
                };
            },
            after: function(context) {
                return function(done) {
                    serverTestTeardown(context, done);
                };
            }
        }
    },
    db: {
        clean: cleanDb,
        cleanAndPopulate: cleanAndPopulate,
        seed: seed
    }
};