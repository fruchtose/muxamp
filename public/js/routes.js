var PlaylistRouter = Backbone.Router.extend({
	initialize: function() {
		this.lastUrl = false;
		this.on('all', function(router){
			var url = Backbone.history.getFragment();
			if (location != router.lastUrl) {
				router.lastUrl = url;
				if (_gaq) {
	    			_gaq.push(['_trackPageview', '/' + url]);
	    		}
			}
		});
	},

	routes: {
		"": "reset",
		":playlistID": "load" //load
	},

	load: function(playlistID) {
		var router = this;
		return Playlist.fetch({
			id: playlistID
		});
	},

	reset: function() {
		Playlist.reset();
		var result = $.Deferred().resolve();
		return result.promise();
	}
});

soundManager.debugMode = false;
soundManager.flashVersion = 9;
soundManager.preferFlash = false;
soundManager.url = 'swf/';

var Playlist = new TrackPlaylist();
var SearchResults = new SearchResultsProvider();
$(document).ready(function() {
	var router = new PlaylistRouter();
	var mainView = new MainView().toggleBlock().render();
	Playlist.once('sync', function() {
		mainView.toggleBlock();
	});
	Playlist.on('sync', function(data) {
		var fragment = (data.id) ? data.id.toString() : "";
		router.navigate(fragment, {trigger: false});
	});
	Backbone.history.start({pushState: true});
});