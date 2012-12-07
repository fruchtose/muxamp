/*function SearchResultsView(root, selector) {
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
		var uploader = '<td class="uploader-cell" ' + getAttribute('title', result.author) + '>' + result.author + '</td>';
		var title = '<td class="title-cell" ' + getAttribute('title', result.mediaName) + '>' + result.mediaName + '</td>';
		var seconds = secondsToString(result.duration);
		var duration = '<td class="duration-cell" ' + getAttribute('title', seconds) + '>' + seconds + '</td>';
		var link = '<td class="link-cell"><a href="' + result.permalink + '"><img src="' + result.icon + '" /></a></td>';
		return '<tr>' + actionsCell + uploader + title + duration + link + '</tr>';
    },
    setSearchResults: function(results) {
        this.results = results;
        var i, rows = [];
        for (i in results) {
            rows.push(this._getResultRow(results[i], parseInt(i) + 1));
        }
        var tableRows;
        if (searchResultsPage <= 0) {
        	tableRows = $(this.root).html(rows.join(""))
        }
        else {
        	tableRows = $(this.root).append(rows.join(""));
        }
        tableRows.find(this.selector).draggable({
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
        if (rows.length == 0) {
        	searchResultsPage--;
        }
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
});*/