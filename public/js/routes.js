var PlaylistRouter = Backbone.Router.extend({
	routes: {
		"": "load",
		"/": "load",
		":playlistID": "load" //load
	},

	load: function(playlistID) {
		var result;
		playlistID = playlistID || false;
		if (playlistID) {
			playlist.id = playlistID;
			result = playlist.fetch();
		} else {
			result = $.Deferred().promise().reject();
		}
		return result;
	}
});

var playlistRouter = new PlaylistRouter();