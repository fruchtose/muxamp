function Router (playlist, soundManager, soundcloudConsumerKey, bandcampConsumerKey, youtubeKey) {
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.bandcampConsumerKey = bandcampConsumerKey != "" ? bandcampConsumerKey : "";
    this.playlistObject = playlist != null ? playlist : new Playlist();
    this.youtubeKey = youtubeKey != null ? youtubeKey : "";
    
    this.addTracks = function(url) {
        url = jQuery.trim(url.toString());
        var router = this;
        
        var failure = function() {
            alert("Unable to add track from specified URL " + url);
        };
        var bandcampOrFailure = function() {
            router.resolveBandcampTracks(url, failure);
        };
        
        this.verifyURL(url, function(success) {
            if (success) {
                // First, try to get SoundCloud tracks;
                // all SoundCloud URLs are guaranteed to have soundcloud.com in the URL, so 
                // we only resolve a SoundCloud link if the address is present.
                // If that fails, go to Bandcamp.
                if (url.indexOf("soundcloud.com/") >= 0)
                {
                    router.resolveSoundCloud(url, bandcampOrFailure);
                }
                else if (/youtube\.com\/watch\\?/.test(url) && /v=[\w\-]+/.test(url)) {
                    router.resolveYouTube(url, failure);
                }
                else {
                    bandcampOrFailure();
                }
            }
        });
    };
    
    this.allocateNewTracks = function(count) {
        this.playlistObject.allocateNewIDs(count);
    };
    
    this.getNewTrackID = function() {
        return this.playlistObject.getNewTrackID();
    };
    
    this.processBandcampAlbum = function(albumID, mediaHandler, params, queue, failure) {
        var consumerKey = this.bandcampConsumerKey;
        var router = this;
        var albumRequest = 'http://api.bandcamp.com/api/album/2/info?key=' + consumerKey + '&album_id=' + albumID + '&callback=?';
        var options = {
            url: albumRequest,
            error: function() {
                if (failure)
                    failure();
            },
            dataType: 'jsonp',
            timeout: 10000,
            success: function(albumdata) {
                if (!albumdata.error && albumdata.tracks) {
                    var artist = albumdata.artist ? albumdata.artist : undefined;
                    var bandID = albumdata.band_id;
                    router.processBandcampArtist(bandID, queue, function(name, url) {
                        if (!artist) {
                            artist = name;
                        }
                        router.allocateNewTracks(albumdata.tracks.length);
                        $.each(albumdata.tracks, function (index, track) {
                            var id = router.getNewTrackID();
                            var linkURL = url + track.url;
                            var trackObject = new BandcampObject(id, linkURL, consumerKey, track, artist, soundManager);
                            mediaHandler && mediaHandler.apply(this, [trackObject].concat(params));
                        });
                    }, failure);
                }
                else if (failure)
                    failure();
            }
        };
        if (queue) {
            queue.add(options);
        }
        else {
            $.ajax(options);
        }
    };
    
    this.processBandcampArtist = function(id, queue, callback, failure ) {
        var consumerKey = this.bandcampConsumerKey;
        var bandNameRequest = 'http://api.bandcamp.com/api/band/3/info?key=' + consumerKey + '&band_id=' + id + '&callback=?';
        var options = {
            url: bandNameRequest,
            dataType: 'jsonp',
            timeout: 10000,
            error: function() {
                if (failure)
                    failure();
            },
            success: function(namedata) {
                if (!namedata.error){
                    var name = namedata.name;
                    var url = namedata.url;
                    callback(name, url);
                }
                else failure();
            }
        };
        if (queue) {
            queue.add(options);
        }
        else {
            $.ajax(options);
        }
    };
    
    this.processBandcampTrack = function(trackID, mediaHandler, params, queue, failure) {
        var consumerKey = this.bandcampConsumerKey;
        var router = this;
        var trackRequest = 'http://api.bandcamp.com/api/track/1/info?key=' + consumerKey + '&track_id=' + trackID + '&callback=?';
        var options = {
            url: trackRequest,
            error: function() {
                if (failure)
                    failure();
            },
            dataType: 'jsonp',
            timeout: 10000,
            success: function(trackdata) {
                if (!trackdata.error) {
                    var bandID = trackdata.band_id;
                    var artist = trackdata.artist ? trackdata.artist : undefined;
                    router.processBandcampArtist(bandID, queue, function(name, url) {
                        if (!artist) {
                            artist = name;
                        }
                        var linkURL = url + trackdata.url;
                        router.allocateNewTracks(1);
                        var id = router.getNewTrackID();
                        var trackObject = new BandcampObject(id, linkURL, consumerKey, trackdata, artist, soundManager);
                        mediaHandler && mediaHandler.apply(this, [trackObject].concat(params));
                    }, failure);
                        
                }
                else if (failure)
                    failure();
            }
        };
        if (queue) {
            queue.add(options);
        }
        else {
            $.ajax(options);
        }
    };
    
    this.processSoundCloudPlaylist = function(playlistID, mediaHandler, params, queue, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var addPlaylistData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.tracks && data.tracks.length > 0) {
                    $.each(data.tracks, function(index, track) {
                        router.processSoundCloudTrack(track, mediaHandler, params, queue, failure);
                    });
                }
                else if (failure)
                    failure();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof playlistID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/playlists/' + playlistID + ".json?consumer_key=" + consumerKey + '&callback=?';
            var options = {
                url: resolveURL,
                error: function() {
                    failure();
                },
                dataType: 'jsonp',
                success: function(data, textStatus) {
                    if (textStatus == "success") {
                        addPlaylistData(data);
                    }
                    else if (failure)
                        failure();
                },
                timeout: 10000
            };
            if (queue) {
                queue.add(options);
            }
            else {
                $.ajax(options);
            }
        }
        // If a data object is provided, the track data is fetched from it
        else addPlaylistData(playlistID);
    }
    
    this.processSoundCloudTrack = function(trackID, mediaHandler, params, queue, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var success = false;
        var addTrackData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.stream_url) {
                    router.allocateNewTracks(1);
                    var id = router.getNewTrackID();
                    var trackObject = new SoundCloudObject(id, data.stream_url, consumerKey, data, soundManager);
                    mediaHandler && mediaHandler.apply(this, [trackObject].concat(params));
                    success = true;
                }
                else if (failure)
                    failure();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof trackID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/tracks/' + trackID + ".json?consumer_key=" + consumerKey + '&callback=?';
            var options = {
                url: resolveURL,
                dataType: 'jsonp',
                error: function() {
                    failure();
                },
                success: function(data, textStatus) {
                    if (textStatus == "success") {
                        addTrackData(data);
                    }
                    else if (failure)
                        failure();
                    console.log("finished inside soundcloud " + new Date().toString());
                },
                timeout: 10000
            };
            if (queue) {
                queue.add(options);
            }
            else {
                $.ajax(options);
            }
        }
        // If a data object is provided, the track data is fetched from it
        else addTrackData(trackID);
        return success;
    };
    
    this.processYouTubeVideoID = function(youtubeID, mediaHandler, params, queue, failure) {
        var router = this;
        var youtubeAPI = 'https://gdata.youtube.com/feeds/api/videos/' + youtubeID + '?v=2&alt=json';
        var success = false;
        var options = {
            url: youtubeAPI,
            dataType: 'jsonp',
            timeout: 10000,
            success: function(response) {
                var entry = response.entry;
                var authorObj = entry.author[0];
                var author = authorObj.name.$t;
                var title = entry.title.$t;
                var duration = parseInt(entry.media$group.yt$duration.seconds);
                router.allocateNewTracks(1);
                var id = router.getNewTrackID();
                var trackObject = new YouTubeObject(id, youtubeID, author, title, duration);
                mediaHandler && mediaHandler.apply(this, [trackObject].concat(params));
                success = true;
            },
            error: function() {
                if (failure)
                    failure();
            }
        };
        if (queue) {
            queue.add(options);
        }
        else {
            $.ajax(options);
        }
        return success;
    };
    
    this.resolveBandcampTracks = function(url, failure) {
        url = encodeURIComponent(url);
        var urlRequest = 'http://api.bandcamp.com/api/url/1/info?key=' + this.bandcampConsumerKey + '&url=' + url + '&callback=?';
        var router = this;
        var addTrack = function(mediaObject) {
                    router.playlistObject.addTrack(mediaObject);
                };
        $.ajax({
            url: urlRequest,
            dataType: 'jsonp',
            timeout: 10000,
            error: function() {
                if (failure)
                    failure();
            },
            success: function(data) {
                if (!data.error) {
                    var trackID = data.track_id;
                    var albumID = data.album_id;
                    if (trackID) {
                        router.processBandcampTrack(trackID, addTrack, [], false, failure);
                    }
                    else if (albumID) {
                        router.processBandcampAlbum(albumID, addTrack, [], false, failure);
                    }
                    else if (failure)
                        failure();
                }
                else if (failure)
                    failure();
            }
        });
    };
    
    this.resolveSoundCloud = function(url, failure) {
        var router = this;
        var resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey + '&callback=?';
        $.ajax({
            url: resolveURL,
            error: function(){
                if (failure)
                    failure();
            },
            timeout: 10000,
            dataType: 'jsonp',
            success: function(data, textStatus) {
                var addTrack = function(mediaObject) {
                    router.playlistObject.addTrack(mediaObject);
                };
                if (textStatus == "success") {
                    if (data.streamable === true) {
                        //Tracks have stream URL
                        if (data.stream_url) {
                            router.processSoundCloudTrack(data, addTrack, [], false, failure);
                        }
                        else router.processSoundCloudPlaylist(data, addTrack, [], false, failure);
                    }
                }
                else if (failure)
                    failure();
            }
        });
    };
    
    this.resolveYouTube = function(url, failure) {
        var beginningURL = "v=";
        var beginningURLLoc = url.indexOf(beginningURL);
        var beginningURLLength = beginningURL.length;
        var idSubstring = url.substring(beginningURLLoc + beginningURLLength);
        var match = idSubstring.match(/[\w\-]+/);
        var canBeSearched = false;
        var addTrack = function(mediaObject) {
                    router.playlistObject.addTrack(mediaObject);
                };
        if (match) {
            canBeSearched = true;
            var youtubeID = match[0];
            this.processYouTubeVideoID(youtubeID, addTrack, [], false, failure);
        }
        else if (failure)
            failure();
        return canBeSearched;
    }
    
    this.verifyURL = function(url, callback) {
        callback(/^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url));
    };
}
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4", "apthroskulagakvaeniighentr", "AI39si5BFyt8MJ8G-sU6ZtLTT8EESCsLT6NS3K8VrA1naS1mIKy5qfsAl6lQ208tIwJQWXuDUebBRee2QNo3CAjQx58KmkxaKw");