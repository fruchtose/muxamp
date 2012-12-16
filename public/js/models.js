var Track = Backbone.Model.extend({
    defaults: {
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
            switch (mediaData.siteCode) {
                case 'sct':
                    mediaObject = new SoundCloudTrack({
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
				id: this.get("siteMediaID"),
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
    end: function() {
        return this.get("sound").stop();
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
        return this.get('soundManager').play(this.get("siteMediaID"), options);
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
        var sound = this.get("sound");
        return sound.togglePause();
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
		})
	},
	destruct: function() {
        YouTube.reset();
    },
    end: function() {
        YouTube.reset();
    },
    isMuted: function() {
        return YouTube.isMuted();
    },
    isPaused: function() {
        return YouTube.state == 2;
    },
    isPlaying: function() {
        return YouTube.onload.state() == 'resolved' || YouTube.hasPlayer();
    },
    isStopped: function() {
        return this.get('playState') === 0 || ! this.isPlaying();
    },
    play: function(options) {
        if (this.isPaused()) {
            YouTube.play();
        } else {
            YouTube.reset();
            YouTube.load(_.extend({autoPlay: true}, options, {initialVideo: this.get('siteMediaID')}));
        }
    },
    seek: function(decimalPercent) {
        var duration = this.get('duration');
        YouTube.seek(Math.floor(decimalPercent * duration));
    },
    setMute: function(mute) {
        if (mute) {
            YouTube.mute();
        }
        else {
            YouTube.unmute();
        }
    },
    setVolume: function(percent) {
        var muted = this.isMuted();
        YouTube.setVolume(percent);
        if (percent == 0 && !muted) {
            this.setMute(true);
        } else if (percent > 0 && muted) {
            this.setMute(false);
        }
    },
    stop: function() {
        YouTube.pause();
        YouTube.seek(0);
    },
    togglePause: function() {
        var state = YouTube.state;
        var playing = state == 1 || state == 3;
        if (playing) {
            YouTube.pause();
        } else {
            YouTube.play();
        }
    },
    toggleMute: function() {
        var muted = YouTube.isMuted();
        if (muted) {
            YouTube.unmute();
        } else {
            YouTube.mute();
        }
    }
});