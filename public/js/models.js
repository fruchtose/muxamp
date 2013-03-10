var triggerEvents = function(context) {
    return context.trigger.apply(context, _.chain(arguments).flatten().rest().value() || []);
};

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
        triggerEvents(this, 'destruct', arguments);
    },
    end: function() {
        triggerEvents(this, 'end', this, arguments);
    },
    mute: function() {
        triggerEvents(this, 'mute', this, arguments);
    },
    play: function() {
        triggerEvents(this, 'play', this, arguments);
    },
    play: function() {
        triggerEvents(this, 'play', this, arguments);
    },
    seek: function() {
        triggerEvents(this, 'progress', this, arguments);
    },
    setMute: function(mute) {
        var event = mute ? 'mute' : 'unmute';
        triggerEvents(this, event, _.rest(arguments));
    },
    setVolume: function() {
        triggerEvents(this, 'volume', this, arguments);
    },
    stop: function() {
        triggerEvents(this, 'stop', this, arguments);
    },
    togglePause: function(playing) {
        var event = playing ? 'pause' : 'resume';
        triggerEvents(this, event, this, _.rest(arguments));
    },
    triggerProgress: function() {
        triggerEvents(this, event, this, {percent: 0, time: 0}, arguments);
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
        triggerEvents(this, 'destruct', this, arguments);
    },
    end: function() {
        this.get("sound").stop();
        triggerEvents(this, 'end', this, arguments);
    },
    getDuration: function() {
        return this.get("duration");
    },
    getVolume: function() {
        return this.get('sound').volume;
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
        triggerEvents(this, 'play', this, arguments);
    },
    seek: function(decimalPercent) {
        var time = Math.floor(decimalPercent * this.get("sound").duration);
        this.get("sound").setPosition(time);
        triggerEvents(this, 'progress', this, {percent: decimalPercent, time: time}, _.rest(arguments));
    },
    setMute: function(mute) {
        var event = mute ? 'mute' : 'unmute';
        if (mute) {
            this.get("sound").mute();
        }
        else {
            this.get("sound").unmute();
        }
        triggerEvents(this, event, this, _.rest(arguments));
    },
    
    setVolume: function(intPercent) {
        this.setMute(intPercent == 0);
        this.get("sound").setVolume(intPercent);
        triggerEvents(this, 'volume', this, arguments);
    },
    
    stop: function() {
        this.get("sound").stop();
        triggerEvents(this, 'stop', this, arguments);
    },
    
    togglePause: function() {
        var playing = this.isPlaying();
        var sound = this.get("sound");
        sound.togglePause();
        var event = playing ? 'pause' : 'resume';
        triggerEvents(this, event, this, arguments);
    },
    
    toggleMute: function() {
        var mute = !this.isMuted();
        this.setMute(mute);
    },

    triggerProgress: function() {
        var time = this.get('sound').position;
        var percent = time / this.get('sound').duration;
        triggerEvents(this, 'progress', this, {percent: percent, time: time}, arguments);
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
        var self = this, args = arguments;
        YouTube.reset().then(function() {
            self._stopped = true;
            triggerEvents(self, 'destruct', self, args);
        });
    },
    end: function() {
        this.destruct();
    },
    getVolume: function() {
        return YouTube.getVolume();
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
        var self = this, args = arguments;
        if (this.isPaused()) {
            this.togglePause();
        } else {
            YouTube.reset();
            YouTube.load(_.extend({autoPlay: true}, options, {
                initialVideo: this.get('siteMediaID')
            })).then(function() {
                self._stopped = false;
                self.listenTo(YouTube, 'progress', function(progress) {
                    triggerEvents(self, 'progress', self, progress);
                });
                YouTube.once('end error', function() {
                    self.stopListening(YouTube, 'progress');
                    self.end();
                });
                triggerEvents(self, 'play', self, args);
            });
        }
    },
    seek: function(decimalPercent) {
        var duration = this.get('duration'), 
            self = this, 
            time = Math.floor(decimalPercent * duration),
            args = arguments;
        YouTube.seek(time).then(function() {
            self._stopped = false;
            triggerEvents(self, 'progress', self, {percent: decimalPercent, time: time}, _.rest(args));
        });
    },
    setMute: function(mute, silent) {
        var self = this, dfd, event, args = _.rest(arguments, 2);
        if (mute) {
            event = 'mute';
            dfd = YouTube.mute();
        } else {
            dfd = YouTube.unmute();
            event = 'unmute';
        }
        dfd.then(function() {
            if (silent) {
                return;
            }
            triggerEvents(self, event, self, args);
        });
    },
    setVolume: function(percent) {
        var muted = this.isMuted(), dfd, self = this, args = arguments;
        dfd = YouTube.setVolume(percent);
        if (percent == 0 && !muted) {
            dfd.then(function() {
                return YouTube.setMute(true, true);
            });
        } else if (percent > 0 && muted) {
            dfd.then(function() {
                return YouTube.setMute(false, true);
            });
        }
        dfd.then(function() {
            triggerEvents(self, 'volume', self, args);
        });
    },
    stop: function() {
        var self = this, args = arguments;
        YouTube.pause();
        YouTube.seek(0).then(function() {
            self._stopped = true;
            triggerEvents(self, 'stop', self, args);
        });
    },
    togglePause: function() {
        var self = this;
        var state = YouTube.state;
        var playing = state == 1 || state == 3;
        var dfd = playing ? YouTube.pause() : YouTube.play();
        var event = playing ? 'pause' : 'resume', args = arguments;
        dfd.then(function() {
            self._stopped = false;
            triggerEvents(self, event, self, args);
        });
    },
    toggleMute: function() {
        var mute = !this.isMuted();
        this.setMute(mute);
    },
    triggerProgress: function() {
        var args = arguments;
        YouTube.getData().then(function(data) {
            var time = data.currentTime,
                duration = data.duration,
                percent = time / duration;
            triggerEvents(self, 'progress', self, {percent: percent, time: time}, args);
        });
    }
});