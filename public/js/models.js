var triggerEvents = function(context) {
    args = _.chain(arguments).flatten().rest().value() || [];
    return context.trigger.apply(context, args);
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
        triggerEvents(this, 'destruct', Array.prototype.slice.call(arguments));
    },
    end: function() {
        triggerEvents(this, 'end', Array.prototype.slice.call(arguments));
    },
    mute: function() {
        triggerEvents(this, 'mute', Array.prototype.slice.call(arguments));
    },
    play: function() {
        triggerEvents(this, 'play', Array.prototype.slice.call(arguments));
    },
    play: function() {
        triggerEvents(this, 'play', Array.prototype.slice.call(arguments));
    },
    seek: function() {
        triggerEvents(this, 'progress', Array.prototype.slice.call(arguments));
    },
    setMute: function(mute) {
        var event = mute ? 'mute' : 'unmute';
        triggerEvents(this, event, _.rest(arguments));
    },
    setVolume: function() {
        triggerEvents(this, 'volume', Array.prototype.slice.call(arguments));
    },
    stop: function() {
        triggerEvents(this, 'stop', Array.prototype.slice.call(arguments));
    },
    togglePause: function(playing) {
        var event = playing ? 'pause' : 'resume';
        triggerEvents(this, event, this, _.rest(arguments));
    },
    triggerProgress: function() {
        triggerEvents(this, event, this, {percent: 0, time: 0}, Array.prototype.slice.call(arguments));
    }
}, {
    getMediaObject: function(mediaData, options) {
        var mediaObject = null;
        options || (options = {});
        if (mediaData) {
            var proto,
                params = _(mediaData).pick('siteMediaID', 'url', 'permalink', 'mediaName', 'duration');
            
            params.uploader = mediaData.author;
            switch (mediaData.siteCode) {
                case 'sct':
                    proto = SoundCloudTrack;
                    params.soundManager = soundManager;
                    break;
                case 'jmt':
                    proto = JamendoTrack;
                    params.soundManager = soundManager;
                    break;
                case 'ytv':
                    proto = YouTubeTrack;
                    break;
            }
            mediaObject = new proto(params, options);
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
        triggerEvents(this, 'progress', {percent: 0, time: 0}, Array.prototype.slice.call(arguments));
        triggerEvents(this, 'destruct', Array.prototype.slice.call(arguments));
    },
    end: function() {
        this.get("sound").stop();
        triggerEvents(this, 'progress', {percent: 0, time: 0}, Array.prototype.slice.call(arguments));
        triggerEvents(this, 'end', Array.prototype.slice.call(arguments));
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
        triggerEvents(this, 'play', Array.prototype.slice.call(arguments));
    },
    seek: function(decimalPercent) {
        var time = Math.floor(decimalPercent * this.get("sound").duration);
        this.get("sound").setPosition(time);
        triggerEvents(this, 'progress', {percent: decimalPercent, time: time}, _.rest(arguments));
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
        triggerEvents(this, 'volume', Array.prototype.slice.call(arguments));
    },
    
    stop: function() {
        this.get("sound").stop();
        triggerEvents(this, 'stop', Array.prototype.slice.call(arguments));
    },
    
    togglePause: function() {
        var playing = this.isPlaying();
        var sound = this.get("sound");
        sound.togglePause();
        var event = playing ? 'pause' : 'resume';
        triggerEvents(this, event, this, Array.prototype.slice.call(arguments));
    },
    
    toggleMute: function() {
        var mute = !this.isMuted();
        this.setMute(mute);
    },

    triggerProgress: function() {
        var time = this.get('sound').position / 1000;
        var percent = (time * 100.0) / this.get('duration');
        triggerEvents(this, 'progress', {percent: percent, time: time}, Array.prototype.slice.call(arguments));
    }
});

var JamendoTrack = SoundTrack.extend({
    defaults: _.extend({}, SoundTrack.prototype.defaults, {
        site: 'Jamendo',
        siteCode: 'jmt',
        // Icon by Oliver Schultz, used under Creative Commons SA NC
        //http://www.iconfinder.com/iconsets/humano2#readme
        icon: 'img/jamendo_16.png'
    })
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
        var self = this, args = Array.prototype.slice.call(arguments);
        return YouTube.reset().then(function() {
            self._stopped = true;
            triggerEvents(self, 'progress', {percent: 0, time: 0}, Array.prototype.slice.call(arguments));
            triggerEvents(self, 'destruct', args);
        });
    },
    end: function() {
        var self = this, args = Array.prototype.slice.call(arguments);;
        return this.destruct().then(function() {
            triggerEvents(self, 'end', args);
        });
    },
    getVolume: function() {
        return YouTube.getVolume();
    },
    idInPlayer: function() {
        return YouTube.videoId() == this.get('siteMediaID');
    },
    isBuffering: function() {
        return this.idInPlayer() && YouTube.state == 3;
    },
    isMuted: function() {
        return this.idInPlayer() && YouTube.isMuted();
    },
    isPaused: function() {
        return this.idInPlayer() && !this._stopped && YouTube.state == 2;
    },
    isPlaying: function() {
        return this.idInPlayer() && !this._stopped && 
            (YouTube.hasPlayer() || YouTube.state === 1 || this.isPaused() || this.isBuffering());
    },
    isStopped: function() {
        return this._stopped || !this.isPlaying();
    },
    play: function(options) {
        var self = this, args = Array.prototype.slice.call(arguments);
        if (this.isPaused()) {
            this.togglePause();
        } else {
            YouTube.reset();
            YouTube.load(_.extend({autoPlay: true}, options, {
                initialVideo: this.get('siteMediaID')
            })).then(function() {
                self._stopped = false;
                self.listenTo(YouTube, 'progress', function(progress) {
                    triggerEvents(self, 'progress', progress, args);
                });
                YouTube.once('end error', function() {
                    self.stopListening(YouTube, 'progress');
                    self.end();
                });
                triggerEvents(self, 'play', args);
            });
        }
    },
    seek: function(decimalPercent) {
        var duration = this.get('duration'), 
            self = this, 
            time = Math.floor(decimalPercent * duration),
            args = Array.prototype.slice.call(arguments);
        YouTube.seek(time).then(function() {
            self._stopped = false;
            triggerEvents(self, 'progress', {percent: decimalPercent, time: time}, _.rest(args));
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
        var muted = this.isMuted(), dfd, self = this, args = Array.prototype.slice.call(arguments);
        dfd = YouTube.setVolume(percent);
        if (percent == 0 && !muted) {
            dfd.then(function() {
                return self.setMute(true, true);
            });
        } else if (percent > 0 && muted) {
            dfd.then(function() {
                return self.setMute(false, true);
            });
        }
        dfd.then(function() {
            triggerEvents(self, 'volume', args);
        });
    },
    stop: function() {
        var self = this, args = Array.prototype.slice.call(arguments);
        YouTube.pause();
        YouTube.seek(0).then(function() {
            self._stopped = true;
            triggerEvents(self, 'stop', args);
        });
    },
    togglePause: function() {
        var self = this;
        var state = YouTube.state;
        var playing = this.isPlaying();
        var dfd = playing ? YouTube.pause() : YouTube.play();
        var event = playing ? 'pause' : 'resume', args = Array.prototype.slice.call(arguments);
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
        var args = Array.prototype.slice.call(arguments);
        YouTube.getData().then(function(data) {
            var time = data.currentTime,
                duration = data.duration,
                percent = (time * 100.0) / duration;
            triggerEvents(self, 'progress', {percent: percent, time: time}, args);
        });
    }
});