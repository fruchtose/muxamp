var _ = require('underscore')._;

function SearchResult(options) {
	_.extend(this, _.pick(options, 
		'url', 'permalink', 'siteMediaID', 
		'siteCode', 'icon', 'author', 
		'mediaName', 'duration', 'type'));
	var stats = {querySimilarity: 1, playRelevance: 1, favoriteRelevance: 1, relevance: 0.5};
	stats = _.extend(stats, _.pick(options, 'plays', 'favorites'));
	stats.plays = parseInt(stats.plays) || 0;
	stats.favorites = parseInt(stats.favorites) || 0;
	stats.querySimilarity = 1;
	stats.playRelevance = 1;
	stats.favoriteRelevance = 1;
	this.stats = stats;
}

SearchResult.prototype = {
	calculateRelevance: function() {
    	var lambdaPlays = 0.70, 
    		lambdaFavorites = 0.30,
    		playRelevance = lambdaPlays * this.stats.playRelevance,
    		favRelevance = lambdaFavorites * this.stats.favoriteRelevance;
    		//console.log(playRelevance, favRelevance);
    	this.stats.relevance = (playRelevance + favRelevance) * this.stats.querySimilarity;	
	}
};

module.exports = {
	SearchResult: SearchResult
}