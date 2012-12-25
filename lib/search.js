var SearchResult	= require('./searchresult').SearchResult,
	_				= require('underscore')._,
	Q				= require('q'),
	request 		= require('request'),
	db				= require('./db'),
	cacher			= require('node-dummy-cache'),
	mediaRouter		= require('./router').getRouter(),
	url				= require('url');
	
var dbConnectionPool 	= db.getConnectionPool(),
	searchResultsCache	= cacher.create(cacher.ONE_SECOND * 30, cacher.ONE_SECOND * 10);

var getSeparatedWords = function(query) {
	return query.replace(/[^\w\s]|_/g, ' ').toLowerCase().split(' ');
};

var allPropertiesExist = function(object, expected) {
	return _.all(expected, function (element) {
		var value = object[element];
		return value != null;
	});
}

var soundcloudSearchConfig = function(query, page, perPage) {
	var consumerKey = '2f9bebd6bcd85fa5acb916b14aeef9a4';
	var soundcloudCheckedProperties = [
		'stream_url', 'permalink_url'
	];
	return {
		callback: function(body) {
			if (!body.length) {
				return [];
			}

			var allPlaybacks = 0,
				avgPlaybacks = 0,
				missingPlays = [],
				searchResults = _(body).map(function(result) {
				var validEntry = allPropertiesExist(result, soundcloudCheckedProperties);
				if (!validEntry) {
					console.log('SoundCloud entry ' + (result.id || 'unknown') + ' is missing an essential property');
					return null;
				}
				var searchResult = new SearchResult(result.stream_url + "?client_id=" + consumerKey, result.permalink_url, result.id, "sct", "img/soundcloud_orange_white_16.png", result.user.username, result.title, result.duration / 1000, "audio", result.playback_count, result.favoritings_count);
				var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
				var intersection = _.intersection(words, resultWords);
				searchResult.querySimilarity = intersection.length / words.length;
				if (undefined === result.playback_count) {
					missingPlays.push(searchResults);
				} else {
					allPlaybacks += result.playback_count;
				}
				return searchResults;
			});
			avgPlaybacks = allPlaybacks / searchResults.length || 0;
			// If a result is missing playbacks, we give it the average number of playbacks
			// with a slight penalty, since we devide by the number of total results, 
			// not the number with recorded playbacks.
			_(missingPlays).each(function(searchResult, i) {
				searchResults[i].plays = avgPlaybacks;
			});
			return searchResults;
		},
		url: 'http://api.soundcloud.com/tracks.json?client_id=' + consumerKey + '&limit=' + 
			perPage + '&filter=streamable&order=hotness&offset=' + (perPage * page + 1) + 
			'&q=' + encodeURIComponent(query)
	};
};

var youtubeSearchConfig = function(query, page, perPage) {
	var youtubeCheckedProperties = [
		'author', 'title', 'yt$statistics', 'media$group'
	];
	return {
		callback: function(body) {
			if ( !(body.feed && body.feed.entry && body.feed.entry.length) ) {
				return [];
			}

			var searchResults = _(body.feed.entry).map(function(entry) {
				var id = '', validEntry = allPropertiesExist(entry, youtubeCheckedProperties);
				if (!validEntry) {
					var id = 'unknown';
					if (entry && entry['id'] && entry['id']['$t']) {
						id = entry['id']['$t'].split(':').pop();
					}
					console.log("YouTube entry " + id + ' is missing an essential property');
					return null;
				}
				id = entry['id']['$t'].split(':').pop();
				var permalink = 'http://www.youtube.com/watch?v=' + id;
				var authorObj = entry.author[0];
	            var author = authorObj.name.$t;
				var title = entry.title.$t;
	            var duration = parseInt(entry.media$group.yt$duration.seconds);
	            var viewCount = entry['yt$statistics']['viewCount'];
	            var favoriteCount = entry['yt$statistics']['favoriteCount'];
	            
	            var searchResult = new SearchResult(permalink, permalink, id, "ytv", "img/youtube.png", author, title, duration, "video", viewCount, favoriteCount);
				var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
				var intersection = _.intersection(words, resultWords);
				searchResult.querySimilarity = intersection.length / words.length;
				return searchResult;
			});
		},
		url: 'https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=' + 
			perPage + '&orderby=relevance&alt=json&start-index=' + (perPage* page + 1) + 
			'&q=' + encodeURIComponent(query)
	};
};

