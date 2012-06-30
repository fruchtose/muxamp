var $ 		= require('jquery-deferred'),
	request = require('request'),
	db		= require('./db'),
	cacher	= require('node-dummy-cache');
	
var dbConnectionPool 	= db.getConnectionPool(),
	searchResultsCache	= cacher.create(cacher.ONE_SECOND * 30, cacher.ONE_SECOND * 10);

// Thanks to Jeffrey To http://www.falsepositives.com/index.php/2009/12/01/javascript-function-to-get-the-intersect-of-2-arrays/
var getIntersection = function(arr1, arr2) {
    var r = [], o = {}, l = arr2.length, i, v;
    for (i = 0; i < l; i++) {
        o[arr2[i]] = true;
    }
    l = arr1.length;
    for (i = 0; i < l; i++) {
        v = arr1[i];
        if (v in o) {
            r.push(v);
        }
    }
    return r;
}

var getSeparatedWords = function(query) {
	return query.replace(/[^\w\s]|_/g, ' ').toLowerCase().split(' ');
};

function SearchResult(url, permalink, siteMediaID, siteCode, icon, author, mediaName, duration, type, plays, favorites) {
	this.url = url;
	this.permalink = permalink;
	this.siteMediaID = siteMediaID;
	this.siteCode = siteCode;
	this.icon = icon;
	this.author = author;
	this.mediaName = mediaName;
	this.duration = duration;
	this.type = type;
	if (undefined != plays) {
		this.plays = plays;
	}
	if (undefined != favorites) {
		this.favorites = favorites;
	}
}

SearchResult.prototype = {
	calculateRelevance: function() {
    	var lambdaPlays = 0.70;
    	var lambdaFavorites = 0.30;
    	this.relevance = (lambdaPlays * this.playRelevance + lambdaFavorites * this.favoriteRelevance) * this.querySimilarity;	
	}
};

function SearchManager () {
	this.resultCount = 25;
	this.soundcloudKey = "2f9bebd6bcd85fa5acb916b14aeef9a4";
	this.soundcloudSearchURI = "http://api.soundcloud.com/tracks.json?client_id=" + this.soundcloudKey + "&limit=" + this.resultCount + "&filter=streamable&order=hotness";
	this.youtubeSearchURI = "https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=" + this.resultCount + "&orderby=relevance&alt=json";
	this.reset();
}

