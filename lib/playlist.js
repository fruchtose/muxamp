var config              = require('./config'),
    db                  = require('./db'),
    Q                   = require('q'),
    crypto              = require('crypto'),
    cacher              = require('node-dummy-cache'),
    _                   = require('underscore')
    mediaRouterBase     = require('./router'),
    mediaRouter         = mediaRouterBase.getRouter(),
    search              = require('./search');
    
var playlistDataCache   = cacher.create(cacher.ONE_SECOND * 180, cacher.ONE_SECOND * 60);
    playlistStringCache = cacher.create(cacher.ONE_SECOND * 180, cacher.ONE_SECOND * 60);

var setTimeoutReject = function(deferred, time) {
    time = time || 30000; // default timeout is 30 ms
    setTimeout(function() {
        if (deferred.state() == 'pending') {
            deferred.reject("Timeout after " + time + " ms");
        }
        console.log("Timing out promise");
    }, time);
}

var uniqueMedia = function(mediaList) {
    return _.uniq(mediaList, function(media) {
        return media.siteCode + '=' + media.siteMediaID;
    });
};

var playlistCount = function() {
    return db.executeQuery({
        permissions: 'read',
        query: 'SELECT COUNT(id) AS count FROM Playlists;'
    }).then(function(rows) {
        return _.first(rows)['count'];
    });
};

var verifyIndividualTrack = function(track) {
    var keyValPair = new mediaRouterBase.KeyValuePair(track.siteCode, track.siteMediaID);
    return mediaRouter.get(keyValPair);
};

var verifyPlaylist = function(playlist) {
    var result = Q.defer(), i, pair;
    playlist = uniqueMedia(playlist);
    var playlistLength = playlist.length;
    if (!playlistLength) {
        result.reject();
        return result.promise;
    }
    function getQuery(connection) {
        var select = "SELECT COUNT(id) AS count FROM KnownMedia WHERE CONCAT(site, '=', mediaid) IN ";
        var pool = _(playlist).map(function(track) {
            return connection.escape(track.siteCode + '=' + track.siteMediaID);
        });
        return select + '(' + pool.join(', ') + ');';
    }
    return db.executeQuery({
        permissions: 'read',
        query: getQuery
    }).then(function(rows) {
        var row = rows[0];
        var count = row['count'];
        if (parseInt(count) !== playlistLength) {
            if (config.get('muxamp:db:allowDirectSave')) {
                // If direct save is allowed, we'll locate and save unknown tracks directly.
                // The reason this is not a default is because it requires an additional API request 
                // per track and a DB write for each set of tracks--this is very expensive time-wise.
                var trackPromises = _(playlist).map(function(track) {
                    return verifyIndividualTrack(track);
                });
                return Q.all(trackPromises).then(function(promises) {
                    return _(promises).map(function(promise) {
                        return promise.valueOf();
                    });
                }).then(function(toSave) {
                    search.save(toSave);
                });
            }
            
            throw new Error('Some playlist tracks could not be verified.');
        }
        return true;
    });
};

var getPlaylist = function(id) {
    return getPlaylistString(id).then(function(playlistString) {
        if (!playlistString) {
            return [];
        }
        var cached = playlistDataCache.get(id);
        if (cached) {
            return cached;
        }

        var urlParams = mediaRouterBase.getURLParams(playlistString, true);
        var responses = _(urlParams).map(function(param) {
            return mediaRouter.get(param).then(function(searchResults) {
                var value = searchResults;
                if (!value || value.error) return null;
                return searchResults.tracks || [];
            });
        });
        return Q.allResolved(responses).then(function(promises) {
            var list = _.chain(promises).map(function(promise, i) {
                return promise.valueOf() || null;
            }).flatten().compact().value();
            if (list.length >= 5) {
                playlistDataCache.put(id, list);
            }
            return list;
        });
    });
};

var getPlaylistID = function(playlistString) {
    var result = Q.defer(), cached = playlistStringCache.get(playlistString);
    if (cached) {
        result.resolve(cached);
        return result.promise;
    } 

    var sha256 = crypto.createHash('sha256');
    sha256.update(playlistString, 'utf8');
    var hash = sha256.digest('hex');
    var queryString = "SELECT id FROM Playlists WHERE sha256=?;";
    return db.executeQuery({
        permissions: 'read',
        query: [queryString, [hash]]
    }).then(function(rows) {
        var exists = rows && rows[0] && rows[0].id;
        if (exists) {
            var id = parseInt(exists);
            playlistStringCache.put(playlistString, id);
            return id;
        }
        return false;
    });
};

var getPlaylistString = function(id) {
    return db.executeQuery({
        permissions: 'read',
        query: ["SELECT playliststring FROM Playlists WHERE id=?;", [id]]
    }).then(function(rows) {
        var result = _.first(rows);
        result && (result = result['playliststring']);
        return result || false;
    });
};

var savePlaylist = function(playlist) {
    var playlistString = toQueryString(playlist);
    var existing = getPlaylistID(playlistString);
    return existing.then(function(exists) {
        if (exists) {
            return exists;
        }

        return verifyPlaylist(playlist).then(function() {
            var sha256 = crypto.createHash('sha256');
            sha256.update(playlistString, 'utf8');
            var hash = sha256.digest('hex');
            var queryString = "INSERT INTO Playlists SET ? ON DUPLICATE KEY UPDATE id=id";
            return db.executeQuery({
                permissions: 'write',
                query: [
                    queryString, 
                    {sha256: hash, playliststring: playlistString}
                ]
            }).then(function(status) {
                return status.insertId;
            });
        });
    });
};

var deleteAll = function() {
    return db.executeQuery({
        permissions: 'write',
        query: 'DELETE FROM Playlists'
    }).then(function() {
        return db.executeQuery({
            permissions: 'write',
            query: 'ALTER TABLE Playlists AUTO_INCREMENT = 1'
        });
    });
};

var toQueryString = function(queryArray) {
    queryArray = queryArray || [];
    if (!queryArray.length) {
        return '';
    }
    var qsArray = _(queryArray).map(function(element) {
        return element.siteCode + '=' + element.siteMediaID;
    });
    return qsArray.join('&=');
}

module.exports = {
    count: playlistCount,
    deleteAll: deleteAll,
    getID: getPlaylistID,
    getPlaylist: getPlaylist,
    getString: getPlaylistString,
    save: savePlaylist,
    toQueryString: toQueryString
};