;(function() {
    var playlists = [];
    var testTrack = function(track) {
        track.should.be.an('object');
        track.should.not.be.empty;
        track.siteMediaID.should.not.be.empty;
        track.duration.should.be.above(0);
    };
    var testSearchResults = function(results) {
        results.should.be.an('array');
        results.length.should.be.above(0);
        testTrack(results[0]);
    };
    var testTrackModel = function(track) {
        track.should.be.an('object');
        track.should.not.be.empty;
        track.get('siteMediaID').should.not.be.empty;
        track.get('duration').should.be.above(0);
        track.get('permalink').should.not.be.empty;
    };
    var testPlaylistAdding = function(playlist, searchResults, done) {
        var startLength = playlist.size(), startId = playlist.id;
        searchResults.once('results:new', function(collection, options) {
            collection.each(function(model) {
                testTrackModel(model);
            });
            playlist.once('id', function() {
                Playlist.id.should.be.above(0);
                Playlist.id.should.not.eql(startId);
                Playlist.size().should.be.above(startLength);
                done();
            })
            playlist.add(collection.first());
        });
    };
    var testGUIPlaylistAdding = function(playlist, searchResults, done) {
        var startLength = playlist.size(), startId = playlist.id;
        searchResults.once('results:new', function(collection, options) {
            collection.each(function(model) {
                testTrackModel(model);
            });
            playlist.once('id', function() {
                Playlist.id.should.be.above(0);
                Playlist.id.should.not.eql(startId);
                Playlist.size().should.be.above(startLength);
                done();
            })
            $('#search-tab').click();
            $('#search-results tr:first-child .search-add-result').click();
        });
    };
    describe('Opening Muxamp', function() {
        it('should have the GUI elements for track search', function() {
            $('#search-query').size().should.eql(1);
            $('#search-submit').size().should.eql(1);
            $('#site-selector').size().should.eql(1);
            $('#search-site-dropdown').find('li').size().should.eql(3);
        });
        it('should load SoundCloud', function(done) {
            soundManager.should.not.be.null;
            soundManager.onready(function() {
                assert.ok(true, "SoundManager 2 loaded.");
                done();
            });
        });
        it('should initialize the playlist', function() {
            Playlist.should.not.be.null;
        });
        it('should initialize the router', function() {
            Router.should.not.be.null;
        });
    });

    describe('Search', function() {
        it('should not have results on page open', function() {
            SearchResults.size().should.eql(0);
        });
        it('should be able to search YouTube', function(done) {
            SearchResults.search('lady gaga', 'ytv').then(function(results) {
                testSearchResults(results);
                done();
            });
        });
        it('should be able to search YouTube multiple times for the same search term', function(done) {
            SearchResults.search('lady gaga', 'ytv').then(function(results) {
                testSearchResults(results);
                done();
            });
        })
        it('should be able to search SoundCloud', function(done) {
            SearchResults.search('deadmau5', 'sct').then(function(results) {
                testSearchResults(results);
                done();
            });
        });
        it('should be able to search SoundCloud multiple times for the same search term', function(done) {
            SearchResults.search('deadmau5', 'sct').then(function(results) {
                testSearchResults(results);
                done();
            });
        })
        it('should be able to get a second page of search results', function(done) {
            SearchResults.nextPage().then(function(results) {
                testSearchResults(results);
                done();
            });
        });
        it('should be able to retrieve SoundCloud media based on a URL', function(done) {
            SearchResults.search('https://soundcloud.com/fuckmylife/arm1n_3', 'url').then(function(results) {
                testSearchResults(results);
                done();
            });
        });
    });
    describe('Adding tracks to the playlist', function() {
        it('should function for YouTube tracks', function(done) {
            Playlist.once('id', function() {
                playlists.push(Playlist.id);
            });
            testPlaylistAdding(Playlist, SearchResults, done);
            SearchResults.search('mgmt', 'ytv');
        });
        it('should function for SoundCloud tracks', function(done) {
            Playlist.once('id', function() {
                playlists.push(Playlist.id);
            });
            testPlaylistAdding(Playlist, SearchResults, done);
            SearchResults.search('bag raiders', 'sct');
        });
        describe('through the GUI', function() {
            it('should function for YouTube tracks', function(done) {
                Playlist.once('id', function() {
                    playlists.push(Playlist.id);
                });
                testGUIPlaylistAdding(Playlist, SearchResults, done);
                $('#search-query').val('flaming lips');
                $('#site-selector').click();
                $('#site-selector').click().parent().find('ul li:first-child').find('a').click();
                $('#search-submit').click();
            });
            it('should be able to add the same YouTube track twice', function(done) {
                Playlist.once('id', function() {
                    playlists.push(Playlist.id);
                });
                testGUIPlaylistAdding(Playlist, SearchResults, done);
                $('#search-submit').click();
            });
            it('should function for SoundCloud tracks', function(done) {
                Playlist.once('id', function() {
                    playlists.push(Playlist.id);
                });
                testGUIPlaylistAdding(Playlist, SearchResults, done);
                $('#search-query').val('flaming lips');
                $('#site-selector').click().parent().find('ul li:nth-child(2)').find('a').click();
                $('#search-submit').click();
            });
            it('should be able to add the same SoundCloud track twice', function(done) {
                Playlist.once('id', function() {
                    playlists.push(Playlist.id);
                    console.log(playlists);
                });
                testGUIPlaylistAdding(Playlist, SearchResults, done);
                $('#search-submit').click();
            });
        });
    });

    describe('Routing', function() {
        var checkFetch = function(id, data) {
            data.should.be.an('object');
            data.id.should.eql(id);
            data.tracks.should.be.an('array');
            data.tracks.length.should.be.above(0);
        };
        var asyncFetchVerifier = function(id, done) {
            return function(data) {
                checkFetch(id, data);
                done();
            };
        };
        it('should be able to reset the current playlist environment', function(done) {
            Playlist.once('id', function(data) {
                window.location.href.should.match(/(\/|\/#)$/);
                Playlist.size().should.eql(0);
                (!!data.id).should.be.false;
                done();
            })
            Router.reset();
        });
        it('should be able to fetch a playlist', function(done) {
            Router.load(playlists[0]).then(asyncFetchVerifier(playlists[0], done));
        });
        it('should be able to fetch playlists in sequence', function(done) {
            Router.load(playlists[1]).then(function(data) {
                checkFetch(playlists[1], data);
            }).then(function() {
                return Router.load(playlists[2]);
            }).then(asyncFetchVerifier(playlists[2], done));
        });
    });

    describe('Playlist', function() {
        it('should have content for this set of tests', function() {
            Playlist.size().should.be.above(0);
        });
        describe('YouTube capabilities', function() {
            it('should be able to play a video', function(done) {
                Playlist.once('play', function() {
                    Playlist.currentMedia.should.not.be.null;
                    Playlist.currentMedia.get('siteCode').should.eql('ytv');
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.false;
                    done();
                });
                Playlist.play();
            });
            it('should be able to pause a video', function(done) {
                Playlist.once('pause', function() {
                    Playlist.currentMedia.should.not.be.null;
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.true;
                    done();
                });
                Playlist.togglePause();
            });
        });
        describe('SoundCloud capabilities', function() {
            it('should be able to play a track', function(done) {
                Playlist.nextTrack(false);
                Playlist.isPlaying().should.be.false;
                Playlist.currentMedia.get('siteCode').should.eql('sct');
                Playlist.once('play', function() {
                    Playlist.currentMedia.should.not.be.null;
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.false;
                    done();
                });
                Playlist.play();
            });
            it('should be able to pause a track', function(done) {
                Playlist.once('pause', function() {
                    Playlist.currentMedia.should.not.be.null;
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.true;
                    //$('#controls .icon-pause').size().should.eql(1);
                    done();
                });
                Playlist.togglePause();
            });
        });
        describe('navigation', function() {
            it('should be able to go forward in the track list', function() {
                var firstTrack = Playlist.currentMedia;
                Playlist.nextTrack();
                firstTrack.should.not.eql(Playlist.currentMedia);
            });
            it('should be able to go backward in the track list', function() {
                var firstTrack = Playlist.currentMedia;
                Playlist.previousTrack();
                firstTrack.should.not.eql(Playlist.currentMedia);
            });
            it('should be able to go to an arbitrary track', function() {
                var index = Playlist.currentTrack;
                var goTo = (Playlist.size() - 1) % Playlist.size();
                var firstTrack = Playlist.currentMedia;
                Playlist.goToTrack(goTo);
                firstTrack.should.not.eql(Playlist.currentMedia);
            });
        });
        describe('volume controls', function() {
            var testMute = function(done) {
                Playlist.once('mute', function() {
                    Playlist.isMuted().should.be.true;
                    Playlist.getVolume().should.eql(0);
                    Playlist.once('unmute', function() {
                        Playlist.isMuted().should.be.false;
                        Playlist.getVolume().should.eql(50);
                        done();
                    });
                    Playlist.toggleMute();
                });
                Playlist.getVolume().should.eql(50);
                Playlist.isMuted().should.be.false;
                Playlist.toggleMute();
            };
            before(function(done) {
                Router.load(playlists[playlists.length - 1]).then(function () {
                    Playlist.once('track', function() {
                        done();
                    })
                    Playlist.goToTrack(0);
                })
            });
            beforeEach(function(done) {
                Playlist.once('play', function() {
                    Playlist.once('volume', function() {
                        done();
                    });
                    Playlist.setVolume(50);
                });
                Playlist.play();
            });
            it('should change the volume of a YouTube track', function(done) {
                Playlist.once('volume', function() {
                    Playlist.getVolume().should.eql(100);
                    done();
                });
                Playlist.getVolume().should.eql(50);
                Playlist.setVolume(100);
            });
            it('should be able to mute and unmute a YouTube track', function(done) {
                testMute(done);
            });
            it('should change the volume of a SoundCloud track', function(done) {
                Playlist.nextTrack(true);
                Playlist.once('volume', function() {
                    Playlist.getVolume().should.eql(100);
                    done();
                });
                Playlist.getVolume().should.eql(50);
                Playlist.setVolume(100);
            });
            it('should be able to mute and unmute a SoundCloud track', function(done) {
                Playlist.once('track', function() {
                    testMute(done);
                });
                Playlist.nextTrack(true);
            });
            afterEach(function() {
                Playlist.stop();
            });     
        });
    });
})();