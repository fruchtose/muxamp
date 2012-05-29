function SearchResultsView(root, selector) {
    this.results = [];
    this.root = root.toString();
    this.resultSelector  = this.root + ' ' + selector;
}

SearchResultsView.prototype = {
    _getResultRow: function(result, index) {
		var add = '<a class="btn action search-add-result" href onclick="return false;"><i class="icon-plus"></i></a>';
	    var play ='<a class="btn action search-play-result" href onclick="return false;"><i class="icon-play"></i></a>';
	    var actions = '<div class="actions">' + add + play + '</div>';
		var number = '<td>' + index + '</td>';
		var uploader = '<td>' + result.author + '</td>';
		var title = '<td>' + result.mediaName + '</td>';
		return '<tr>' + number + uploader + title + '</tr>';
        /*var add = '<a class="btn action search-add-result" href onclick="return false;"><i class="icon-plus"></i></a>';
        var play ='<a class="btn action search-play-result" href onclick="return false;"><i class="icon-play"></i></a>';
        var actions = '<div class="actions">' + add + play + '</div>';
        var desc = '<div class="content">' + result.author + " - " + result.mediaName + '</div>';
        return "<li>" + ' ' + actions + desc + "</li>";*/
    },
    setSearchResults: function(results) {
        this.results = results;
        var i, rows = [];
        for (i in results) {
            rows.push(this._getResultRow(results[i], parseInt(i) + 1));
        }
        $(this.root).html(rows.join("")).disableSelection();
    }
};

var searchResultsView = new SearchResultsView("#search-results tbody", 'tr');