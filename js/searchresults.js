function SearchResultsView(root) {
    this.results = [];
    this.root = root.toString();
}

SearchResultsView.prototype = {
    _getResultRow: function(result) {
        return "<li>" + result.artist + " - " + result.mediaName + "</li>";
    },
    setSearchResults: function(results) {
        this.results = results;
        var i, rows = [];
        for (i in results) {
            rows.push(this._getResultRow(results[i]));
        }
        $(this.root).html(rows.join(""));
    }
};

var searchResultsView = new SearchResultsView("#search-results");