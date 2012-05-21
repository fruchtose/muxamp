var $ = require('jquery-deferred'),
	request = require('request');

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

function SearchResult(url, permalink, siteMediaID, siteCode, author, mediaName, duration, type, plays, favorites) {
	this.url = url;
	this.permalink = permalink;
	this.siteMediaID = siteMediaID;
	this.siteCode = siteCode;
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
	this.soundcloudKey = "2f9bebd6bcd85fa5acb916b14aeef9a4";
	this.soundcloudSearchURI = "http://api.soundcloud.com/tracks.json?client_id=" + this.soundcloudKey + "&limit=25&offset=0&filter=streamable&order=hotness&q=";
	this.youtubeSearchURI = "https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=25&orderby=relevance&alt=json&q=";
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
	search: function(query, site) {
		this.reset();
		var deferred, searchManager = this;
		switch(site) {
			case 'sct':
				deferred = this.searchSoundCloudTracks(query);
				break;
			case 'ytv':
				deferred = this.searchYouTubeVideos(query);
				break;
		}
		return deferred.pipe(function(results) {
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
				//delete results[i].relevance;
			}
			return results;
		},
		function(failedResults) {
			return [];
		});
	},
	searchSoundCloudTracks: function(query) {
		var soundcloudConsumerKey = '2f9bebd6bcd85fa5acb916b14aeef9a4';
		var searchManager = this;
		var deferred = $.Deferred();
		var words = getSeparatedWords(query);
		console.log("Searching YouTube for " + words.join(" "));
		request({
			json: true,
			method: 'GET',
			url: searchManager.soundcloudSearchURI + encodeURIComponent(query)
		}, function(error, response, body) {
			if (error) {
				deferred.reject();
				return;
			}
			var i, results = [];
			for (i in body) {
				var result = body[i];
				if (undefined == result.playback_count) {
                			result.playback_count = -1 * parseInt(i) - 1;
                			result.favoritings_count = -1 * parseInt(i) - 1;
				}
				if (undefined == result.stream_url) {
					continue;
				}
				var searchResult = new SearchResult(result.stream_url + "?client_id=" + soundcloudConsumerKey, result.permalink_url, result.id, "sct", result.user.username, result.title, result.duration / 1000, "audio", result.playback_count, result.favoritings_count);
				var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
				var intersection = getIntersection(words, resultWords);
				searchResult.querySimilarity = intersection.length / words.length;
				searchManager.checkMaxPlays(searchResult.plays);
				searchManager.checkMaxFavorites(searchResult.favorites);
				results.push(searchResult);
			}
			deferred.resolve(results);
		});
		return deferred.promise();
	},
	searchYouTubeVideos: function(query, deferred) {
		var searchManager = this;
		var deferred = $.Deferred();
		var words = getSeparatedWords(query);
		request({
			json: true,
			method: 'GET',
			url: searchManager.youtubeSearchURI + encodeURIComponent(query)
		}, function(error, response, body) {
			if (error) {
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
				var searchResult = new SearchResult(permalink, permalink, id, "ytv", author, title, duration, "video", viewCount, favoriteCount);
				var resultWords = getSeparatedWords(searchResult.author + ' ' + searchResult.mediaName);
				var intersection = getIntersection(words, resultWords);
				searchResult.querySimilarity = intersection.length / words.length;
				searchManager.checkMaxPlays(searchResult.plays);
				searchManager.checkMaxFavorites(searchResult.favorites);
				results.push(searchResult);
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