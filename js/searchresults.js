function SearchResultsView(root) {
    this.results = [];
    this.root = root.toString();
}

SearchResultsView.prototype = {
    _getResultRow: function(result) {
        var add = '<a class="search-add-result" href onclick="return false;">+</a>';
        var actions = '<div class="search-actions">' + add + '</div>';
        var desc = '<div class="desc">' + result.artist + " - " + result.mediaName + '</div>';
        return "<li>" + ' ' + actions + desc + "</li>";
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