var saveSearchResults = function(searchResults) {
	var result, i;
	
	if (!(searchResults && searchResults.length)) {
		return false;
	}
	dbConnectionPool.acquire(function(acquireError, connection) {
		if (acquireError) {
			console.log(acquireError);
			dbConnectionPool.release(connection);
			return;
		}
		var queryString = 'INSERT INTO KnownMedia (site, mediaid) VALUES ',
			values = _.chain(searchResults).map(function(result) {
			return '(' + connection.escape(result.siteCode.toLowerCase()) + ',' + 
				connection.escape(result.siteMediaID) + ')';
		}).join(',').value();

		queryString += values + ' ON DUPLICATE KEY UPDATE id=id;'
		connection.query(queryString, function(queryError, rows) {
			if (queryError) {
				console.log(queryError);
			}
			dbConnectionPool.release(connection);
		});
	});
};

var search = function(query, siteCode, page, perPage) {
	page || (page == 0);
	var cacheKey      = {query: query, page: page, site: siteCode, perPage: perPage},
		cachedResults = searchResultsCache.get(cacheKey),
		deferred = Q.defer();
	if (!(siteCode && query && perPage)) {
		deferred.reject({error: 'Query, site, and results per page must be defined.'});
		return deferred.promise;
	}
	if (cachedResults) {
		deferred = Q.defer();
		deferred.resolve(cachedResults);
		return deferred.promise;
	} else {
		var parsedUrl = url.parse(query);
		if (parsedUrl && parsedUrl.href && parsedUrl.href.indexOf('http') >= 0) {
			deferred = mediaRouter.get(query);
		} else {
			deferred = sendSearchQuery(query, siteCode, page, perPage);
		}
	}
	// Both Router and search query function return an object 
	// with a property called 'tracks' containing the array of results
	return deferred.get('tracks').then(function(data) {
		var results = data || [];
		if (cachedResults) {
			results = cachedResults;
			return results;
		}

		// Save search results if not cached--cached results are already saved
		saveSearchResults(results);
		results = sortSearchResults(results);
		if (results.length) {
			searchResultsCache.put(cacheKey, results);
		}
		return results;
	}).fail(function(failedResults) {
		return [];
	});
};

var sendSearchQuery = function(query, siteCode, page, perPage) {
	var deferred = Q.defer(),
		defaultConfig = {
			method: 'GET',
			timeout: 5000,
			url: ''
		},
		searchConfig = {};
	switch(siteCode) {
		case 'sct':
			searchConfig = soundcloudSearchConfig(query, page, perPage);
			break;
		case 'ytv':
			searchConfig = youtubeSearchConfig(query, page, perPage);
			break;
		default:
			deferred.reject({
				error: 'Unknown site code in search query.'
			});
			return deferred;
			break;
	}
	var options = _.extend({}, searchConfig, defaultConfig),
		callback = options.callback,
		url = options.url,
		words = getSeparatedWords(query);
	request(options, function(error, response, body) {
		if (error || response.statusCode != 200) {
			deferred.reject({
				error: 'Received code ' + response + ' from ' + url
			});
			return;
		}

		var results = _.compact(callback(body, deferred)) || {error: 'There was a problem getting search results.'};
		if (!results.error) {
			deferred.resolve({tracks: results});
		} else {
			deferred.reject(results.error);
		}
	});
	return deferred.promise;
};

var sortSearchResults = function(results) {
	var maxPlays = 0, maxFavorites = 0;
	maxPlays = _(results).max(function(result) {
		return result.plays;
	});
	maxFavorites = _(results).max(function(result) {
		return result.favorites;
	});
	return _.chain(results).map(function(result) {
		result.playRelevance = Math.log(result.plays + 1) / Math.log(maxPlays + 1);
		result.favoriteRelevance = Math.log(result.favorites + 1) / Math.log(maxFavorites + 1);
		result.calculateRelevance();
		return result;
	}).sortBy(function(a) {
		return a.relevance;
	}).reverse().map(function(result) {
		delete result.favoriteRelevance;
		delete result.favorites;
		delete result.playRelevance;
		delete result.plays;
		delete result.querySimilarity;
		delete result.relevance;
		return result;
	}).value();
};

module.exports = {
  search: function(query, siteCode, page) {
  	return search(query, siteCode, page, 25);
  },
  searchResult: SearchResult
};