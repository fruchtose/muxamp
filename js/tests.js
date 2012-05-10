QUnit.moduleDone = function(settings) {
    playlist.clear();
};

$(document).ready(function() {
    
    playlist.updateSettings({
        updateURLOnAdd: false
    });
    
    initTests();
    
    loadMediaTests();
    
    addToPlaylistTests();
    
    playlistInteractionTests();
});

var initTests = function() {
    module("Initialization");

    test("SoundManager 2 loaded", function() {
        expect(1);
        stop();
        soundManager.onready(function() {
            ok(true, "SoundManager 2 loaded.");
            start();
        });
    });

    test("Router loaded", function() {
        expect(1);
        equal(typeof router === "object", true, "The router object should be an initialized object.");
    });

    test("Playlist loaded", function() {
        expect(1);
        equal(typeof router === "object", true, "The playlist object should be an initialized object.");
    });
};

var loadMediaTests = function() {
    module("Loading media");
    
    test("Resolving a Reddit link", function() {
        var index = 0, deferred = $.Deferred();
        expect(3);
        stop();
        router.resolveReddit("http://reddit.com/r/music", false, deferred, {
            trackIndex: index
        }).always(function(resultsData){
            equal(this.state(), "resolved", "The Reddit link should be resolved.");
            equal($.isArray(resultsData.tracks), true, "The resolver should return media objects.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });
    
    test("Resolving a SoundCloud track", function() {
        var index = 0, deferred = $.Deferred();
        expect(3);
        stop();
        router.resolveSoundCloud("http://soundcloud.com/herewave/electric-wrecker", false, deferred, {
            trackIndex: index
        }).always(function(resultsData) {
            equal(this.state(), "resolved", "The song should be resolved.");
            equal($.isArray(resultsData.tracks), true, "The resolver should return media objects.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });
    
    test("Resolving a SoundCloud set", function() {
        var index = 0, deferred = $.Deferred();
        expect(3);
        stop();
        router.resolveSoundCloud("http://soundcloud.com/foofighters/sets/wasting-light/", false, deferred, {
            trackIndex: index
        }).always(function(resultsData){
            equal(this.state(), "resolved", "The playlist should be resolved.");
            equal($.isArray(resultsData.tracks), true, "The resolver should return media objects.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });
    
    test("Resolving an invalid SoundCloud link", function() {
        var index = 0, deferred = $.Deferred();
        expect(2);
        stop();
        router.resolveSoundCloud("http://soundcloud.com/foofighters", false, deferred, {
            trackIndex: index
        }).always(function(resultsData){
            equal(this.state(), "rejected", "No track or playlist in this URL, should be rejected.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });
    
    test("Resolving a YouTube link", function() {
        var index = 0, deferred = $.Deferred();
        expect(3);
        stop();
        router.resolveYouTube("http://www.youtube.com/watch?v=X9QtdiRJYro", false, deferred, {
            trackIndex: index
        }).always(function(resultsData) {
            equal(this.state(), "resolved", "The video should be resolved.");
            equal($.isArray(resultsData.tracks), true, "The resolver should return media objects.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });
    
    test("Resolving an invalid YouTube link", function() {
        var index = 0, deferred = $.Deferred();
        expect(2);
        stop();
        router.resolveYouTube("http://www.youtube.com/watch?v=0", false, deferred, {
            trackIndex: index
        }).always(function(resultsData){
            equal(this.state(), "rejected", "The video should not be resolved.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });
};

var addToPlaylistTests = function() {
    module("Adding to playlist");
    
    test("Adding tracks to playlist without blocking UI (single items)", function() {
        expect(6);
        stop();
        var actionList = [];
        actionList.push(playlist.addResource("http://soundcloud.com/herewave/electric-wrecker").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud track.");
            equal(playlist.list[0].permalink, "http://soundcloud.com/herewave/electric-wrecker", "The first added track in the playlist is the first track in the playlist.");
        }));
        actionList.push(playlist.addResource("http://soundcloud.com/foofighters/sets/wasting-light/").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud playlist.");
        }));
        actionList.push(playlist.addResource("http://www.youtube.com/watch?v=X9QtdiRJYro").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable YouTube video.");
            equal(playlist.list[12].permalink, "http://www.youtube.com/watch?v=X9QtdiRJYro", "The YouTube track is added to the playlist in order.");
        }));
        actionList.push(playlist.addResource("http://reddit.com/r/music").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a subreddit.");
        }));
        $.whenAll.apply(null, actionList).always(function() {
            start();
        });
    });
    
    test("Adding tracks to playlist without blocking UI (multiple items)", function() {
        expect(3);
        stop();
        playlist.addResource(["http://www.youtube.com/watch?v=X9QtdiRJYro", "http://soundcloud.com/herewave/electric-wrecker"]).always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route multiple items and blcok the UI.");
            equal(playlist.list[playlist.list.length - 2].permalink, "http://www.youtube.com/watch?v=X9QtdiRJYro", "The YouTube track is added to the playlist in order.");
            equal(playlist.list[playlist.list.length - 1].permalink, "http://soundcloud.com/herewave/electric-wrecker", "The Soundcloud track is added to the playlist in order.");
            start();
        });
    });
    
    test("Adding tracks to playlist and blocking UI (single items)", function() {
        expect(6);
        stop();
        var actionList = [];
        actionList.push(playlist.addResourceAndWaitUntilLoaded("http://soundcloud.com/herewave/electric-wrecker").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud track.");
            equal(playlist.list[0].permalink, "http://soundcloud.com/herewave/electric-wrecker", "The first added track in the playlist is the first track in the playlist.");
        }));
        actionList.push(playlist.addResourceAndWaitUntilLoaded("http://soundcloud.com/foofighters/sets/wasting-light/").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud playlist.");
        }));
        actionList.push(playlist.addResourceAndWaitUntilLoaded("http://www.youtube.com/watch?v=X9QtdiRJYro").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable YouTube video.");
            equal(playlist.list[12].permalink, "http://www.youtube.com/watch?v=X9QtdiRJYro", "The YouTube track is added to the playlist in order.");
        }));
        actionList.push(playlist.addResourceAndWaitUntilLoaded("http://reddit.com/r/music").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a subreddit.");
        }));
        
        $.whenAll.apply(null, actionList).always(function() {
            start(); 
        });
    });
    
    test("Adding tracks to playlist and blocking UI (multiple items)", function() {
        expect(3);
        stop();
        playlist.addResourceAndWaitUntilLoaded(["http://www.youtube.com/watch?v=X9QtdiRJYro", "http://soundcloud.com/herewave/electric-wrecker"]).always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route multiple items and blcok the UI.");
            equal(playlist.list[playlist.list.length - 2].permalink, "http://www.youtube.com/watch?v=X9QtdiRJYro", "The YouTube track is added to the playlist in order.");
            equal(playlist.list[playlist.list.length - 1].permalink, "http://soundcloud.com/herewave/electric-wrecker", "The Soundcloud track is added to the playlist in order.");
            start();
        });
    });
};

var playlistInteractionTests = function() {
    var mediaAdded;
    module("Playlist interaction", {
        setup: function() {
            mediaAdded = playlist.addResource(["http://www.youtube.com/watch?v=X9QtdiRJYro", "http://soundcloud.com/herewave/electric-wrecker"]);
        },
        teardown: function() {
            playlist.clear();
        }
    });
    
    test("Playing and pausing", function() {
        expect(3);
        stop();
        mediaAdded.always(function(resolvedData) {
            playlist.play();
            setTimeout(function() {
                equal(playlist.isPlaying(), true, "The playlist can play media.");
                equal(playlist.currentTrack, 0, "The first track is being played.");
                playlist.togglePause();
                setTimeout(function() {
                    equal(playlist.isPaused(), true, "The playlist can be paused.");
                    start();
                }, 500);
            }, 5000);
        });
    });
    
    test("Playing and stopping", function() {
        expect(3);
        stop();
        mediaAdded.always(function() {
            playlist.play();
            setTimeout(function() {
                equal(playlist.isPlaying(), true, "The playlist can play media.");
                equal(playlist.currentTrack, 0, "The first track is being played.");
                playlist.stop();
                setTimeout(function() {
                    equal(playlist.isPlaying(), false, "The playlist can be stopped.");
                    start();
                }, 500);
            }, 5000);
        });
    });
};