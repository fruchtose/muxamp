var SearchResult	= require('./searchresult').SearchResult,
	_				= require('underscore')._,
	Q 				= require('q'),
	request 		= require('request');

var getSeparatedWords = function(query) {
	return query.replace(/[^\w\s]|_/g, ' ').toLowerCase().split(' ');
};

var missingProperties = function(object, expected) {
	return _.reject(expected, function (element) {
		return object[element] != null;
	}).toString();
}

var SearchApi = function(params){
	var defaultOptions = {
		json: true,
		method: 'GET',
		timeout: 5000,
		url: ''
	};
	this.options = _.extend({}, defaultOptions, params.options || {});
	_.extend(this, _.omit(params, 'options'));
};

SearchApi.prototype = {
	checkedProperties: [],
	consumerKey: '',
	getCallback: function() {return function() {};},
	search: function(params) {
		var deferred, callback, options, url;
		deferred = Q.defer();
		callback = this.getCallback(params) || function() {};
		url = this.url(params);
		options = _.extend({}, this.options, {url: url});
		request(options, function(error, response, body) {
			if (error) {
				deferred.reject({
					error: error
				});
				return;
			}
			if (response.statusCode != 200) {
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
	},
	url: function(options) {return '';},
};

var SoundCloud = new function() {
	var searchApi = new SearchApi({
		checkedProperties: [
		'stream_url', 'permalink_url', 'streamable'
		],
		consumerKey: '2f9bebd6bcd85fa5acb916b14aeef9a4',
		getCallback: function(options) {
			var api = this,
				query = options.query,
				words = getSeparatedWords(query);
			return function(body) {
				if (!body.length) {
					return [];
				}
				var allPlaybacks = 0,
					avgPlaybacks = 0,
					missingPlays = [],
					searchResults;
				searchResults = _(body).map(function(result) {
					var missingProps = missingProperties(result, api.checkedProperties);
					if (missingProps) {
						console.log('SoundCloud entry ' + (result.id || 'unknown') + ' is missing properties: ', missingProps);
						return null;
					}
					var searchResult = new SearchResult(result.stream_url + "?client_id=" + api.consumerKey, result.permalink_url, result.id, "sct", "img/soundcloud_orange_white_16.png", result.user.username, result.title, result.duration / 1000, "audio", result.playback_count, result.favoritings_count);
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
			};
		},
		options: {
			strictSSL: false,
	        timeout: 4000
		},
		url: function(options) {
			var query = options.query,
			page = options.page,
			perPage = options.perPage;
			return 'http://api.soundcloud.com/tracks.json?client_id=' + this.consumerKey + '&limit=' + 
				perPage + '&filter=streamable&order=hotness&offset=' + (perPage * page + 1) + 
				'&q=' + encodeURIComponent(query);
		}
	});
	var Tracks = {
		search: function(options) {
			return searchApi.search(options);
		}
	};
	this.Tracks = Tracks;
};

var YouTube = new function() {
	var searchApi = new SearchApi({
		checkedProperties: [
			'author', 'title', 'yt$statistics', 'media$group'
		],
		getCallback: function(options) {
			var api = this,
				query = options.query,
				words = getSeparatedWords(query);
			return function(body) {
				if ( !(body.feed && body.feed.entry && body.feed.entry.length) ) {
					return [];
				}
				return _(body.feed.entry).map(function(entry) {
					var id = '', missingProps = missingProperties(entry, api.checkedProperties);
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
			};
		},
		options: {
			strictSSL: false,
	        timeout: 4000
		},
		url: function(options) {
			var query = options.query,
			page = options.page,
			perPage = options.perPage;
			return 'https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=' + 
				perPage + '&orderby=relevance&alt=json&start-index=' + (perPage * page + 1) + 
				'&q=' + encodeURIComponent(query);
		}
	});
	var Tracks = {
		search: function(options) {
			return searchApi.search(options);
		}
	};
	this.Tracks = Tracks;
};

module.exports = {
	SoundCloud: SoundCloud,
	YouTube: YouTube
}