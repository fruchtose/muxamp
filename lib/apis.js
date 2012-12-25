var SearchResult	= require('./searchresult').SearchResult,
	_				= require('underscore')._;

var getSeparatedWords = function(query) {
	return query.replace(/[^\w\s]|_/g, ' ').toLowerCase().split(' ');
};

var missingProperties = function(object, expected) {
	return _.reject(expected, function (element) {
		return object[element] != null;
	}).toString();
}

var genericConfig = {
	requestOptions: {
		json: true,
		method: 'GET',
		timeout: 5000,
		url: ''
	}
};

var soundcloudConfig = {
	checkedProperties: [
		'stream_url', 'permalink_url', 'streamable'
	],
	consumerKey: '2f9bebd6bcd85fa5acb916b14aeef9a4',
	defaultRequestOptions: _.extend({}, genericConfig.requestOptions),
	getRequestOptions: function(options) {
		return _.extend({}, soundcloudConfig.defaultRequestOptions, {url: soundcloudSearchUrl(options)});
	},
	searchCallback: function(query) {
		var words = getSeparatedWords(query);
		return function(body) {
			if (!body.length) {
				return [];
			}

			var allPlaybacks = 0,
				avgPlaybacks = 0,
				missingPlays = [],
				searchResults;
			searchResults = _(body).map(function(result) {
				var missingProps = missingProperties(result, soundcloudConfig.checkedProperties);
				if (missingProps) {
					console.log('SoundCloud entry ' + (result.id || 'unknown') + ' is missing properties: ', missingProps);
					return null;
				}
				var searchResult = new SearchResult(result.stream_url + "?client_id=" + soundcloudConfig.consumerKey, result.permalink_url, result.id, "sct", "img/soundcloud_orange_white_16.png", result.user.username, result.title, result.duration / 1000, "audio", result.playback_count, result.favoritings_count);
				var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
				var intersection = _.intersection(words, resultWords);
				searchResult.querySimilarity = intersection.length / words.length;
				if (undefined === result.playback_count) {
					missingPlays.push(searchResults);
				} else {
					allPlaybacks += result.playback_count;
				}
				return searchResult;
			});
			avgPlaybacks = allPlaybacks / searchResults.length || 0;
			// If a result is missing playbacks, we give it the average number of playbacks
			// with a slight penalty, since we devide by the number of total results, 
			// not the number with recorded playbacks.
			_(missingPlays).each(function(searchResult, i) {
				searchResults[i].plays = avgPlaybacks;
			});
			return searchResults;
		}
	}
};

var youtubeConfig = {
	checkedProperties: [
		'author', 'title', 'yt$statistics', 'media$group'
	],
	defaultRequestOptions: _.extend({}, genericConfig.requestOptions, {
		strictSSL: false,
        timeout: 4000
	}),
	getRequestOptions: function(options) {
		return _.extend({}, youtubeConfig.defaultRequestOptions, {url: youtubeSearchUrl(options)});
	},
    searchCallback: function(query) {
		var words = getSeparatedWords(query);
		return function(body) {
			if ( !(body.feed && body.feed.entry && body.feed.entry.length) ) {
				return [];
			}
			return _(body.feed.entry).map(function(entry) {
				var id = '', missingProps = missingProperties(entry, youtubeConfig.checkedProperties);
				if (missingProps) {
					var id = 'unknown';
					if (entry && entry['id'] && entry['id']['$t']) {
						id = entry['id']['$t'].split(':').pop();
					}
					console.log("YouTube entry " + id + ' is missing properties: ', missingProps);
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
		}
	}
};

var soundcloudSearchUrl = function(options) {
	var query = options.query,
		page = options.page,
		perPage = options.perPage;
	return 'http://api.soundcloud.com/tracks.json?client_id=' + soundcloudConfig.consumerKey + '&limit=' + 
			perPage + '&filter=streamable&order=hotness&offset=' + (perPage * page + 1) + 
			'&q=' + encodeURIComponent(query);
};

var youtubeSearchUrl = function(options) {
	var query = options.query,
		page = options.page,
		perPage = options.perPage;
	return 'https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=' + 
			perPage + '&orderby=relevance&alt=json&start-index=' + (perPage * page + 1) + 
			'&q=' + encodeURIComponent(query);
};

module.exports = {
	SoundCloud: {
		Search: {
			getCallback: soundcloudConfig.searchCallback,
			getRequestOptions: soundcloudConfig.getRequestOptions,
			url: soundcloudSearchUrl
		},
		Tracks: {}
	},
	YouTube: {
		Search: {
			getCallback: youtubeConfig.searchCallback,
			getRequestOptions: youtubeConfig.getRequestOptions,
			url: youtubeSearchUrl
		},
		Tracks: {}
	}
}