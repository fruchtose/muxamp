var SearchResult	= require('./searchresult').SearchResult,
	_				= require('underscore')._,
	Q				= require('q'),
	request 		= require('request'),
	db				= require('./db'),
	cacher			= require('node-dummy-cache'),
	mediaRouter		= require('./router').getRouter(),
	url				= require('url'),
	apis 			= require('./apis')
	SoundCloud 		= apis.SoundCloud,
	YouTube 		= apis.YouTube;

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
	// with a property called 'tracks'.
	// If the search returned non-empty data, save it and cache it
	return deferred.then(function(data) {
		data || (data = {});
		var tracks = data.tracks || [];

		if (tracks.length) {
			saveSearchResults(tracks);
			searchResultsCache.put(cacheKey, tracks);
		}
		return data;
	}, function(error) {
		throw error;
	});
};

var sendSearchQuery = function(query, siteCode, page, perPage) {
	var api = {}, options = {query: query, page: page, perPage: perPage};
	switch(siteCode) {
		case 'sct':
			api = SoundCloud.Tracks;
			break;
		case 'ytv':
			api = YouTube.Tracks;
			break;
		default:
			var deferred = Q.defer();
			deferred.reject({
				error: 'Unknown site code in search query.'
			});
			return deferred.promise;
			break;
	}
	return api.search(options);
};

module.exports = {
  search: function(query, siteCode, page) {
  	return search(query, siteCode, page, 25);
  },
  searchResult: SearchResult
};