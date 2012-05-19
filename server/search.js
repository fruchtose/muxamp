function SearchResult(siteName, url, permalink, siteMediaID, siteCode, icon, artist, mediaName, duration, type, plays, favorites) {
	this.siteName = siteName;
	this.url = url;
	this.permalink = permalink;
	this.siteMediaID = siteMediaID;
	this.siteCode = siteCode;
	this.artist = artist;
	this.mediaName = mediaName;
	this.duration = duration;
	this.type = type;
	this.plays = plays;
	this.favorites = favorites;
}

SearchResult.prototype = {
	calculateRelevance: function() {
        	var lambdaPlays = 0.70;
        	var lambdaFavorites = 0.30;
        	this.relevance = (lambdaPlays * this. playRelevance + lambdaFavorites * this.favoriteRelevance) * this.querySimilarity;	
	}
};

function SearchManager () {
	this.soundcloudKey = "2f9bebd6bcd85fa5acb916b14aeef9a4";
	this.soundcloudSearchURI = "http://api.soundcloud.com/tracks.json?client_id=" + this.soundcloudKey + "&limit=25&offset=0&filter=streamable&order=hotness&q=";
	this.youtubeSearchURI = "https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=25&orderby=relevance&alt=jsonc&q=";

}

SearchManager.prototype = {
	getSeparatedWords: function(query) {
		var words = query.replace(/[^\w\s]|_/g, ' ').toLowerCase().split(' ');
	},
	search: function(query, site) {
		var results =[];
		switch(site) {
			case 'sct':
				results = this.searchSoundCloudTracks(query);
				break;
			case 'ytv':
				results = this.searchYouTubeVideos(query);
				break;
		}
	},
	searchSoundCloudTracks: function(query) {
		var searchManager = this;
		var words = this.getSeparatedWords(query);
		request({
			json: true,
			method: 'GET',
			url: searchManager.soundcloudSearchURI
		}, function(error, response, body) {
			var i;
			for (i in body) {
				var result = body[i];
				if (undefined == result.playback_count) {
                			result.playback_count = -1 * parseInt(i) - 1;
                			result.favoritings_count = -1 * parseInt(i) - 1;
				}
				if (undefined == result.stream_url) {
					continue;
				}
				var searchResult = new SearchResult("SoundCloud", result.stream_url + "?client_id=$soundcloud_key", result.permalink_url, result.id, "sct", result.user.username, result.title, result.duration / 1000, "audio", result.playback_count, result.favoritings_count);
				var resultWords = this.getSeparatedWords(searchResult.artist + ' ' + searchResult.mediaName);
			}
		});
	},
	searchYouTubeVideos: function(query) {
		var searchManager = this;
		var words = this.getSeparatedWords(query);
		request({
			json: true,
			method: 'GET',
			url: searchManager.youtubeSearchURI
		}, function(error, response, body) {
			
		});
	}
};
