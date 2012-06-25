var dbConnectionPool	= require('./db').getConnectionPool(),
	mediaRouterBase		= require('./router'),
	$					= require('./jquery.whenall');

var verifyPlaylist = function(playlistString) {
	var result = $.Deferred(), i, pair;
	if (!playlistString.length) {
		return result.reject();
	}
	var urlParams = mediaRouterBase.getURLParams(playlistString, true);
	var playlistLength = urlParams.length;
	if (!playlistLength) {
		return result.reject();
	}
	
	dbConnectionPool.acquire(function(acquireError, connection) {
		if (!acquireError) {
			var resultName = "count";
			var queryString = ["SELECT COUNT(id) AS " + resultName + " FROM KnownMedia WHERE "];
			for (i in urlParams) {
				pair = urlParams[i];
				queryString.push("(site=" + connection.escape(pair.key) + " AND mediaid=" + connection.escape(pair.value) + ")");
				if (parseInt(i) < urlParams.length - 1) {
					queryString.push(" OR ");
				}
				else {
					queryString.push(";");
				}
			}
			connection.query(queryString.join(""), function(queryError, rows) {
				if (!queryError && rows.length) {
					var row = rows[0];
					if (parseInt(row[resultName]) === playlistLength) {
						result.resolve(true);
					}
				}
				dbConnectionPool.release(connection);
			});
		}
		else {
			dbConnectionPool.release(connection);
		}
	});
	
	return result.promise();
};

var getPlaylistID = function(playlistString) {
	var result = $.Deferred();
	dbConnectionPool.acquire(function(acquireError, connection) {
		if (acquireError) {
			result.reject();
			dbConnectionPool.release(connection);
			return;
		}
		var queryString = "SELECT id FROM Playlists WHERE playliststring=?;";
		connection.query(queryString, [playlistString], function(queryError, rows) {
			
			if (!queryError && rows) {
				if (rows[0]) {
					result.resolve(parseInt(rows[0]["id"]));
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
	return result.promise();
};

var savePlaylist = function(playlistString) {
	var result = $.Deferred(), verified = verifyPlaylist(playlistString);
	$.when(verified).fail({
	}).then(function() {
		dbConnectionPool.acquire(function(acquireError, connection) {
			if (acquireError) {
				result.reject();
				dbConnectionPool.release(connection);
				return;
			}
			var queryString = "INSERT INTO Playlists SET ?";
			connection.query(queryString, {playliststring: playlistString}, function(queryError, rows) {
				if (!queryError) {
					result.resolve(rows.insertId);
				}
				else {
					result.reject();
				}
				dbConnectionPool.release(connection);
			});
		});
	});
	
	return result.promise();
};

module.exports = {
	getID: getPlaylistID,
	save: savePlaylist                
};