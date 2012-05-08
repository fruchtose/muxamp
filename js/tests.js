QUnit.moduleDone = function(settings) {
    playlist.clear();
};

$(document).ready(function() {
    
    playlist.updateSettings({
        updateURLOnAdd: false
    });
    
    module("Initialization");

    asyncTest("SoundManager 2 loaded", function() {
        expect(1);
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

    module("Loading Media");
    
    asyncTest("Resolving a Reddit link", function() {
        var index = 0;
        expect(3);
        var deferred = $.Deferred();
        router.resolveReddit("http://reddit.com/r/music", false, deferred, false, false, {
            trackIndex: index
        }).always(function(resultsData){
            equal(this.state(), "resolved", "The Reddit link should be resolved.");
            equal($.isFunction(resultsData.action), true, "The resolver should return an action to execute after resolution.");
            equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
            start();
        });
    });

    asyncTest("Resolving a SoundCloud link", function() {
        var expected = 8;
        expect(expected);
        var counter = 0;
        
        var checkForStart = function(additional) {
            counter+= additional;
            if (counter == expected) {
                start();
            }
        };
        
        (function() {
            var index = 0;
            var deferred = $.Deferred();
            router.resolveSoundCloud("http://soundcloud.com/herewave/electric-wrecker", false, deferred, false, false, {
                trackIndex: index
            }).always(function(resultsData) {
                equal(this.state(), "resolved", "The song should be resolved.");
                equal($.isFunction(resultsData.action), true, "The resolver should return an action to execute after resolution.");
                equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
                checkForStart(3);
            });
        })();
        
        (function() {
            var index = 0;
            var deferred = $.Deferred();
            router.resolveSoundCloud("http://soundcloud.com/foofighters/sets/wasting-light/", false, deferred, false, false, {
                trackIndex: index
            }).always(function(resultsData){
                equal(this.state(), "resolved", "The playlist should be resolved.");
                equal($.isFunction(resultsData.action), true, "The resolver should return an action to execute after resolution.");
                equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
                checkForStart(3);
            });
        })();
        
        (function() {
            var index = 0;
            var deferred = $.Deferred();
            router.resolveSoundCloud("http://soundcloud.com/foofighters", false, deferred, false, false, {
                trackIndex: index
            }).always(function(resultsData){
                equal(this.state(), "rejected", "No track or playlist in this URL, should be rejected.");
                equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
                checkForStart(2);
            });
        })();
    });
    
    asyncTest("Resolving a YouTube link", function() {
        var expected = 5;
        expect(expected);
        var counter = 0;
        (function() {
            var index = 0;
            var deferred = $.Deferred();
            router.resolveYouTube("http://www.youtube.com/watch?v=X9QtdiRJYro", false, deferred, false, false, {
                trackIndex: index
            }).always(function(resultsData) {
                equal(this.state(), "resolved", "The video should be resolved.");
                equal($.isFunction(resultsData.action), true, "The resolver should return an action to execute after resolution.");
                equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
                counter+= 3;
                if (counter == expected) {
                    start();
                }
            });
        })();
    
        (function() {
            var index = 0;
            var deferred = $.Deferred();
            router.resolveYouTube("http://www.youtube.com/watch?v=0", false, deferred, false, false, {
                trackIndex: index
            }).always(function(resultsData){
                equal(this.state(), "rejected", "The video should not be resolved.");
                equal(resultsData.trackIndex, index, "The data returned by the resolver should include the same track index as the input.");
                counter+= 2;
                if (counter == expected) {
                    start();
                }
            });
        })();
    });
    
    module("Adding to playlist");
    
    asyncTest("Adding tracks to playlist without blocking UI", function() {
        var expected = 6;
        var counter = 0;
        expect(expected);
        var handler = function(additional) {
            counter += additional;
            if (counter == expected) {
                start();
            }
        };
        playlist.addResource("http://soundcloud.com/herewave/electric-wrecker").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud track.");
            equal(playlist.list[0].permalink, "http://soundcloud.com/herewave/electric-wrecker", "The first added track in the playlist is the first track in the playlist.");
            handler(2);
        });
        playlist.addResource("http://soundcloud.com/foofighters/sets/wasting-light/").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud playlist.");
            handler(1);
        });
        playlist.addResource("http://www.youtube.com/watch?v=X9QtdiRJYro").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable YouTube video.");
            equal(playlist.list[12].permalink, "http://www.youtube.com/watch?v=X9QtdiRJYro", "The YouTube track is added to the playlist in order.");
            handler(2);
        });
        playlist.addResource("http://reddit.com/r/music").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a subreddit.");
            handler(1);
        });
    });
    
    asyncTest("Adding tracks to playlist and blocking UI", function() {
        var expected = 6;
        var counter = 0;
        expect(expected);
        var handler = function(additional) {
            counter += additional;
            if (counter == expected) {
                start();
            }
        };
        playlist.addResourceAndWaitUntilLoaded("http://soundcloud.com/herewave/electric-wrecker").always(function(resolvedData) {
            equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud track.");
            equal(playlist.list[0].permalink, "http://soundcloud.com/herewave/electric-wrecker", "The first added track in the playlist is the first track in the playlist.");
            handler(2);
            console.log("x");
        }).always(function() {
            console.log("z");
            playlist.addResourceAndWaitUntilLoaded("http://soundcloud.com/foofighters/sets/wasting-light/").always(function(resolvedData) {
                console.log("x");
                equal(this.state(), "resolved", "Router should be able to route a streamable SoundCloud playlist.");
                handler(1);
            }).always(function() {
                playlist.addResourceAndWaitUntilLoaded("http://www.youtube.com/watch?v=X9QtdiRJYro").always(function(resolvedData) {
                    equal(this.state(), "resolved", "Router should be able to route a streamable YouTube video.");
                    equal(playlist.list[12].permalink, "http://www.youtube.com/watch?v=X9QtdiRJYro", "The YouTube track is added to the playlist in order.");
                    handler(2);
                }).always(function() {
                    playlist.addResourceAndWaitUntilLoaded("http://reddit.com/r/music").always(function(resolvedData) {
                    equal(this.state(), "resolved", "Router should be able to route a subreddit.");
                    handler(1);
            });
                });
            });
        });
    });
});