function Router (playlist, soundManager, soundcloudConsumerKey, bandcampConsumerKey) {
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.bandcampConsumerKey = bandcampConsumerKey != "" ? bandcampConsumerKey : "";
    this.playlist = playlist != null ? playlist : new Playlist();
    
    this.addTracks = function(url) {
        url = jQuery.trim(url.toString());
        if (url.match(/https?:\/\/(www\.)?soundcloud\.com\/[0-9A-Za-z][0-9A-Za-z_-]*\/(sets\/)?[0-9A-Za-z][0-9A-Za-z_-]*/)) {
            this.getSoundCloudTracks(url);
        }
        else if (url.match(/(http:\/\/)?[0-9A-Za-z][0-9A-Za-z_-]*\.bandcamp\.com\/track\/*/) || 
            url.match(/(http:\/\/)?[0-9A-Za-z][0-9A-Za-z_-]*\.bandcamp\.com\/album\/*/)) {
            this.getBandcampTracks(url);
        }
    };
    
    this.getBandcampTracks = function(url) {
        url = encodeURIComponent(url);
        var urlRequest = 'http://api.bandcamp.com/api/url/1/info?key=' + this.bandcampConsumerKey + '&url=' + url + '&callback=?';
        var consumerKey = this.bandcampConsumerKey;
        var playlist = this.playlist;
        var bandcampArtistURL = undefined;
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
                            var trackObject = new BandcampObject(linkURL, consumerKey, trackdata, artist, soundManager);
                            playlist.addTrack(trackObject);
                        });
                        
                    }
                    else if (data.album_id != undefined) {
                        var albumRequest = 'http://api.bandcamp.com/api/album/2/info?key=' + consumerKey + '&album_id=' + albumID + '&callback=?';
                        $.getJSON(albumRequest, function (albumdata) {
                           if (albumdata.tracks != undefined) {
                               $.each(albumdata.tracks, function (index, track) {
                                   var linkURL = bandcampArtistURL + track.url;
                                   var trackObject = new BandcampObject(linkURL, consumerKey, track, artist, soundManager);
                                   playlist.addTrack(trackObject);
                               });
                           } 
                        });
                    }
                }
            });
        });
    };
    
    this.getSoundCloudTracks = function(url) {
        var resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey + '&callback=?';
        var consumerKey = this.soundcloudConsumerKey;
        var playlist = this.playlist;
        $.getJSON(resolveURL, function(data) {
            //URL entered by user must be streamable
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.stream_url != undefined) {
                    var trackObject = new SoundCloudObject(data.stream_url, consumerKey, data, soundManager);
                    playlist.addTrack(trackObject);
                }
                else if (data.tracks != undefined && data.tracks.length > 0) {
                    $.each(data.tracks, function(index, track) {
                        var trackObject = new SoundCloudObject(track.stream_url, consumerKey, track, soundManager);
                        playlist.addTrack(trackObject);
                    });
                }
            }
        });
    };
}
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4", "apthroskulagakvaeniighentr");