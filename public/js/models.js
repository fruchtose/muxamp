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
    },
    destruct: function() {
        this.trigger('destruct', this, arguments);
    },
    end: function() {
        this.trigger('end', this, arguments);
    },
    mute: function() {
        this.trigger('mute', this, arguments);
    },
    play: function() {
        this.trigger('play', this, arguments);
    },
    play: function() {
        this.trigger('play', this, arguments);
    },
    seek: function() {
        this.trigger('seek', this, arguments);
    },
    setMute: function(mute) {
        var event = mute ? 'mute' : 'unmute';
        var args = [event, this, _.rest(arguments)];
        this.trigger.apply(this, args);
    },
    setVolume: function() {
        this.trigger('setVolume', this, arguments);
    },
    stop: function() {
        this.trigger('stop', this, arguments);
    },
    togglePause: function(playing) {
        var event = playing ? 'pause' : 'resume';
        var args = [event, this, _.rest(arguments)];
        this.trigger.apply(this, args);
    }
}, {
    getMediaObject: function(mediaData, options) {
        var mediaObject = null;
        options || (options = {});
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
                    }, options);
                    break;
                case 'ytv':
                    mediaObject = new YouTubeTrack({
                        siteMediaID: mediaData.siteMediaID,
                        uploader: mediaData.author,
                        mediaName: mediaData.mediaName,
                        duration: mediaData.duration,
                    }, options);
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
	initialize: function(options) {

        if (options.silent) {
            return;
        }

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
        this.get("sound").destruct();
        this.trigger('destruct', this, arguments);
    },
    end: function() {
        this.get("sound").stop();
        this.trigger('end', this, arguments);
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
        this.get('soundManager').play(this.get("siteMediaID"), options);
        this.trigger('play', this, arguments);
    },
    seek: function(decimalPercent) {
        this.get("sound").setPosition(Math.floor(decimalPercent * this.get("sound").duration));
        this.trigger('seek', this, arguments);
    },
    setMute: function(mute) {
        if (mute) {
            this.get("sound").mute();
        }
        else {
            this.get("sound").unmute();
        }
        this.trigger('setMute', this, arguments);
    },
    
    setVolume: function(intPercent) {
        this.setMute(intPercent == 0);
        this.get("sound").setVolume(intPercent);
        this.trigger('setVolume', this, arguments);
    },
    
    stop: function() {
        this.get("sound").stop();
        this.trigger('stop', this, arguments);
    },
    
    togglePause: function() {
        var pause = this.isPlaying();
        var sound = this.get("sound");
        sound.togglePause();
        this.trigger('togglePause', this, arguments);
    },
    
    toggleMute: function() {
        var mute = !this.isMuted();
        this.get("sound").toggleMute();
        this.trigger.apply(this, ['toggleMute', this, mute].concat(arguments));
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
		})
	},
	destruct: function() {
        var self = this;
        YouTube.reset().then(function() {
            self._stopped = true;
            self.trigger('destruct', self, arguments);
        });
    },
    end: function() {
        this.destruct();
    },
    isMuted: function() {
        return YouTube.isMuted();
    },
    isPaused: function() {
        return YouTube.state == 2;
    },
    isPlaying: function() {
        return YouTube.state === 1 || YouTube.hasPlayer();
    },
    isStopped: function() {
        return this._stopped || ! this.isPlaying();
    },
    play: function(options) {
        var self = this;
        if (this.isPaused()) {
            this.togglePause();
        } else {
            YouTube.reset();
            YouTube.load(_.extend({autoPlay: true}, options, {
                initialVideo: this.get('siteMediaID')
            })).then(function() {
                self._stopped = false;
                self.trigger.apply(self, ['play', self, options].concat(arguments));
            });
        }
    },
    seek: function(decimalPercent) {
        var duration = this.get('duration'), self = this;
        YouTube.seek(Math.floor(decimalPercent * duration)).then(function() {
            self._stopped = false;
            self.trigger.apply(self, ['seek', self, decimalPercent].concat(arguments));
        });
    },
    setMute: function(mute) {
        var self = this;
        var dfd = mute ? YouTube.mute() : YouTube.unmute();
        dfd.then(function() {
            self.trigger.apply(self, ['setMute', self, mute].concat(arguments));
        });
    },
    setVolume: function(percent) {
        var muted = this.isMuted(), dfd, self = this;
        dfd = YouTube.setVolume(percent);
        if (percent == 0 && !muted) {
            dfd = this.setMute(true);
        } else if (percent > 0 && muted) {
            dfd = this.setMute(false);
        }
        dfd.then(function() {
            self.trigger.apply(self, ['setVolume', self, percent].concat(arguments));
        });
    },
    stop: function() {
        var self = this;
        YouTube.pause();
        YouTube.seek(0).then(function() {
            self._stopped = true;
            self.trigger('stop', self, arguments);
        });
    },
    togglePause: function() {
        var self = this;
        var state = YouTube.state;
        var playing = state == 1 || state == 3;
        var dfd = playing ? YouTube.pause() : YouTube.play();
        dfd.then(function() {
            self._stopped = false;
            self.trigger.apply(self, ['togglePause', self, playing].concat(arguments));
        });
    },
    toggleMute: function() {
        var muted = this.isMuted();
        var self = this, dfd = muted ? YouTube.unmute() : YouTube.mute();
        dfd.then(function() {
            self.trigger.apply(self, ['toggleMute', self, muted].concat(arguments));
        });
    }
});