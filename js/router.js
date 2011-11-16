function Router (playlist, soundManager, soundcloudConsumerKey) {
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.playlist = playlist != null ? playlist : new Playlist();
    
    this.addTracks = function(url) {
        if (jQuery.trim(url.toString()).match(/https?:\/\/(www\.)?soundcloud\.com\/[0-9A-Za-z][0-9A-Za-z_-]*\/(sets\/)?[0-9A-Za-z][0-9A-Za-z_-]*/))
        {
            this.getSoundCloudTracks(url);
        }
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
                    var track = new SoundCloudObject(data.stream_url, consumerKey, data, soundManager);
                    playlist.addTrack(track);
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
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4");