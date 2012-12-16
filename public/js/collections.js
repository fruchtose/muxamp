var getAttribute = function(name, value) {
    return name + '="' + value + '"';
};

//Thanks to Richard Scarrott
var fastMove = function(arr, pos1, pos2) {
    // local variables
    var i, tmp;
    // cast input parameters to integers
    // if positions are different and inside array
    if (pos1 !== pos2 && 0 <= pos1 && pos1 <= this.length && 0 <= pos2 && pos2 <= this.length) {
      // save element from position 1
      tmp = arr[pos1];
      // move element down and shift other elements up
      if (pos1 < pos2) {
        for (i = pos1; i < pos2; i++) {
          arr[i] = arr[i + 1];
        }
      }
      // move element up and shift other elements down
      else {
        for (i = pos1; i > pos2; i--) {
          arr[i] = arr[i - 1];
        }
      }
      // put element from position 1 to destination
      this[pos2] = tmp;
    }
};

var TrackList = Backbone.Collection.extend({
	model: Track
});

var TrackPlaylist = TrackList.extend({
	initialize: function() {
        this.currentMedia = null,
		this.currentTrack =  0,
		this.currentVolumePercent = 50,
		this.id = false,
		this.totalDuration = 0;
		this.settings = {};

        this.on("add", function(mediaObjects, playlist, options) {
            mediaObjects = _.isArray(mediaObjects) ? mediaObjects : [mediaObjects];
            var index = options.index, playNext = false;
            if (options.play) {
                playNext = (options.index == undefined) ? this.indexOf(mediaObjects[0]) : options.index;
            }
            var addedDuration = 0;
            for (var i in mediaObjects) {
                var mediaObject = mediaObjects[i];
                addedDuration += mediaObject.get('duration');
            }
            this.totalDuration += addedDuration;
            this.trigger("tracks", mediaObjects, options);
            // Syncs when we reach end of a batch add (or no batch was specified)
            if (!options.batch || 1 + index - options.batch == options.start) {
                this.sync("create", this);
                this.setCurrentTrack(this.currentTrack);
                if (playNext !== false) {
                    this.goToTrack(playNext, true);
                }
            }
            
        });

        this.on("remove", function(mediaObject, playlist, options) {
            var index = options.index;

            var wasPlaying = mediaObject.isPlaying() && mediaObject == this.currentMedia;
            if (wasPlaying){
                this.stop(true);
            }
            var trackDuration = mediaObject.get('duration');
            mediaObject.destruct();
            if (mediaObject == this.currentMedia) {
                this.setCurrentTrack(Math.min(this.size() - 1, index));
            }
            if (!this.isEmpty() && wasPlaying) {
                this.play();
            }
            this.totalDuration -= trackDuration;
            this.sync("create", this);
        });

		this.on("reset", function(playlist, options) {
			var mediaObjects = this.models || [];
			var currentTrack = (options ? options.currentTrack : 0) || 0;
		    var duration = 0;
            this.trigger("tracks:new", this.models);
            if (mediaObjects.length) {
                for (var i in mediaObjects) {
                    var mediaObject = mediaObjects[i];
                    duration += mediaObject.get('duration');
                }
            } else {
		    	this.stop(true);
                soundManager.reboot();
		    }
            this.totalDuration = duration;
            this.sync("create", this);
            this.setCurrentTrack(currentTrack);
            if (options.play && !this.isEmpty()) {
                this.goToTrack(0, true);
            }
		});

        this.on('sync', function(data) {
            if (data.id) {
                this.id = data.id;
            }
        });
	},
    getSetting: function(option) {
    	return this.settings[option];
    },
    getVolume: function() {
        return this.currentVolumePercent;
    },
    goToTrack: function(index, autostart) {
        if (this.isEmpty()) {
            return;
        }
        var wasPlaying = this.isPlaying();
        this.stop(true);
        var media = this.currentMedia;
        this.setCurrentTrack(parseInt(index));
        if (wasPlaying || autostart) {
            this.play();
        }
    },
    hasNext: function() {
        return !this.isEmpty() && this.size() > this.currentTrack + 1;
    },
    hasPrevious: function() {
        return !this.isEmpty() && this.currentTrack - 1 >= 0;
    },
    isEmpty: function() {
        return ! this.size();
    },
    isMuted: function() {
        var result = false;
        if (!this.isEmpty()) {
            result = this.currentMedia.isMuted();
        }
        return result;
    },
    isPaused: function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.currentMedia.isPaused();
        }
        return status;
    },
    isPlaying: function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.currentMedia.isPlaying() || this.currentMedia.isPaused();
        }
        return status;
    },
    moveTrack: function(pos1, pos2) {
        if (!this.isEmpty() && pos1 != pos2) {
        	var minIndex = 0;
            if (pos1 >= 0 && pos2 >= 0 && pos1 < this.size() && pos2 < this.size()) {
                fastMove(this.models, pos1, pos2);
                this.sync("create", this);
            }
        }
        this.sync("create", this);
    },
    nextTrack: function(autostart) {
        var trackInt = parseInt(this.currentTrack), next = (trackInt + 1) % this.size() || 0;
        this.goToTrack(next, autostart);
    },
    parse: function(response) {
    	var mediaObjects= [];
    	if (response.id) {
    		var results = response.results;
	    	if (results.length) {
	    		var i;
	    		for (i in results) {
	    			var mediaObject = Track.getMediaObject(results[i]);
	    			mediaObject && mediaObjects.push(mediaObject);
	    		}
	    	}
    	}
    	return mediaObjects;
    },
    play: function() {
        if (!this.isEmpty()) {
            var playlist = this;
            var progress = function(details) {
                playlist.trigger('progress', details);
            };
            var media = this.currentMedia;
            if (media.get('type') == 'audio') {
                media.play({
                    volume: (playlist.isMuted() ? 0 : playlist.getVolume()),
                    onfinish: function() {
                        playlist.nextTrack(true);
                    },
                    onload: function(success) {
                        if (!success) {
                            playlist.nextTrack(true);
                        }
                    },
                    whileplaying: function() {
                        var position = this.position, seconds = position/1000;
                        var percent = Math.min(100 * (position / this.duration), 100);
                        progress({percent: percent, time: seconds});
                    }
                });
            }
            else if (media.get('type') == 'video') {
                if (media.get('siteName') == 'YouTube') {
                    media.play({
                        volume: playlist.isMuted() ? 0 : playlist.getVolume(),
                    });
                    playlist.listenTo(YouTube, 'progress', progress);
                    YouTube.once('end error', function() {
                        playlist.stopListening(YouTube);
                        playlist.nextTrack(true);
                    }, this);
                }
            }
            this.trigger('play', media);
        }
    },
    previousTrack: function(autostart) {
        var trackInt = parseInt(this.currentTrack), next = (trackInt - 1 + this.size()) % this.size() || 0 ;
        this.goToTrack(next, autostart);
    },
    seek: function(decimalPercent) {
        if (!this.isEmpty()) {
            var track = this.currentMedia;
            track.seek(decimalPercent);
        }
    },
    setCurrentTrack: function(trackNumber) {
        this.currentTrack = trackNumber;
        if (!this.isEmpty() && trackNumber >= 0 && trackNumber < this.size()) {
            this.currentMedia = this.at(trackNumber);
        } else {
            this.currentTrack = 0;
            this.currentMedia = null;
        }
        this.trigger('currentTrack', this.currentTrack);
    },
    setMute: function(mute) {
        if (!this.isEmpty()) {
            this.currentMedia.setMute(mute);
        }
        if (!mute) {
            this.setVolume(this.currentVolumePercent);
        }
    },
    setSetting: function(option, value) {
    	this.settings[option] = value;
    },
    setVolume: function(intPercent) {
        intPercent = Math.round(intPercent);
        if (this.isPlaying() || this.isPaused()) {
            var media = this.currentMedia;
            var setMute = intPercent == 0;
            media.setVolume(intPercent);
            if (setMute) {
                intPercent = 50;
            }
        }
        this.currentVolumePercent = intPercent;
        this.trigger('volume', setMute ? 0 : intPercent);
    },
    shuffle: function() {
        if (this.isEmpty()) {
            return false;
        }
        // Fisher-Yates shuffle implementation by Cristoph (http://stackoverflow.com/users/48015/christoph),
        var currentSiteMediaID = this.currentMedia.get('siteMediaID');
        var newCurrentTrack = this.currentTrack, arrayShuffle = function(array) {
            var tmp, current, top = array.length;

            if(top) while(--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
                if (newCurrentTrack == current) {
                    newCurrentTrack = top;
                } else if (newCurrentTrack == top) {
                    newCurrentTrack = current;
                }
            }
            return array;
        }
        
        var newList = this.models.slice(0), i;
        newList = arrayShuffle(newList);
        // Rewrites the DOM for the new playlist
        this.reset(newList, {currentTrack: newCurrentTrack});
    },
    stop: function (hard) {
        if (!this.isEmpty() || this.currentMedia) {
            // Hard stop is used when the current media should not be restarted until 
            // the next time a player queues it
            if (hard) {
                this.currentMedia.end();
            } else {
                this.currentMedia.stop();
            }
            
            this.trigger('progress', {percent: 0, time: 0});
            this.trigger('stop', this.currentMedia);
        }
    },
    sync: function(method, model, options) {
        options = options || {timeout: 20000};
        if (method == 'create') {
            options.url = 'playlists/save';
        } else if (options.id) {
            options.url = model.url(options.id);
        }
        return Backbone.sync(method, model, options).always(function(data) {
            data = data || {};
            if (!data.id || data.id != model.id) {
                model.trigger('sync', data);
            }
        });
    },
    toJSON: function() {
        var playlist = [];
        this.forEach(function(media) {
            playlist.push({
                siteCode: media.get("siteCode"),
                siteMediaID: media.get("siteMediaID")
            });
        });
        return playlist;
    },
    toggleMute: function() {
        if (!this.isEmpty()) {
            var shouldUnmute = this.currentMedia.isMuted();
            this.currentMedia.toggleMute();
            if (shouldUnmute) {
                this.setVolume(this.currentVolumePercent);
            }
            else {
                this.trigger('volume', 0);
            }
        }
    },
    togglePause: function() {
        if (!this.isEmpty()) {
            var isPaused = this.currentMedia.isPaused();
            this.currentMedia.togglePause();
            if (isPaused) {
                this.trigger('resume');
            } else {
                this.trigger('pause');
            }
        }
    },
	url: function(id) {
		var loc = '/';
        id || (id = this.id);
		if (id) {
			loc += 'playlists/' + id;
		}
		return loc;
	}
});

var SearchResultsProvider = TrackList.extend({
    nextPage: function() {
        this.page++;
        var results = this.fetch({
            add: true
        });
        return results;
    },
    initialize: function() {
        this.query = '';
        this.page = 0;
        this.site = '';
        this.on('add', function(models, collection) {
            collection.trigger('results', models);
        });
        this.on('reset', function(collection) {
            collection.trigger('results:new', collection.models);
        });
    },
    parse: function(data) {
        var tracks = [];
        _(data).each(function(result) {
            tracks.push(Track.getMediaObject(result));
        });
        return tracks;
    },
    search: function(query, site) {
        this.query = query;
        this.page = 0;
        this.site = site;
        return this.fetch();
    },
    url: function() {
        return '/search/' + this.site + '/' + this.page + '/' + encodeURIComponent(this.query);
    }
});