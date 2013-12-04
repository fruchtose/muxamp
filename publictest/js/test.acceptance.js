;(function() {
    var playlists = [];
    // Tests track data received by the client
    var testTrack = function(track) {
        track.should.be.an('object');
        track.should.not.be.empty;
        track.siteMediaID.should.not.be.empty;
        track.duration.should.be.above(0);
    };
    // Tests search results for content
    var testSearchResults = function(results) {
        results.should.be.an('array');
        results.length.should.be.above(0);
        testTrack(results[0]);
    };
    // Tests that a track model exists
    var testTrackModel = function(track) {
        track.should.be.an('object');
        track.should.not.be.empty;
        track.get('siteMediaID').should.not.be.empty;
        track.get('duration').should.be.above(0);
        track.get('permalink').should.not.be.empty;
    };
    var testPlaylistAdding = function(playlist, searchResults, done) {
        var startLength = playlist.size(), startId = playlist.id;
        var prevTracks = _.clone(playlist.models);
        searchResults.once('results:new', function(collection, options) {
            collection.each(function(model) {
                testTrackModel(model);
            });
            playlist.once('id', function() {
                Playlist.id.should.be.above(0);
                Playlist.id.should.not.eql(startId);
                Playlist.size().should.be.above(startLength);
                // Ensures that the playlist has all the previous tracks
                // before adding the new one
                _(prevTracks).each(function(track) {
                    playlist.indexOf(track).should.be.above(-1);
                });
                done();
            })
            // Adds a random track in search results
            var count = collection.size(),
                rand = parseInt(Math.random() * count);
            playlist.add(collection.at(rand).clone());
        });
    };
    // Tests the ability to add a track through the GUI
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
            // Adds the first track in the search results
            $('#search-tab').click();
            $('#search-results tr:first-child .search-add-result').click();
        });
    };
    // Tests if only the current playlist track is playing
    var backgroundTracksNotPlaying = function(playlist) {
        var current = playlist.currentMedia();
        return playlist.every(function(track) {
            if (current == track) {
                return true;
            }

            return !track.isPlaying();
        });
    };
    describe('Opening Muxamp', function() {
        it('should have the GUI elements for track search', function() {
            $('#search-query').size().should.eql(1);
            $('#search-submit').size().should.eql(1);
            $('#site-selector').size().should.eql(1);
            $('#search-site-dropdown').find('li').size().should.eql(4);
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
            SearchResults.search('https://soundcloud.com/fuckmylife/777-1', 'url').then(function(results) {
                testSearchResults(results);
                done();
            });
        });
        it('should be able to search Jamendo', function(done) {
            SearchResults.search('rock', 'jmt').then(function(results) {
                testSearchResults(results);
                done();
            });
        });
        it('should be able to retrieve Jamendo media based on a URL', function(done) {
            SearchResults.search('http://www.jamendo.com/en/track/1031200/likely-story', 'url').then(function(results) {
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
        it('should function for Jamendo tracks', function(done) {
            Playlist.once('id', function() {
                playlists.push(Playlist.id);
            });
            testPlaylistAdding(Playlist, SearchResults, done);
            SearchResults.search('guitar', 'jmt');
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
                });
                testGUIPlaylistAdding(Playlist, SearchResults, done);
                $('#search-submit').click();
            });
        });
    });

    describe('Routing', function() {
        // Ensures that fetched data has a track array and ID
        var checkFetch = function(id, data) {
            data.should.be.an('object');
            data.id.should.eql(id);
            data.tracks.should.be.an('array');
            data.tracks.length.should.be.above(0);
        };
        // Verifies fetch results asynchronously
        var asyncFetchVerifier = function(id, done) {
            return function(data) {
                checkFetch(id, data);
                (id > 0) && $('tr.playing').size().should.eql(1);
                done();
            };
        };
        it('should be able to reset the current playlist environment', function(done) {
            Playlist.once('id', function(data) {
                window.location.href.should.match(/(\/|\/#)$/);
                Playlist.size().should.eql(0);
                Playlist.currentTrack.should.eql(-1);
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
                    Playlist.currentMedia().should.not.be.null;
                    Playlist.currentMedia().get('siteCode').should.eql('ytv');
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.false;
                    done();
                });
                Playlist.play();
            });
            it('should be able to pause a video', function(done) {
                Playlist.once('pause', function() {
                    Playlist.currentMedia().should.not.be.null;
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
                Playlist.once('play', function() {
                    Playlist.currentMedia().get('siteCode').should.eql('sct');
                    Playlist.currentMedia().should.not.be.null;
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.false;
                    done();
                });
                Playlist.play();
            });
            it('should be able to pause a track', function(done) {
                Playlist.once('pause', function() {
                    Playlist.currentMedia().get('siteCode').should.eql('sct');
                    Playlist.currentMedia().should.not.be.null;
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.true;
                    //$('#controls .icon-pause').size().should.eql(1);
                    done();
                });
                Playlist.togglePause();
            });
        });
        describe('Jamendo capabilities', function() {
            it('should be able to play a track', function(done) {
                Playlist.nextTrack(false);
                Playlist.once('play', function() {
                    Playlist.currentMedia().get('siteCode').should.eql('jmt');
                    Playlist.currentMedia().should.not.be.null;
                    Playlist.isPlaying().should.be.true;
                    Playlist.isPaused().should.be.false;
                    done();
                });
                Playlist.play();
            });
            it('should be able to pause a track', function(done) {
                Playlist.once('pause', function() {
                    Playlist.currentMedia().get('siteCode').should.eql('jmt');
                    Playlist.currentMedia().should.not.be.null;
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
                var firstTrack = Playlist.currentMedia();
                Playlist.nextTrack();
                firstTrack.should.not.eql(Playlist.currentMedia());
            });
            it('should be able to go backward in the track list', function() {
                var firstTrack = Playlist.currentMedia();
                Playlist.previousTrack();
                firstTrack.should.not.eql(Playlist.currentMedia());
            });
            it('should be able to go to an arbitrary track', function() {
                var index = Playlist.currentTrack;
                var goTo = (Playlist.size() - 1) % Playlist.size();
                var firstTrack = Playlist.currentMedia();
                Playlist.goToTrack(goTo);
                if (index != goTo) {
                    firstTrack.should.not.eql(Playlist.currentMedia());
                } else {
                    firstTrack.should.eql(Playlist.currentMedia());
                }
            });
            describe('when the current track is playing', function() {
                it('should play the next track when the next track is called', function(done) {
                    Playlist.once('play', function() {
                        Playlist.once('play', function() {
                            backgroundTracksNotPlaying(Playlist).should.eql(true);
                            done();
                        })
                        Playlist.nextTrack(true);
                    });
                    Playlist.play();
                });
                it ('should be able to switch to an arbitrary track', function(done) {
                    var index = Playlist.currentTrack,
                        current = Playlist.currentMedia(),
                        next = index - 1 >= 0 ? index - 1 : index + 1;
                    Playlist.once('play', function() {
                        backgroundTracksNotPlaying(Playlist).should.eql(true);
                        if (index == next) {
                            Playlist.currentMedia().isPlaying().should.eql(true);
                            Playlist.currentMedia().should.eql(current);
                        } else {
                            Playlist.currentMedia().should.not.eql(current);
                            Playlist.currentMedia().isPlaying().should.eql(true);
                        }
                        done();
                    });
                    Playlist.goToTrack(next, true);
                });
            });
        });
        describe('Removing tracks from the playlist', function() {
            beforeEach(function(done) {
                Router.load(playlists[playlists.length - 1]).then(function () {
                    done();
                });
            });
            it('should work when a track after than the current track is removed', function(done) {
                Playlist.once('track', function() {
                    var current = Playlist.currentTrack,
                        toRemove = _.random(current + 1, Playlist.size() - 1),
                        removed = Playlist.at(toRemove);
                    Playlist.once('remove', function() {
                        should.exist(Playlist.currentMedia());
                        Playlist.currentTrack.should.eql(current);
                        Playlist.currentMedia().should.eql(Playlist.at(current));
                        Playlist.indexOf(removed).should.eql(-1);
                        done();
                    });
                    Playlist.remove(Playlist.at(toRemove));
                });
                should.exist(Playlist.currentMedia());
                Playlist.goToTrack(0);
            });
            describe('should work when the current track is removed', function(done) {
                it('at the beginning of the playlist', function(done) {
                    Playlist.once('track', function() {
                        var current = Playlist.currentTrack,
                            removed = Playlist.at(current);
                        Playlist.once('track', function() {
                            should.exist(Playlist.currentMedia());
                            Playlist.currentTrack.should.eql(current);
                            Playlist.currentMedia().should.not.eql(removed);
                            Playlist.indexOf(removed).should.eql(-1);
                            done();
                        });
                        Playlist.remove(Playlist.at(current));
                    });
                    should.exist(Playlist.currentMedia());
                    Playlist.goToTrack(0);
                });
                it('in the middle of in the playlist', function(done) {
                    var current = _.random(1, Playlist.size() - 2),
                        removed = Playlist.at(current);
                    Playlist.once('track', function() {
                        Playlist.once('track', function() {
                            should.exist(Playlist.currentMedia());
                            Playlist.currentTrack.should.eql(current);
                            Playlist.currentMedia().should.not.eql(removed);
                            Playlist.indexOf(removed).should.eql(-1);
                            done();
                        });
                        Playlist.remove(Playlist.at(current));
                    });
                    should.exist(Playlist.currentMedia());
                    Playlist.goToTrack(current);
                });
                it('at the end of the playlist', function(done) {
                    var current = Playlist.size() - 1,
                        removed = Playlist.at(current);
                    Playlist.once('track', function() {
                        Playlist.once('track', function() {
                            should.exist(Playlist.currentMedia());
                            Playlist.currentTrack.should.eql(current - 1);
                            Playlist.currentMedia().should.eql(Playlist.last());
                            Playlist.indexOf(removed).should.eql(-1);
                            done();
                        });
                        Playlist.remove(Playlist.at(current));
                    });
                    should.exist(Playlist.currentMedia());
                    Playlist.goToTrack(current);
                });
            });
            it('should work when a track before the current track is removed', function(done) {
                var last = Playlist.size() - 1
                    currentMedia = Playlist.at(last),
                    toRemove = _.random(0, last - 1),
                    removed = Playlist.at(toRemove);
                Playlist.once('track', function() {
                    Playlist.once('track', function() {
                        should.exist(Playlist.currentMedia());
                        Playlist.currentTrack.should.eql(last - 1);
                        Playlist.currentMedia().attributes.should.eql(currentMedia.attributes);
                        Playlist.indexOf(removed).should.eql(-1);
                        done();
                    });
                    Playlist.remove(Playlist.at(toRemove));
                });
                Playlist.goToTrack(last);
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
                });
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
                    Playlist.currentMedia().get('siteCode').should.eql('ytv');
                    done();
                });
                Playlist.getVolume().should.eql(50);
                Playlist.setVolume(100);
            });
            it('should be able to mute and unmute a YouTube track', function(done) {
                testMute(function() {
                    Playlist.currentMedia().get('siteCode').should.eql('ytv');
                    done();
                });
            });
            it('should change the volume of a SoundCloud track', function(done) {
                Playlist.nextTrack(true);
                Playlist.once('volume', function() {
                    Playlist.getVolume().should.eql(100);
                    Playlist.currentMedia().get('siteCode').should.eql('sct');
                    done();
                });
                Playlist.getVolume().should.eql(50);
                Playlist.setVolume(100);
            });
            it('should be able to mute and unmute a SoundCloud track', function(done) {
                Playlist.currentMedia().get('siteCode').should.eql('sct');
                testMute(done);
            });
            afterEach(function() {
                Playlist.stop();
            });     
        });
        describe('temporal navigation', function() {
            it('should allow seeking', function(done) {
                percent = Math.random();
                Playlist.play();
                Playlist.once('progress', function(state) {
                    parseInt(percent).should.eql(parseInt(state.percent));
                    Playlist.stop();
                    done();
                });
                Playlist.seek(percent);
            });
        });
        describe('shuffle', function() {
            it('should produce a playlist with a different ID (probably)', function(done) {
                var tracks = Playlist.models, originalId = Playlist.id;
                Playlist.on('id', function() {
                    if (Playlist.models != tracks) {
                        originalId.should.not.eql(Playlist.id);
                        Playlist.models.length.should.eql(tracks.length);
                    } else {
                        originalId.should.eql(Playlist.id);
                    }
                    done();
                });
                Playlist.shuffle();
            });
        });
    });
})();