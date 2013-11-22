var _ = require('underscore');

var metadataParams = ['url', 'permalink', 'siteMediaID', 
        'siteCode', 'icon', 'author', 
        'mediaName', 'duration', 'type'];
var statParams = ['plays', 'favorites'];
var allParams = metadataParams.concat(statParams);

var SearchResult = function(params) {
    _.each(metadataParams, function(key) {
        if (!_(params).has(key) || params[key] == null) {
            throw new Error('Search result data needs to have a parameter named "' + key + "'.");
        }
    });
    _.extend(this, _.pick(params, metadataParams));
    var stats = {querySimilarity: 1, playRelevance: 1, favoriteRelevance: 1, relevance: 0.5};
    stats = _.extend(stats, _.pick(params, statParams));
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
    },
    deleteStats: function() {
        this.stats = null;
    }
};

module.exports = {
    SearchResult: SearchResult
}