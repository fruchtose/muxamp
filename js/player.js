var MediaObject = new JS.Class({
    initialize: function(siteName, url, permalink, id, artist, mediaName, type) {
        this.id = id.toString() != "" ? id.toString() : "";
        this.permalink = permalink != "" ? permalink : "";
        this.url = url;
        this.artist = artist != "" ? artist : "";
        this.siteName = siteName != "" ? siteName : "";
        this.mediaName = mediaName != "" ? mediaName : "";
        this.type = type != "" ? type : "";
    }
});

var SoundObject = new JS.Class(MediaObject, {
    initialize: function(siteName, url, permalink, id, soundManager, artist, soundName, duration) {
        this.soundManager = (soundManager != undefined && soundManager != null) ? soundManager : null;
        this.duration = duration;
        this.sound = soundManager.createSound({
            id: id,
            url: url
        });
        this.callSuper(siteName, url, permalink, id, artist, soundName, "audio");
    },
    
    destruct: function() {
        return this.sound.destruct();
    },
    
    getDuration: function() {
        return this.duration;
    },
    
    isPaused: function() {
        return this.sound.paused;  
    },
    
    isPlaying: function() {
        return this.sound.playState == 1;
    },
    
    play: function(options) {
        return this.soundManager.play(this.id, options);
    },
    
    seek: function(decimalPercent) {
        return this.sound.setPosition(Math.floor(decimalPercent * this.sound.duration));
    },
    
    stop: function() {
        return this.sound.stop();
    },
    
    togglePause: function() {
        return this.sound.togglePause();
    }
});

var SoundCloudObject = new JS.Class(SoundObject, {
    initialize: function(id, url, consumerKey, track, soundManager) {
        var apiURL = url;
        (apiURL.toString().indexOf("secret_token") == -1) ? apiURL = apiURL + '?' : apiURL = apiURL + '&';
        apiURL = apiURL + 'consumer_key=' + consumerKey;
        this.callSuper("SoundCloud", apiURL, track.permalink_url, id, soundManager, track.user.username, track.title, track.duration / 1000);
    }
});

var BandcampObject = new JS.Class(SoundObject, {
    initialize: function(id, linkURL, consumerKey, track, artistName, soundManager) {
        var apiURL = track.streaming_url;
        apiURL = apiURL + '&api_key=' + consumerKey;
        this.callSuper("Bandcamp", apiURL, linkURL, id, soundManager, artistName, track.title, track.duration);
    }
});

var VideoObject = new JS.Class(MediaObject, {
    initialize: function(siteName, url, permalink, id, artist, videoName, duration) {
        this.callSuper(siteName, url, permalink, id, artist, videoName, "video");
        this.duration = duration;
    }
});

var YouTubeObject = new JS.Class(VideoObject, {
    initialize: function(id, youtubeID, uploader, title, duration) {
        var permalink = 'http://www.youtube.com/watch?v=' + youtubeID;
        this.callSuper("YouTube", permalink, permalink, id, uploader, title, duration);
        this.youtubeID = youtubeID;
    },
   
    destruct: function() {
        if ($('#right-side').width() > 10) {
            body.close('east');
            $('#video').tubeplayer('destruct');
            $("#video").replaceWith('<div id="video"></id>');
        }
    },
   
    getDuration: function() {
        return this.duration;
    },
   
    isPaused: function() {
        var paused;
        try {
            paused = $('#video').tubeplayer('isPaused');
        }
        catch(e) {
            paused = false;
        }
        return paused;
    },
   
    isPlaying: function() {
        var playing;
        try {
            playing = $('#video').tubeplayer('isPlaying');
        }
        catch(e) {
            playing = false;
        }
        return playing;
    },
   
    play: function(options) {
        if ($('.flashContainer').length == 0) {
            body.open('east');
        }
        $(document).ready(function() {
            if (options) {
                $("#video").tubeplayer(options);
            }
            else {
                $("#video").tubeplayer();
            }
        });
    },
    
    seek: function(decimalPercent) {
        var duration = this.duration;
        try {
            // Use floor function in case rounding would otherwise result in 
            // a value of 101% of the total time
            $("#video").tubeplayer('seek', Math.floor(decimalPercent * duration));
        }
        catch(e) {
            // Eh, don't try anything if seeking isn't possible'
        }
    },
   
    stop: function() {
        $(document).ready(function() {
            $('#video').tubeplayer('stop');
        });
    },
   
    togglePause: function() {
        var track = this;
        $(document).ready(function() {
            if (track.isPlaying()) {
                $('#video').tubeplayer('pause');
            }
            else if (track.isPaused()) {
                $('#video').tubeplayer('play');
            }
        });
    }
});