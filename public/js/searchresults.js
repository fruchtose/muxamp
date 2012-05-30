function SearchResultsView(root, selector) {
    this.results = [];
    this.root = root.toString();
    this.selector = selector;
    this.resultSelector  = this.root + ' ' + selector;
}

SearchResultsView.prototype = {
    _getResultRow: function(result, index) {
		var add = '<a class="btn action search-add-result" href onclick="return false;"><i class="icon-plus"></i></a>';
	    var play ='<a class="btn action search-play-result" href onclick="return false;"><i class="icon-play"></i></a>';
	    var actions = '<div class="actions">' + add + play + '</div>';
	    var actionsCell = '<td class="action-cell">' + actions + '</td>';
		var uploader = '<td class="uploader-cell">' + result.author + '</td>';
		var title = '<td class="title-cell">' + result.mediaName + '</td>';
		var duration = '<td class="duration-cell">' + secondsToString(result.duration) + '</td>';
		var link = '<td class="link-cell"><a href="' + result.permalink + '"><img src="' + result.icon + '" /></a></td>';
		return '<tr>' + actionsCell + uploader + title + duration + link + '</tr>';
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
        $(this.root).html(rows.join(""))
        .find(this.selector).draggable({
        	// thanks to David Petersen
        	helper: function(event, ui) {
        		var originalRow = $(event.target).closest('tr');
        		//var newRow = originalRow.clone()
        		//.data("search-index", originalRow.index());
        		return $('<div class="drag-search-result"></div>')
        		.data("search-index", originalRow.index())
        		.append(originalRow.find('.uploader-cell').html() + ' &mdash; ' + originalRow.find('.title-cell').html()).appendTo('body');
        	}
        }).disableSelection();
    }
};

var searchResultsView = new SearchResultsView("#search-results tbody", 'tr');
$("#playlist-tab").droppable({
	accept: '#search-results .ui-draggable',
	drop: function(event, ui) {
		//alert("Hi");
		var index = ui.helper.data("search-index");
		ui.helper.remove();
		playlist.addTracks(getMediaObject(searchResultsView.results[index]));
		
	},
	hoverClass: 'nav-hover'
});