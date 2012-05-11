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
        return this.sound.playState === 1;
    },
    
    isStopped: function() {
        return this.sound.playState === 0;
    },
    
    play: function(options) {
        return this.soundManager.play(this.id, options);
    },
    
    seek: function(decimalPercent) {
        return this.sound.setPosition(Math.floor(decimalPercent * this.sound.duration));
    },
    
    setMute: function(mute) {
        if (mute) {
            this.sound.mute();
        }
        else {
            this.sound.unmute();
        }
    },
    
    setVolume: function(intPercent) {
        this.setMute(intPercent == 0);
        this.sound.setVolume(intPercent);
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
        this.playState = 0;
    },
   
    destruct: function() {
        if ($("#video").width()) {
            var videoID = $("#video").tubeplayer('videoId');
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
            muted = $("#video").tubeplayer('isMuted');
        }
        catch(e) {
            
        }
        return muted;
    },
   
    isPaused: function() {
        var paused = false;
        if (this.playState) {
            try {
                paused = $("#video").tubeplayer('isPaused');
            }
            catch(e) {
            }
        }
        return paused;
    },
   
    isPlaying: function() {
        var playing = false;
        if (this.playState) {
            try {
                playing = $("#video").tubeplayer('isPlaying');
            }
            catch(e) {
            }
        }
        return playing;
    },
    
    isStopped: function() {
        return this.playSTate === 0 || ! this.isPlaying();
    },
   
    play: function(options) {
        var video = this;
        if ( $("#video").tubeplayer('isPaused')) {
            $("#video").tubeplayer('play');
            video.playState = 1;
        }
        else {
            $(document).ready(function() {
                if (options) {
                    $("#video").tubeplayer(options);
                }
                else {
                    $("#video").tubeplayer();
                }
                video.playState = 1;
            });
        }
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
    
    setMute: function(mute) {
        $(document).ready(function() {
            if (mute) {
                $("#video").tubeplayer('mute');
            }
            else {
                $("#video").tubeplayer('unmute');
            }
        });
    },
    
    setVolume: function(intPercent) {
        $('#video').tubeplayer('volume', intPercent);
        if (intPercent == 0) {
            this.setMute(true);
        }
    },
   
    stop: function() {
        var video = this;
        $(document).ready(function() {
            $("#video").tubeplayer('pause');
            $("#video").tubeplayer('seek', 0);
            video.playState = 0;
        });
    },
   
    togglePause: function() {
        var track = this;
        $(document).ready(function() {
            if (track.isPlaying()) {
                $("#video").tubeplayer('pause');
            }
            else if (track.isPaused()) {
                $("#video").tubeplayer('play');
            }
        });
    },
    
    toggleMute: function() {
        var track = this;
        $(document).ready(function() {
            if (track.isMuted()) {
                $("#video").tubeplayer('unmute');
            }
            else {
                $("#video").tubeplayer('mute');
            }
        });
    }
});