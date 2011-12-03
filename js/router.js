function Router (playlist, soundManager, soundcloudConsumerKey, bandcampConsumerKey, youtubeKey) {
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.bandcampConsumerKey = bandcampConsumerKey != "" ? bandcampConsumerKey : "";
    this.playlist = playlist != null ? playlist : new Playlist();
    this.youtubeKey = youtubeKey != null ? youtubeKey : "";
    
    this.allocateNewTracks = function(count) {
        this.playlist.allocateNewIDs(count);
    }
    
    this.addTracks = function(url) {
        url = jQuery.trim(url.toString());
        var router = this;
        this.verifyURL(url, function(success) {
            if (success == true) {
                if (url.match(/https?:\/\/(www\.)?soundcloud\.com\/[0-9A-Za-z][0-9A-Za-z_-]*\/(sets\/)?[0-9A-Za-z][0-9A-Za-z_-]*/)) {
                    router.getSoundCloudTracks(url);
                }
                else if (url.match(/(http:\/\/)?[0-9A-Za-z][0-9A-Za-z_-]*\.bandcamp\.com\/track\/*/) || 
                    url.match(/(http:\/\/)?[0-9A-Za-z][0-9A-Za-z_-]*\.bandcamp\.com\/album\/*/)) {
                    router.getBandcampTracks(url);
                }
            }
        });
    };
    
    this.getBandcampTracks = function(url) {
        url = encodeURIComponent(url);
        var urlRequest = 'http://api.bandcamp.com/api/url/1/info?key=' + this.bandcampConsumerKey + '&url=' + url + '&callback=?';
        var consumerKey = this.bandcampConsumerKey;
        var playlist = this.playlist;
        var bandcampArtistURL = undefined;
        var router = this;
        $.getJSON(urlRequest, function(data) {
            var artist = undefined;
            if (data.artist != undefined) {
                //Artist name specified in JSON, so use it
                artist = data.artist;
            }
            //Let's verify the artist's ID and get their bandcamp subdomain
            var bandNameRequest = 'http://api.bandcamp.com/api/band/3/info?key=' + consumerKey + '&band_id=' + data.band_id + '&callback=?';
            var trackID = data.track_id;
            var albumID = data.album_id;
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
                }
            });
        });
    };
    
    this.getMP3Track = function(url) {
        var trackObject = new SoundObject("URL", url, url, url, soundManager, "Track", url);
        this.playlist.addTrack(trackObject);
    }
    
    this.getNewTrackID = function() {
        return this.playlist.getNewTrackID();
    }
    
    this.getSoundCloudTracks = function(url) {
        var resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey + '&callback=?';
        var consumerKey = this.soundcloudConsumerKey;
        var playlist = this.playlist;
        var router = this;
        $.getJSON(resolveURL, function(data) {
            //URL entered by user must be streamable
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.stream_url != undefined) {
                    router.allocateNewTracks(1);
                    var id = router.getNewTrackID();
                    var trackObject = new SoundCloudObject(id, data.stream_url, consumerKey, data, soundManager);
                    playlist.addTrack(trackObject);
                }
                else if (data.tracks != undefined && data.tracks.length > 0) {
                    router.allocateNewTracks(data.tracks.length);
                    $.each(data.tracks, function(index, track) {
                        var id = router.getNewTrackID();
                        var trackObject = new SoundCloudObject(id, track.stream_url, consumerKey, track, soundManager);
                        playlist.addTrack(trackObject);
                    });
                }
            }
        });
    };
    
    this.verifyURL = function(url, callback) {
        callback(/^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url));
    }
}
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4", "apthroskulagakvaeniighentr", "AI39si5BFyt8MJ8G-sU6ZtLTT8EESCsLT6NS3K8VrA1naS1mIKy5qfsAl6lQ208tIwJQWXuDUebBRee2QNo3CAjQx58KmkxaKw");