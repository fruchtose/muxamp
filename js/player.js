var MediaObject = new JS.Class({
    initialize: function(siteName, url, permalink, id, siteMediaID, siteCode, icon, artist, mediaName, type) {
        this.id = id.toString() != "" ? id.toString() : "";
        this.siteMediaID = siteMediaID != "" ? siteMediaID.toString() : "";
        this.siteCode = siteCode != "" ? siteCode.toString() : "";
        this.icon = icon != "" ? icon.toString() : "";
        this.permalink = permalink != "" ? permalink : "";
        this.url = url;
        this.artist = artist != "" ? artist : "";
        this.siteName = siteName != "" ? siteName : "";
        this.mediaName = mediaName != "" ? mediaName : "";
        this.type = type != "" ? type : "";
    }
});

var SoundObject = new JS.Class(MediaObject, {
    initialize: function(siteName, url, permalink, id, siteMediaID, siteCode, soundManager, artist, soundName, duration) {
        this.soundManager = (soundManager != undefined && soundManager != null) ? soundManager : null;
        this.duration = duration;
        this.sound = soundManager.createSound({
            id: id,
            url: url
        });
        if (this.sound == false) {
            alert("Unable to play sound.");
        }
        this.callSuper(siteName, url, permalink, id, siteMediaID, siteCode, "img/soundcloud_orange_white_16.png", artist, soundName, "audio");
    },
    
    destruct: function() {
        return this.sound.destruct();
    },
    
    getDuration: function() {
        return this.duration;
    },
    
    isMuted: function() {
        return this.sound.muted;
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
    },
    
    toggleMute: function() {
        return this.sound.toggleMute();
    }
});

var SoundCloudObject = new JS.Class(SoundObject, {
    initialize: function(id, url, consumerKey, track, soundManager) {
        var apiURL = url;
        (apiURL.toString().indexOf("secret_token") == -1) ? apiURL = apiURL + '?' : apiURL = apiURL + '&';
        apiURL = apiURL + 'consumer_key=' + consumerKey;
        this.callSuper("SoundCloud", apiURL, track.permalink_url, id, track.id, 'sct',soundManager, track.user.username, track.title, track.duration / 1000);
    }
});

var VideoObject = new JS.Class(MediaObject, {
    initialize: function(siteName, url, permalink, id, siteMediaID, siteCode, icon, artist, videoName, duration) {
        this.callSuper(siteName, url, permalink, id, siteMediaID, siteCode, icon, artist, videoName, "video");
        this.duration = duration;
    }
});

var YouTubeObject = new JS.Class(VideoObject, {
    initialize: function(id, youtubeID, uploader, title, duration) {
        var permalink = 'http://www.youtube.com/watch?v=' + youtubeID;
        this.callSuper("YouTube", permalink, permalink, id, youtubeID, 'ytv', "img/youtube.png", uploader, title, duration);
        this.video = $("#video");
    },
   
    destruct: function() {
        if (this.video.width()) {
            var videoID = this.video.tubeplayer('videoId');
            if (videoID == this.siteMediaID) {
                clearVideo();
            }
        }
    },
   
    getDuration: function() {
        return this.duration;
    },
    
    isMuted: function() {
        var muted = false;
        try {
            muted = this.video.tubeplayer('isMuted');
        }
        catch(e) {
            
        }
        return muted;
    },
   
    isPaused: function() {
        var paused = false;
        try {
            paused = this.video.tubeplayer('isPaused');
        }
        catch(e) {
        }
        return paused;
    },
   
    isPlaying: function() {
        var playing;
        try {
            playing = this.video.tubeplayer('isPlaying');
        }
        catch(e) {
            playing = false;
        }
        return playing;
    },
   
    play: function(options) {
        var video = this;
        $(document).ready(function() {
            if (options) {
                video.video.tubeplayer(options);
            }
            else {
                video.video.tubeplayer();
            }
        });
    },
    
    seek: function(decimalPercent) {
        var duration = this.duration;
        try {
            // Use floor function in case rounding would otherwise result in 
            // a value of 101% of the total time
            this.video.tubeplayer('seek', Math.floor(decimalPercent * duration));
        }
        catch(e) {
        // Eh, don't try anything if seeking isn't possible'
        }
    },
   
    stop: function() {
        var track = this;
        track.video.tubeplayer('stop');
        /*$(document).ready(function() {
            track.video.tubeplayer('pause');
            track.video.tubeplayer('seek', 0);
        });*/
    },
   
    togglePause: function() {
        var track = this;
        $(document).ready(function() {
            if (track.isPlaying()) {
                track.video.tubeplayer('pause');
            }
            else if (track.isPaused()) {
                track.video.tubeplayer('play');
            }
        });
    },
    
    toggleMute: function() {
        var track = this;
        $(document).ready(function() {
            if (track.isMuted()) {
                track.video.tubeplayer('unmute');
            }
            else {
                track.video.tubeplayer('mute');
            }
        });
        if (this.isMuted()) {
        }
    }
});