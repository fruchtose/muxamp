function SearchResultsView(root) {
    this.results = [];
    this.root = root.toString();
}

SearchResultsView.prototype = {
    _getResultRow: function(result) {
        var add = '<a class="btn action search-add-result" href onclick="return false;"><i class="icon-plus"></i></a>';
        var play ='<a class="btn action search-play-result" href onclick="return false;"><i class="icon-play"></i></a>';
        var actions = '<div class="actions">' + add + play + '</div>';
        var desc = '<div class="content">' + result.author + " - " + result.mediaName + '</div>';
        return "<li>" + ' ' + actions + desc + "</li>";
    },
    setSearchResults: function(results) {
        this.results = results;
        var i, rows = [];
        for (i in results) {
            rows.push(this._getResultRow(results[i]));
        }
        $(this.root).html(rows.join("")).disableSelection();
    }
};

var searchResultsView = new SearchResultsView("#search-results");