var Track = Backbone.Model.extend({
	defaults: {
		id: "",
		siteMediaID: "",
		siteCode: "",
		icon: "",
		permalink: "",
		url: "",
		artist: "",
		siteName: "",
		mediaName: "",
		type: ""
	}
});

var SoundTrack = Track.extend({
	defaults: _.extend({}, Track.prototype.defaults, {
		soundManager: null,
		duration: 0.0,
		sound: null
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
        return this.soundManager.play(this.id, options);
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