SearchManager.prototype = {
	checkMaxFavorites: function(favs) {
		if (favs > this.maxFavorites) {
			this.maxFavorites = favs;
		}
	},
    checkMaxPlays: function(plays) {
		if (plays > this.maxPlays) {
			this.maxPlays = plays;
		}
	},
	reset: function() {
		this.maxFavorites = 0;
		this.maxPlays = 0;
	},
	saveSearchResults: function(searchResults) {
		var result, i;
		
		if (searchResults.length) {
			dbConnectionPool.acquire(function(acquireError, connection) {
				if (!acquireError) {
					var queryString = ["INSERT INTO KnownMedia (site, mediaid) VALUES "];
					for (i in searchResults) {
						result = searchResults[i];
						queryString.push("(" + connection.escape(result.siteCode.toLowerCase()) + "," + connection.escape(result.siteMediaID) + ")");
						if (parseInt(i) < searchResults.length - 1) {
							queryString.push(",");
						}
						else {
							queryString.push(" ON DUPLICATE KEY UPDATE id=id;");
						}
					}
					connection.query(queryString.join(""), function(queryError, rows) {
						dbConnectionPool.release(connection);
					});
				}
				else {
					dbConnectionPool.release(connection);
				}
			});
		}
	},
	search: function(query, page, site) {
		this.reset();
		page = Math.max(parseInt(page || '0'), 0);
		var deferred, searchManager = this;
		var cacheKey = {query: query, page: page, site: site};
		var cachedResults = searchResultsCache.get(cacheKey);
		if (!cachedResults) {
			switch(site) {
				case 'sct':
					deferred = this.searchSoundCloudTracks(query, page);
					break;
				case 'ytv':
					deferred = this.searchYouTubeVideos(query, page);
					break;
			}
		}
		else {
			deferred = $.Deferred();
			deferred.resolve(cachedResults);
			deferred = deferred.promise();
		}
		return deferred.pipe(function(results) {
			searchManager.saveSearchResults(results);
			if (!cachedResults) {
				var i;
				for (i in results) {
					if (results[i].plays < 0) {
						var newPlays = 0, newFavorites = 0, j;
						for (j = -1 * results[i].plays; j < results.length; j++) {
							if (results[j].plays >= 0) {
								newPlays = results[j].plays;
								newFavorites = results[j].plays;
								break;
							}
						}
						results[i].plays = newPlays;
						results[i].favorites = newFavorites;
					}
					var plays = results[i].plays, favs = results[i].favorites;
					results[i].playRelevance = Math.log(plays + 1) / Math.log(searchManager.maxPlays + 1);
					results[i].favoriteRelevance = Math.log(favs + 1) / Math.log(searchManager.maxFavorites + 1);
					results[i].calculateRelevance();
				}
				results.sort(function(a, b) {
					return b.relevance - a.relevance;
				});
				for (i in results) {
					delete results[i].favoriteRelevance;
					delete results[i].favorites;
					delete results[i].playRelevance;
					delete results[i].plays;
					delete results[i].querySimilarity;
					delete results[i].relevance;
				}
			}
			else {
				results = cachedResults;
				if (results.length) {
					searchResultsCache.put(cacheKey, results);
				}
			}
			return results;
		},
		function(failedResults) {
			return [];
		});
	},
	searchSoundCloudTracks: function(query, page) {
		var soundcloudConsumerKey = '2f9bebd6bcd85fa5acb916b14aeef9a4';
		var searchManager = this;
		var deferred = $.Deferred();
		var words = getSeparatedWords(query);
		request({
			json: true,
			method: 'GET',
			timeout: 5000,
			url: searchManager.soundcloudSearchURI + '&offset=' + (searchManager.resultCount * page + 1) + '&q=' + encodeURIComponent(query)
		}, function(error, response, body) {
			if (error || response.statusCode != 200) {
				deferred.reject();
				return;
			}
			var i, results = [];
			try {
				for (i in body) {
					var result = body[i];
					if (undefined == result.playback_count) {
	                			result.playback_count = -1 * parseInt(i) - 1;
	                			result.favoritings_count = -1 * parseInt(i) - 1;
					}
					if (undefined == result.stream_url) {
						continue;
					}
					var searchResult = new SearchResult(result.stream_url + "?client_id=" + soundcloudConsumerKey, result.permalink_url, result.id, "sct", "img/soundcloud_orange_white_16.png", result.user.username, result.title, result.duration / 1000, "audio", result.playback_count, result.favoritings_count);
					var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
					var intersection = getIntersection(words, resultWords);
					searchResult.querySimilarity = intersection.length / words.length;
					searchManager.checkMaxPlays(searchResult.plays);
					searchManager.checkMaxFavorites(searchResult.favorites);
					results.push(searchResult);
				}
			}
			catch(err) {
				console.log("Error reading SoundCloud results");
			}
			deferred.resolve(results);
		});
		return deferred.promise();
	},
	searchYouTubeVideos: function(query, page) {
		var searchManager = this;
		var deferred = $.Deferred();
		var words = getSeparatedWords(query);
		request({
			json: true,
			method: 'GET',
			timeout: 5000,
			url: searchManager.youtubeSearchURI + '&start-index='  + (searchManager.resultCount * page + 1) + '&q=' + encodeURIComponent(query)
		}, function(error, response, body) {
			if (error || response.statusCode != 200) {
				deferred.reject();
				return;
			}
			var i, results = [];
			var feed = body.feed;
			if (!feed) {
				return results;
			}
			var videos = feed.entry;
			if (!videos) {
				return results;
			}
			try {
				for (i in videos) {
					var entry = videos[i];
					var id = entry['id']['$t'].split(':').pop();
					var permalink = 'http://www.youtube.com/watch?v=' + id;
					var authorObj = entry.author[0];
		            var author = authorObj.name.$t;
					var title = entry.title.$t;
		            var duration = parseInt(entry.media$group.yt$duration.seconds);
		            var viewCount = entry['yt$statistics']['viewCount'];
		            var favoriteCount = entry['yt$statistics']['favoriteCount'];
					var searchResult = new SearchResult(permalink, permalink, id, "ytv", "img/youtube.png", author, title, duration, "video", viewCount, favoriteCount);
					var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
					var intersection = getIntersection(words, resultWords);
					searchResult.querySimilarity = intersection.length / words.length;
					searchManager.checkMaxPlays(searchResult.plays);
					searchManager.checkMaxFavorites(searchResult.favorites);
					results.push(searchResult);
				}
			}
			catch(err) {
				console.log("Error reading YouTube results");
			}
			deferred.resolve(results);
		});
		return deferred.promise();
	}
};

module.exports = {
  search: function() {
	return new SearchManager();
  },
  searchResult: SearchResult
};