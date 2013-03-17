var getAttribute = function(name, value) {
    return name + '="' + value + '"';
};

//Thanks to Richard Scarrott
var fastMove = function(arr, pos1, pos2) {
    // local variables
    var i, tmp;
    // cast input parameters to integers
    // if positions are different and inside array
    if (pos1 !== pos2 && 0 <= pos1 && pos1 <= arr.length && 0 <= pos2 && pos2 <= arr.length) {
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
      arr[pos2] = tmp;
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
        this.muted = false,
		this.totalDuration = 0;

        this.on("add", function(mediaObjects, playlist, options) {
            options || (options = {});
            mediaObjects = _.isArray(mediaObjects) ? mediaObjects : [mediaObjects];
            var index = options.index, playNext = false;
            if (options.play) {
                playNext = (options.index == null) 
                    ? this.indexOf(mediaObjects[0])
                    : options.index;
            }
            this.totalDuration += _(mediaObjects)
                .reduce(function(memo, val) {
                    return memo + val.get('duration');
                }, 0);
            this.trigger("tracks", mediaObjects, options);
            // Syncs when we reach end of a batch add (or no batch was specified)
            if (!options.batch || index - options.batch + 1 == options.start) {
                this.sync("create", this);
                if (playNext !== false) {
                    this.goToTrack(playNext, true);
                }
            }
        });

        this.on("remove", function(mediaObject, playlist, options) {
            var index = options.index;

            this.totalDuration -= mediaObject.get('duration');
            if (index == this.currentTrack) {
                this.goToTrack(Math.min(this.size() - 1, index), this.isPlaying());
            }
            if ( ! this.where({siteMediaID: mediaObject.get('siteMediaID')}).length) {
                // Destroys media if no more instances exist in playlist
                mediaObject.destruct();
            }
            this.sync("create", this);
        });

		this.on("reset", function(playlist, options) {
            options || (options = {});
			var currentTrack = options.currentTrack || 0;
            var autoplay = options.play && this.isLoaded();
            this.totalDuration = _(this.pluck('duration'))
                .reduce(function(memo, val) {
                    return memo + val;
                }, 0);
            if (!this.size()) {
                this.stop(true);
                soundManager.reboot();
		    }
            this.trigger("tracks:new", this.models);
            this.goToTrack(currentTrack, autoplay);
            var result;
            if (!options.readonly) {
                result = this.sync("create", this);
            } else {
                result = $.Deferred();
                result.resolve();
                result = result.promise();
            }
            return result;
		});

        this.on('id', function(data) {
            this.id = data.id;
        });
	},
    getVolume: function() {
        if (!this.isLoaded()) {
            return 0;
        }
        return this.isMuted() ? 0 : this.currentVolumePercent;
    },
    goToTrack: function(index, autostart) {
        if (!this.size()) {
            this.setCurrentTrack(0);
            return;
        }
        this.stop(true);
        this.setCurrentTrack(index);
        if (autostart) {
            this.play();
        }
    },
    hasNext: function() {
        return this.isLoaded() && this.size() > this.currentTrack + 1;
    },
    hasPrevious: function() {
        return this.isLoaded() && this.currentTrack - 1 >= 0;
    },
    isLoaded: function() {
        return this.size() && this.currentMedia;
    },
    isMuted: function() {
        return this.muted;
    },
    isPaused: function() {
        var status = false;
        if (this.isLoaded()) {
            status = this.currentMedia.isPaused();
        }
        return status;
    },
    isPlaying: function() {
        var status = false;
        if (this.isLoaded()) {
            status = this.currentMedia.isPlaying() || this.currentMedia.isPaused();
        }
        return status;
    },
    moveTrack: function(pos1, pos2) {
        if (this.isLoaded() && pos1 != pos2) {
        	var minIndex = 0;
            if (pos1 >= 0 && pos2 >= 0 && pos1 < this.size() && pos2 < this.size()) {
                fastMove(this.models, pos1, pos2);
                this.sync("create", this);
            }
        }
    },
    nextTrack: function(autostart) {
        var track = this.currentTrack, next = (track + 1) % this.size() || 0;
        this.goToTrack(next, autostart);
    },
    parse: function(response) {
    	var mediaObjects = [];
    	if (response.id) {
    		mediaObjects = _.chain(response.tracks || []).map(function(item) {
                return Track.getMediaObject(item);
            }).compact().value();
    	}
        if (response.error) {
            this.trigger('error:server', response.error);
        }
    	return mediaObjects;
    },
    play: function() {
        if (this.isLoaded()) {
            var playlist = this;
            var progress = function(media) {
                media.triggerProgress();
            };
            var media = this.currentMedia;
            if (media.get('type') == 'audio') {
                media.play({
                    volume: playlist.getVolume(),
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
                        progress(media);
                    }
                });
            }
            else if (media.get('type') == 'video') {
                if (media.get('siteName') == 'YouTube') {
                    media.play({
                        volume: playlist.getVolume()
                    });
                    media.once('end', function() {
                        playlist.nextTrack(true);
                    }, this);
                }
            }
        }
    },
    previousTrack: function(autostart) {
        var track= this.currentTrack, next = (track - 1 + this.size()) % this.size() || 0 ;
        this.goToTrack(next, autostart);
    },
    seek: function(decimalPercent) {
        if (this.isLoaded()) {
            var track = this.currentMedia;
            track.seek(decimalPercent);
        }
    },
    setCurrentTrack: function(trackNumber) {
        var self = this;
        if (this.currentMedia) {
            this.stopListening(this.currentMedia);
        }
        if (this.size() && trackNumber >= 0 && trackNumber < this.size()) {
            this.currentTrack = trackNumber;
            this.currentMedia = this.at(trackNumber);
        } else {
            this.currentTrack = 0;
            this.currentMedia = null;
        }
        this.trigger('track', this.currentMedia, this.currentTrack);
        
    },
    setMute: function(mute) {
        if (!this.isLoaded()) {
            return false;
        }
        this.muted = mute;
        this.currentMedia.setMute(mute);
        if (!mute && this.currentVolumePercent > 0) {
            this.setVolume(this.currentVolumePercent);
        }
    },
    setVolume: function(intPercent) {
        if (!this.isLoaded()) {
            return false;
        }
        intPercent = Math.round(intPercent);
        var media = this.currentMedia;
        this.currentVolumePercent = intPercent;
        media.setVolume(intPercent);
    },
    shuffle: function() {
        if (!this.isLoaded()) {
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
        if (this.isLoaded()) {
            // Hard stop is used when the current media should be 'destroyed' (unload from the client)
            // until the next time the user loads it in the playlist
            if (hard) {
                this.currentMedia.end();
            } else {
                this.currentMedia.stop();
            }
        }
    },
    sync: function(method, model, options) {
        var self = this;
        options = options || {
            error: function() {
                self.trigger('error:communication', 'Playlist fetching and syncing are inaccessible right now.');
            },
            timeout: 20000
        };
        if (method == 'create') {
            options.url = 'playlists/save';
        } else if (options.id) {
            options.url = model.url(options.id);
        }
        return Backbone.sync(method, model, options).always(function(data) {
            data = data || {};
            if (!data.id || data.id != model.id) {
                model.trigger('id', data);
            }
        });
    },
    toJSON: function() {
        var playlist = [];
        this.forEach(function(media, index) {
            playlist.push({
                siteCode: media.get("siteCode"),
                siteMediaID: media.get("siteMediaID")
            });
        });
        return playlist;
    },
    toggleMute: function() {
        this.setMute(!this.muted);
    },
    togglePause: function() {
        if (!this.isLoaded()) {
            return;
        }
        this.currentMedia.togglePause();
    },
	url: function(id) {
		var loc = '/';
        id || (id = this.id || false);
		if (id) {
			loc += 'playlists/' + id;
		}
		return loc;
	}
});

var SearchResultsProvider = TrackList.extend({
    nextPage: function() {
        var self = this;
        this.page++;
        var results = this.fetch({
            error: self.onerror,
            remove: false,
            update: true
        });
        return results;
    },
    initialize: function() {
        var self = this;
        this.query = '';
        this.page = 0;
        this.site = '';
        this.onerror = function() {
            self.trigger('error:communication', 'Search results are unavailable.');
        };
        this.on('add', function(models, collection) {
            collection.trigger('results', models);
        });
        this.on('reset', function(collection) {
            collection.trigger('results:new', collection);
        });
    },
    parse: function(data) {
        var self = this, 
            tracks = [];

        var options = {
            silent: true
        };
        _(data).each(function(result) {
            tracks.push(Track.getMediaObject(result, options));
        });
        if (data.error) {
            this.trigger('error:server', data.error);
        }
        return tracks;
    },
    search: function(query, site) {
        this.query = query;
        this.page = 0;
        this.site = site;
        return this.fetch({
            error: this.onerror
        });
    },
    url: function() {
        return '/search/' + this.site + '/' + this.page + '/' + encodeURIComponent(this.query);
    }
});