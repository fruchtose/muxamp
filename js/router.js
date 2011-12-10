function Router (playlist, soundManager, soundcloudConsumerKey, bandcampConsumerKey, youtubeKey) {
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.bandcampConsumerKey = bandcampConsumerKey != "" ? bandcampConsumerKey : "";
    this.playlistObject = playlist != null ? playlist : new Playlist();
    this.youtubeKey = youtubeKey != null ? youtubeKey : "";
    
    this.allocateNewTracks = function(count) {
        this.playlistObject.allocateNewIDs(count);
    };
    
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
    
    this.getNewTrackID = function() {
        return this.playlistObject.getNewTrackID();
    };
    
    this.processBandcampArtist = function(id, queue, failure, callback) {
        var consumerKey = this.bandcampConsumerKey;
        var bandNameRequest = 'http://api.bandcamp.com/api/band/3/info?key=' + consumerKey + '&band_id=' + id + '&callback=?';
        var options = {
            url: bandNameRequest,
            dataType: 'jsonp',
            timeout: 10000,
            error: function() {
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
            $.ajaxq(queue, options);
        }
        else {
            $.ajax(options);
        }
    };
    
    this.processBandcampAlbum = function(albumID, queue, failure) {
        var consumerKey = this.bandcampConsumerKey;
        var router = this;
        var albumRequest = 'http://api.bandcamp.com/api/album/2/info?key=' + consumerKey + '&album_id=' + albumID + '&callback=?';
        var options = {
            url: albumRequest,
            error: function() {
                failure();
            },
            dataType: 'jsonp',
            timeout: 10000,
            success: function(albumdata) {
                if (!albumdata.error && albumdata.tracks) {
                    var artist = albumdata.artist ? albumdata.artist : undefined;
                    var bandID = albumdata.band_id;
                    router.processBandcampArtist(bandID, queue, failure, function(name, url) {
                        if (!artist) {
                            artist = name;
                        }
                        router.allocateNewTracks(albumdata.tracks.length);
                        $.each(albumdata.tracks, function (index, track) {
                            var id = router.getNewTrackID();
                            var linkURL = url + track.url;
                            var trackObject = new BandcampObject(id, linkURL, consumerKey, track, artist, soundManager);
                            router.playlistObject.addTrack(trackObject);
                        });
                    });
                }
                else failure();
            }
        };
        if (queue) {
            $.ajaxq(queue, options);
        }
        else {
            $.ajax(options);
        }
    };
    
    this.processBandcampTrack = function(trackID, queue, failure) {
        var consumerKey = this.bandcampConsumerKey;
        var router = this;
        var trackRequest = 'http://api.bandcamp.com/api/track/1/info?key=' + consumerKey + '&track_id=' + trackID + '&callback=?';
        var options = {
            url: trackRequest,
            error: function() {
                failure();
            },
            dataType: 'jsonp',
            timeout: 10000,
            success: function(trackdata) {
                if (!trackdata.error) {
                    var bandID = trackdata.band_id;
                    var artist = trackdata.artist ? trackdata.artist : undefined;
                    router.processBandcampArtist(bandID, queue, failure, function(name, url) {
                        if (!artist) {
                            artist = name;
                        }
                        var linkURL = url + trackdata.url;
                        router.allocateNewTracks(1);
                        var id = router.getNewTrackID();
                        var trackObject = new BandcampObject(id, linkURL, consumerKey, trackdata, artist, soundManager);
                        router.playlistObject.addTrack(trackObject);
                    });
                        
                }
                else failure();
            }
        };
        if (queue) {
            $.ajaxq(queue, options);
        }
        else {
            $.ajax(options);
        }
    };
    
    this.processSoundCloudPlaylist = function(input, queue, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var addPlaylistData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.tracks && data.tracks.length > 0) {
                    $.each(data.tracks, function(index, track) {
                        router.processSoundCloudTrack(track, queue, failure);
                    });
                }
                else failure();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof input == 'string') {
            var resolveURL = 'http://api.soundcloud.com/playlists/' + input + ".json?consumer_key=" + consumerKey + '&callback=?';
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
                    else failure();
                },
                timeout: 10000
            };
            if (queue) {
                $.ajaxq(queue, options);
            }
            else {
                $.ajax(options);
            }
        }
        // If a data object is provided, the track data is fetched from it
        else addPlaylistData(input);
    }
    
    this.processSoundCloudTrack = function(input, queue, failure) {
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
                    router.playlistObject.addTrack(trackObject);
                    success = true;
                }
                else failure();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof input == 'string') {
            var resolveURL = 'http://api.soundcloud.com/tracks/' + input + ".json?consumer_key=" + consumerKey + '&callback=?';
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
                    else failure();
                    console.log("finished inside soundcloud " + new Date().toString());
                },
                timeout: 10000
            };
            if (queue) {
                $.ajaxq(queue, options);
            }
            else {
                $.ajax(options);
            }
        }
        // If a data object is provided, the track data is fetched from it
        else addTrackData(input);
        return success;
    };
    
    this.processYouTubeVideoID = function(youtubeID, queue, failure) {
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
                var track = new YouTubeObject(id, youtubeID, author, title, duration);
                router.playlistObject.addTrack(track);
                success = true;
                console.log("finished inside youtube " + new Date().toString());
            },
            error: function() {
                failure();
            }
        };
        if (queue) {
            $.ajaxq(queue, options);
        }
        else {
            $.ajax(options);
        }
        return success;
    };
    
    this.resolveBandcampTracks = function(url, failure) {
        url = encodeURIComponent(url);
        var urlRequest = 'http://api.bandcamp.com/api/url/1/info?key=' + this.bandcampConsumerKey + '&url=' + url + '&callback=?';
        var consumerKey = this.bandcampConsumerKey;
        var playlist = this.playlistObject;
        var bandcampArtistURL = undefined;
        var router = this;
        $.ajax({
            url: urlRequest,
            dataType: 'jsonp',
            timeout: 10000,
            error: function() {
                failure()
            },
            success: function(data) {
                if (!data.error) {
                    var trackID = data.track_id;
                    var albumID = data.album_id;
                    if (trackID) {
                        router.processBandcampTrack(trackID, false, failure);
                    }
                    else if (albumID) {
                        router.processBandcampAlbum(albumID, false, failure);
                    }
                    else {
                        failure();
                    }
                }
                else failure();
            }
        });
    /*$.getJSON(urlRequest, function(data) {
            var artist = undefined;
            var bandId = data.band_id;
            if (data.artist != undefined) {
                //Artist name specified in JSON, so use it
                artist = data.artist;
            }
            //Let's verify the artist's ID and get their bandcamp subdomain
            var bandNameRequest = 'http://api.bandcamp.com/api/band/3/info?key=' + consumerKey + '&band_id=' + bandId + '&callback=?';
            var trackID = data.track_id;
            var albumID = data.album_id;
            // Don't attempt to get anymore info if the album isn't there
            if (bandId != undefined && (trackID != undefined || albumID != undefined))
            {
                $.getJSON(bandNameRequest, function (namedata) {
                    //Set artist name if it was specified in the JSON
                    if (namedata.name != undefined && artist == undefined) {
                        artist = namedata.name;
                    }
                    if (namedata.url != undefined) {
                        bandcampArtistURL = namedata.url;
                    }
                    if (artist != undefined && bandcampArtistURL != undefined) {
                        if (trackID != undefined) {
                            //We have found a track, so let's fetch it
                            var trackRequest = 'http://api.bandcamp.com/api/track/1/info?key=' + consumerKey + '&track_id=' + trackID + '&callback=?';
                            $.getJSON(trackRequest, function (trackdata) {
                                var linkURL = bandcampArtistURL + trackdata.url;
                                router.allocateNewTracks(1);
                                var id = router.getNewTrackID();
                                var trackObject = new BandcampObject(id, linkURL, consumerKey, trackdata, artist, soundManager);
                                playlist.addTrack(trackObject);
                            });
                        
                        }
                        else if (data.album_id != undefined) {
                            var albumRequest = 'http://api.bandcamp.com/api/album/2/info?key=' + consumerKey + '&album_id=' + albumID + '&callback=?';
                            $.getJSON(albumRequest, function (albumdata) {
                                if (albumdata.tracks != undefined) {
                                    router.allocateNewTracks(albumdata.tracks.length);
                                    $.each(albumdata.tracks, function (index, track) {
                                        var id = router.getNewTrackID();
                                        var linkURL = bandcampArtistURL + track.url;
                                        var trackObject = new BandcampObject(id, linkURL, consumerKey, track, artist, soundManager);
                                        playlist.addTrack(trackObject);
                                    });
                                } 
                            });
                        }
                        else {
                            failure();
                        }
                    }
                    else {
                        failure();
                    }
                });
            }
            else {
                failure();
            }
        });*/
    };
    
    this.resolveSoundCloud = function(url, failure) {
        var router = this;
        var consumerKey = router.soundcloudConsumerKey;
        var resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey + '&callback=?';
        $.ajax({
            url: resolveURL,
            error: function(){
                failure();
            },
            timeout: 10000,
            dataType: 'jsonp',
            success: function(data, textStatus) {
                if (textStatus == "success") {
                    if (data.streamable === true) {
                        //Tracks have stream URL
                        if (data.stream_url) {
                            router.processSoundCloudTrack(data, false, failure);
                        }
                        else router.processSoundCloudPlaylist(data, false, failure);
                    }
                }
                else failure();
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
        if (match) {
            canBeSearched = true;
            var youtubeID = match[0];
            this.processYouTubeVideoID(youtubeID, false, failure);
        }
        else failure();
        return canBeSearched;
    }
    
    this.verifyURL = function(url, callback) {
        callback(/^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url));
    };
}
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4", "apthroskulagakvaeniighentr", "AI39si5BFyt8MJ8G-sU6ZtLTT8EESCsLT6NS3K8VrA1naS1mIKy5qfsAl6lQ208tIwJQWXuDUebBRee2QNo3CAjQx58KmkxaKw");