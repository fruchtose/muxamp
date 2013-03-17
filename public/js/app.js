soundManager.debugMode = false;
soundManager.flashVersion = 9;
soundManager.preferFlash = false;
soundManager.url = 'swf/';

var YouTube = new YouTubeInterface({el: $("#video")});
var Playlist = new TrackPlaylist();
var SearchResults = new SearchResultsProvider();
$(document).ready(function() {
    window.Router = new PlaylistRouter();
    var mainView = new MainView().toggleBlock().render();
    Playlist.once('id', function() {
        mainView.toggleBlock().render();
    });
    Playlist.on('id', function(data) {
        var fragment = (data.id) ? data.id.toString() : "";
        Router.navigate(fragment, {trigger: false});
    });
    Backbone.history.start({pushState: true});
});