var SearchResult	= require('./searchresult').SearchResult,
	_				= require('underscore')._,
	Q				= require('q'),
	request 		= require('request'),
	db				= require('./db'),
	cacher			= require('node-dummy-cache'),
	mediaRouter		= require('./router').getRouter(),
	url				= require('url'),
	SoundCloud 		= require('./apis').SoundCloud,
	YouTube 		= require('./apis').YouTube;

_.str = require('underscore.string');
	
var dbConnectionPool 	= db.getConnectionPool(),
	searchResultsCache	= cacher.create(cacher.ONE_SECOND * 30, cacher.ONE_SECOND * 10);

var isUrl = function(input) {
	var parsedUrl = url.parse(input);
	return parsedUrl && parsedUrl.href && parsedUrl.host && _.str.include(parsedUrl.href, 'http');
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
	var url = _.isString(query) && isUrl(query),
		deferred = Q.defer(),
		cacheKey,
		cachedResults;

	if ( !(siteCode && query && perPage) && !url) {
		deferred.reject({error: 'Query, site, and results per page must be defined.'});
		return deferred.promise;
	}

	if (url) {
		cacheKey = {query: query};
		cachedResults = searchResultsCache.get(cacheKey);
		cachedResults || (deferred = mediaRouter.get(query));
	} else {
		cacheKey = {query: query, page: page, site: siteCode, perPage: perPage};
		cachedResults = searchResultsCache.get(cacheKey);
		cachedResults || (deferred = sendSearchQuery(query, siteCode, page, perPage));
	}
	if (cachedResults) {
		deferred.resolve(cachedResults);
		return deferred.promise;
	}

	// Both Router and search query function return an object 
	// with a property called 'tracks' containing the array of results
	return deferred.then(function(data) {
		data || (data = {});
		var results = data.tracks || [];
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
		data.tracks = results;
		return data;
	}, function(error) {
		throw error;
	});
};

var sendSearchQuery = function(query, siteCode, page, perPage) {
	var deferred = Q.defer(),
		api = {};
	switch(siteCode) {
		case 'sct':
			api = SoundCloud.Search;
			break;
		case 'ytv':
			api = YouTube.Search;
			break;
		default:
			deferred.reject({
				error: 'Unknown site code in search query.'
			});
			return deferred.promise;
			break;
	}
	var options = api.getRequestOptions({query: query, page: page, perPage: perPage}),
		callback = api.getCallback(query),
		url = options.url;
	request(options, function(error, response, body) {
		if (error || response.statusCode != 200) {
			deferred.reject({
				error: 'Received code ' + response + ' from ' + url
			});
			return;
		}

		var results = _.compact(callback(body)) || {error: 'There was a problem getting search results.'};
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