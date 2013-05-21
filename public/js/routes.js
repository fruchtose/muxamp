var PlaylistRouter = Backbone.Router.extend({
    initialize: function() {
        this.lastUrl = false;
        this.on('all', function(router){
            var url = Backbone.history.getFragment();
            if (location != router.lastUrl) {
                router.lastUrl = url;
                if (window._gaq) {
                    window._gaq.push(['_trackPageview', '/' + url]);
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
            id: playlistID,
            readonly: true,
            reset: true
        });
    },

    reset: function() {
        return Playlist.reset();
    }
});