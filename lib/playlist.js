var config              = require('./config'),
    db                  = require('./db'),
    dbConnectionPool    = db.getConnectionPool(),
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
    var dfd = Q.defer();
    dbConnectionPool.acquire(function(acquireError, connection) {
        if (acquireError) {
            console.log('Playlist count connection acquisition', acquireError);
            dfd.reject();
            dbConnectionPool.release(connection);
        }
        var queryString = 'SELECT COUNT(id) AS count FROM Playlists;';
        connection.query(queryString, function(queryError, rows) {
            if (queryError) {
                console.log('Playlist count query error', queryError);
                dfd.reject();
            } else if (rows.length && rows[0] && rows[0]['count']) {
                dfd.resolve(parseInt(rows[0]['count']));
            } else {
                dfd.reject();
            }
            dbConnectionPool.release(connection);
        });
    });
    return dfd.promise;
};

var verifyPlaylist = function(playlist) {
    var result = Q.defer(), i, pair;
    playlist = uniqueMedia(playlist);
    var playlistLength = playlist.length;
    if (!playlistLength) {
        return result.reject();
    }
    var canVerify = db.canRead();
    if (canVerify) {
        dbConnectionPool.acquire(function(acquireError, connection) {
            if (acquireError) {
                console.log('Verify connection acquisition', acquireError);
                result.reject();
                dbConnectionPool.release(connection);
                return;
            }
            var resultName = "count";
            var queryString = ["SELECT COUNT(id) AS " + resultName + " FROM KnownMedia WHERE "];
            for (i in playlist) {
                pair = playlist[i];
                var site = connection.escape(pair.siteCode),
                    id   = connection.escape(pair.siteMediaID);
                queryString.push("(site=" + site + " AND mediaid=" + id + ")");
                if (parseInt(i) < playlistLength - 1) {
                    queryString.push(" OR ");
                }
                else {
                    queryString.push(";");
                }
            }
            connection.query(queryString.join(""), function(queryError, rows) {
                if (queryError) {
                    console.log('Verify query error', queryError);
                    result.reject();
                }
                else if (rows.length) {
                    var row = rows[0];
                    var count = row[resultName];
                    if (parseInt(count) === playlistLength) {
                        result.resolve(true);
                    } else {
                        console.log('Some media found: ' + count + ' out of ' + playlistLength + 'expected');
                        result.reject();
                    }
                } else {
                    console.log('no results for verification');
                    result.reject();
                }
                dbConnectionPool.release(connection);
            });
        });
    } else {
        result.reject();
    }
    
    return result.promise;
};

var getPlaylist = function(id) {
    var exists = getPlaylistString(id);
    return exists.then(function(playlistString) {
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
    } else if (!db.canRead()) {
        result.reject();
    } else {
        dbConnectionPool.acquire(function(acquireError, connection) {
            if (acquireError) {
                console.log('playlist ID connection acquisition', acquireError);
                result.reject();
                dbConnectionPool.release(connection);
                return;
            }
            var sha256 = crypto.createHash('sha256');
            sha256.update(playlistString, 'utf8');
            var hash = sha256.digest('hex');
            var queryString = "SELECT id FROM Playlists WHERE sha256=?;";
            connection.query(queryString, [hash], function(queryError, rows) {
                
                if (!queryError && rows) {
                    if (rows[0]) {
                        var id = parseInt(rows[0]["id"]);
                        playlistStringCache.put(playlistString, id);
                        result.resolve(id);
                    }
                    else {
                        result.resolve(false);
                    }
                }
                else {
                    result.reject();
                }
                dbConnectionPool.release(connection);
            });
        });
    }
    return result.promise;
};

var getPlaylistString = function(id) {
    var result = Q.defer();
    if (!db.canRead()) {
        result.reject();
    } else {
        dbConnectionPool.acquire(function(acquireError, connection) {
            if (acquireError) {
                console.log('playlist get connection acquisition', acquireError);
                result.reject();
                dbConnectionPool.release(connection);
                return;
            }
            var queryString = "SELECT playliststring FROM Playlists WHERE id=?;";
            connection.query(queryString, [id], function(queryError, rows) {
                if (!queryError && rows) {
                    if (rows[0]) {
                        result.resolve(rows[0]["playliststring"]);
                    }
                    else {
                        if (queryError) {
                            console.log('playlist get query error', queryError);
                        }
                        result.reject(false);
                    }
                }
                else {
                    result.reject();
                }
                dbConnectionPool.release(connection);
            });
        });
    }
    return result.promise;
};

var savePlaylist = function(playlist) {
    if (!db.canWrite()) {
        var deferred = Q.defer();
        deferred.reject();
        return deferred.promise;
    }
    var playlistString = toQueryString(playlist);
    var existing = getPlaylistID(playlistString);
    var response = {
        id: false
    }
    var result = Q.defer();
    existing.then(function(exists) {
        if (exists) {
            return result.resolve(exists);
        }
        return verifyPlaylist(playlist).fail(function() {
            console.log('could not verify', playlist);
            result.reject();
        }).then(function() {
            dbConnectionPool.acquire(function(acquireError, connection) {
                if (acquireError) {
                    result.reject();
                    dbConnectionPool.release(connection);
                    return;
                }
                var sha256 = crypto.createHash('sha256');
                sha256.update(playlistString, 'utf8');
                var hash = sha256.digest('hex');
                var queryString = "INSERT INTO Playlists SET ? ON DUPLICATE KEY UPDATE id=id";
                connection.query(queryString, {sha256: hash, playliststring: playlistString}, function(queryError, rows) {
                    if (!queryError) {
                        result.resolve(rows.insertId);
                    }
                    else {
                        console.log('playlist save query error', queryError);
                        result.reject();
                    }
                    dbConnectionPool.release(connection);
                });
            });
        }).done();
    });
    
    return result.promise;
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