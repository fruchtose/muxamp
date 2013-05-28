var _           = require('underscore'),
    Q           = require('q'),
    url         = require('url'),
    cacher      = require('node-dummy-cache'),
    db          = require('./db'),
    mediaRouter = require('./router').getRouter(),
    apis        = require('./apis'),
    Jamendo     = apis.Jamendo,
    SoundCloud  = apis.SoundCloud,
    YouTube     = apis.YouTube;

_.str = require('underscore.string');
    
var searchResultsCache  = cacher.create(cacher.ONE_SECOND * 90, cacher.ONE_SECOND * 30);

var isUrl = function(input) {
    var parsedUrl = url.parse(input);
    return parsedUrl && parsedUrl.href && parsedUrl.host && _.str.include(parsedUrl.href, 'http');
};

var saveSearchResults = function(searchResults) {
    function getQuery(connection) {
        var values = _.map(searchResults, function(result) {
            return '(' + connection.escape(result.siteCode.toLowerCase()) + ',' + 
                connection.escape(result.siteMediaID) + ')';
        }).join(',');
        return 'INSERT INTO KnownMedia (site, mediaid) VALUES ' + values + ' ON DUPLICATE KEY UPDATE id=id;';
    }
    if (!(searchResults && searchResults.length)) {
        return false;
    }
    return db.executeQuery({
        permissions: 'write',
        query: getQuery
    });
};

var search = function(query, siteCode, page, perPage) {
    page || (page == 0);
    var url = _.isString(query) && isUrl(query),
        deferred = Q.defer(),
        cacheKey,
        cachedResults;

    if ( !(siteCode && query && perPage) && !url) {
        return Q.fcall(function() {
            throw new Error('Query, site, and results per page must be defined.');
        });
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
            saveSearchResults(tracks).done();
            searchResultsCache.put(cacheKey, data);
        }
        return data;
    }, function(error) {
        throw error;
    });
};

var sendSearchQuery = function(query, siteCode, page, perPage) {
    var api = {}, options = {query: query, page: page, perPage: perPage};
    switch(siteCode) {
        case 'jmt':
            api = Jamendo.Tracks;
            break;
        case 'sct':
            api = SoundCloud.Tracks;
            break;
        case 'url':
            // URL handling should be done by the router. If this code executes,
            // it means the entered string was not interpreted as a URL
            return Q.fcall(function() {
                return {error: 'The query you entered is not a URL.'};
            });
        case 'ytv':
            api = YouTube.Tracks;
            break;
        default:
            return Q.fcall(function() {
                return {error: 'Unknown site code in search query.'};
            });
            break;
    }
    return api.search(options);
};

module.exports = {
  search: function(query, siteCode, page) {
    return search(query, siteCode, page, 25);
  },
  save: saveSearchResults
};