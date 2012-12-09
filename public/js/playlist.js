var Playlist = new TrackPlaylist();
/*$(document).ready(function() {
    var startPos;
    $(playlist.playlistDOM.parentTable).sortable({
        axis: 'y',
        containment: 'document',
        helper: function(event, ui) {
    		var children = ui.children();
    		var helper = ui.clone();
    		helper.children().each(function(index) {
    			$(this).width(children.eq(index).width());
    		});
    		return helper;
    	},
        start: function(event, ui) {
            startPos = $(event.target).parent(playlist.playlistDOM.allRowsInTable).index();
        },
        tolerance: 'pointer',
        stop: function(event, ui) {
            var pos = ui.item.index();
            playlist.moveTrack(startPos, pos);
        }
    });
});*/

var SearchResults = new SearchResultsProvider();