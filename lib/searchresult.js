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
	this.plays = plays || 0;
	this.favorites = favorites || 0;
	this.querySimilarity = 1;
	this.playRelevance = 1;
	this.favoriteRelevance = 1;
}

SearchResult.prototype = {
	calculateRelevance: function() {
    	var lambdaPlays = 0.70;
    	var lambdaFavorites = 0.30;
    	this.relevance = (lambdaPlays * this.playRelevance + lambdaFavorites * this.favoriteRelevance) * this.querySimilarity;	
	}
};

module.exports = {
	SearchResult: SearchResult
}