var Track;

(function(){
    var counter = (function() {
        var val = 1;
        return function() {
            return val++;
        };
    })();

    Track = Backbone.Model.extend({
        defaults: {
            id: "",
            siteMediaID: "",
            siteCode: "",
            icon: "",
            permalink: "",
            url: "",
            uploader: "",
            siteName: "",
            mediaName: "",
            type: ""
        }
    }, {
        getMediaObject: function(mediaData) {
            var mediaObject = null;
            if (mediaData) {
                var id = counter();
                switch (mediaData.siteCode) {
                    case 'sct':
                        mediaObject = new SoundCloudTrack({
                            id: id,
                            siteMediaID: mediaData.siteMediaID,
                            url: mediaData.url,
                            permalink: mediaData.permalink,
                            uploader: mediaData.author,
                            mediaName: mediaData.mediaName,
                            duration: mediaData.duration,
                            soundManager: soundManager
                        });
                        break;
                    case 'ytv':
                        mediaObject = new YouTubeTrack({
                            id: id,
                            siteMediaID: mediaData.siteMediaID,
                            uploader: mediaData.author,
                            mediaName: mediaData.mediaName,
                            duration: mediaData.duration,
                        });
                        break;
                }
            }
            return mediaObject;
        }
    });
})();

var SoundTrack = Track.extend({
	defaults: _.extend({}, Track.prototype.defaults, {
		soundManager: null,
		duration: 0.0,
		sound: null,
		type: "audio"
	}),
	initialize: function() {
		var audio = null, sm = (soundManager != undefined && soundManager != null) 
			? soundManager 
			: null;
		if (sm) {
			audio = sm.createSound({
				id: this.get("id"),
				url: this.get("url")
			});
		}
		this.set({
			soundManager: sm,
			sound: audio
		});
	},
	destruct: function() {
        return this.get("sound").destruct();
    },
    getDuration: function() {
        return this.get("duration");
    },
    isMuted: function() {
        return this.get("sound").muted;
    },
    isPaused: function() {
        return this.get("sound").paused;  
    },
    isPlaying: function() {
        return this.get("sound").playState === 1;
    },
    
    isStopped: function() {
        return this.get("sound").playState === 0;
    },
    
    play: function(options) {
        return this.get('soundManager').play(this.id, options);
    },
    
    seek: function(decimalPercent) {
        return this.get("sound").setPosition(Math.floor(decimalPercent * this.get("sound").duration));
    },
    
    setMute: function(mute) {
        if (mute) {
            this.get("sound").mute();
        }
        else {
            this.get("sound").unmute();
        }
    },
    
    setVolume: function(intPercent) {
        this.setMute(intPercent == 0);
        this.get("sound").setVolume(intPercent);
    },
    
    stop: function() {
        return this.get("sound").stop();
    },
    
    togglePause: function() {
        return this.get("sound").togglePause();
    },
    
    toggleMute: function() {
        return this.get("sound").toggleMute();
    }
});

var SoundCloudTrack = SoundTrack.extend({
	defaults: _.extend({}, SoundTrack.prototype.defaults, {
		site: "SoundCloud",
		siteCode: "sct",
		icon: "img/soundcloud_orange_white_16.png"
	})
});

var VideoTrack = Track.extend({
	defaults: _.extend({}, Track.prototype.defaults, {
		type: "video"
	})
});

var YouTubeTrack = VideoTrack.extend({
	defaults: _.extend({}, VideoTrack.prototype.defaults, {
		siteName: "YouTube",
		siteCode: "ytv",
		icon: "img/youtube.png",
	}),
	initialize: function() {
		var id = this.get('siteMediaID');
		var permalink = 'http://www.youtube.com/watch?v=' + id;
		this.set({
			url: permalink,
			permalink: permalink,
			playState: 0,
			interval: 0
		})
	},
	destruct: function() {
        if ($("#video").width()) {
            var videoID = $("#video").tubeplayer('videoId');
            if (videoID == this.get('siteMediaID')) {
                clearVideo();
            }
        }
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
        if (this.get('playState')) {
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
        if (this.get('playState')) {
            try {
                playing = $("#video").tubeplayer('isPlaying');
            }
            catch(e) {
            }
        }
        return playing;
    },
    isStopped: function() {
        return this.get('playState') === 0 || ! this.isPlaying();
    },
    play: function(options) {
        var video = this;
        if ( $("#video").tubeplayer('isPaused')) {
            $("#video").tubeplayer('play');
            video.set('playState', 1);
        }
        else {
            $(document).ready(function() {
                if (options) {
                    $("#video").tubeplayer(options);
                }
                else {
                    $("#video").tubeplayer();
                }
                video.set('playState', 1);
            });
        }
    },
    seek: function(decimalPercent) {
        var duration = this.get('duration');
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
            video.set('playState', 0);
        });
    },
    togglePause: function() {
        var video = this;
        $(document).ready(function() {
            if (video.isPlaying()) {
                $("#video").tubeplayer('pause');
            }
            else if (video.isPaused()) {
                $("#video").tubeplayer('play');
            }
        });
    },
    toggleMute: function() {
        var video = this;
        $(document).ready(function() {
            if (video.isMuted()) {
                $("#video").tubeplayer('unmute');
            }
            else {
                $("#video").tubeplayer('mute');
            }
        });
    }
});