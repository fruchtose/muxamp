var config              = require('./config'),
    db                  = require('./db'),
    Q                   = require('q'),
    crypto              = require('crypto'),
    cacher              = require('node-dummy-cache'),
    _                   = require('underscore')
    mediaRouterBase     = require('./router'),
    mediaRouter         = mediaRouterBase.getRouter();
    
var playlistDataCache   = cacher.create(cacher.ONE_SECOND * 45, cacher.ONE_SECOND * 30);
    playlistStringCache = cacher.create(cacher.ONE_SECOND * 45, cacher.ONE_SECOND * 30);

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
    var seen = {};
    return _.chain(mediaList).map(function(media) {
        var stringEquiv = media.siteCode + '=' + media.siteMediaID;
        if (!seen[stringEquiv]) {
            seen[stringEquiv] = true;
            return media;
        } else {
            return false;
        }
    }).filter(function(media) {
        return false !== media;
    }).value();
};

var playlistCount = function() {
    return db.executeQuery({
        permissions: 'read',
        query: 'SELECT COUNT(id) AS count FROM Playlists;'
    }).then(function(rows) {
        return _.first(rows)['count'];
    });
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
        var select = ["SELECT COUNT(id) AS count FROM KnownMedia WHERE "];
        return select.concat(_(playlist).map(function(track, i) {
            var site = connection.escape(track.siteCode),
                id = connection.escape(track.siteMediaID);
            var str = '(site=' + site + ' AND mediaid=' + id + ')';
            if (i < playlistLength - 1) {
                str += ' OR ';
            }
            return str;
        })).concat([';']).join('');
    }
    return db.executeQuery({
        permissions: 'read',
        query: getQuery
    }).then(function(rows) {
        var row = rows[0];
        var count = row['count'];
        if (parseInt(count) !== playlistLength) {
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
        exists = rows && rows[0] && rows[0].id;
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
        return _.first(rows)['playliststring'];
    });
};

var savePlaylist = function(playlist) {
    var playlistString = toQueryString(playlist);
    var existing = getPlaylistID(playlistString);
    return existing.then(function(exists) {
        if (exists) {
            return exists;
        }

        return verifyPlaylist(playlist);
    }).then(function() {
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
        });
    }).then(function(status) {
        return status.insertId;
    });
};

var toQueryString = function(queryArray) {
    queryArray = queryArray || [];
    var qs = '', i = 0, elem = null;
    if (!queryArray.length) {
        return qs;
    }
    qs += queryArray[0]['siteCode'] + '=' +queryArray[0]['siteMediaID'];
    for (i = 1; i < queryArray.length; i++) {
        elem = queryArray[i];
        qs += '&' + queryArray[i]['siteCode'] + '=' +queryArray[i]['siteMediaID'];
    }
    return qs;
}

module.exports = {
    count: playlistCount,
    getID: getPlaylistID,
    getPlaylist: getPlaylist,
    getString: getPlaylistString,
    save: savePlaylist,
    toQueryString: toQueryString
};