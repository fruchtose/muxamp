var PlaylistDOMInformation = function() {
	this.container = "#tab-content";
	
    this.parentTable = "table#tracks tbody";
    
    this.lastElementOfParent = this.parentTable + ":last";
    
    this.lastRowInParent = this.parentTable + " tr:last";
    
    this.allRowsInTable = this.parentTable + " tr";
    
    this.getActionForID = function(id, action) {
    	return this.getRowForID(id) + " a." + action;
    }
    
    this.getRowForID = function(id) {
        return this.parentTable + " tr." + id;
    };
    
    this.content = ".content";
    
    this.trackName = "div.name";
    
    this.trackDurationBox = "div.dur-box";
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
		this.isChangingState = false,
		this.playlistDOM = new PlaylistDOMInformation(),
		this.totalDuration = 0;
		this.settings = {};

        this.on("add", function(mediaObjects, playlist, options) {
            mediaObjects= $.isArray(mediaObjects) ? mediaObjects : [mediaObjects];
            var index = options.index;
            var currentTrack = $.isNumeric(options.currentTrack) ? options.currentTrack : this.currentTrack;
            this._addPlaylistDOMRows(mediaObjects, index);
            var addedDuration = 0;
            for (var i in mediaObjects) {
                var mediaObject = mediaObjects[i];
                addedDuration += mediaObject.get('duration');
            }
            this.setCurrentTrack(currentTrack);
            this.sync("create", this);
            $('#track-count').text(this.size().toString());
            this.totalDuration += addedDuration;
            $('#playlist-duration').text(secondsToString(this.totalDuration));
            $(this.playlistDOM.parentTable).sortable('refresh');
            this.updateTrackEnumeration();
        });

        this.on("remove", function(mediaObject, playlist, options) {
            var index = options.index;

            var wasPlaying = mediaObject.isPlaying() && mediaObject == this.currentMedia;
            if (wasPlaying){
                this.stop();
            }

            var trackDuration = mediaObject.get('duration');
            mediaObject.destruct();
            
            $($(this.playlistDOM.allRowsInTable).get(index)).remove();
            this.renumberTracks(Math.max(0, Math.min(this.size() - 1, index)));
            if (mediaObject == this.currentMedia) {
                this.setCurrentTrack(Math.min(this.size() - 1, index));
            }
            this.sync("create", this);
            if (!this.isEmpty() && wasPlaying) {
                this.play();
            }
            this.setPlayButton(this.isEmpty());
            $('#track-count').text(this.size());
            this.totalDuration -= trackDuration;
            $('#playlist-duration').text(secondsToString(this.totalDuration));
            this.updateTrackEnumeration();
        });

		this.on("reset", function(playlist, options) {
			var mediaObjects = this.models || [];
			var currentTrack = (options ? options.currentTrack : 0) || 0;
		    var duration = 0;
            $(this.playlistDOM.allRowsInTable).remove();
            if (mediaObjects.length) {
                this._addPlaylistDOMRows(mediaObjects, 0);
                for (var i in mediaObjects) {
                    var mediaObject = mediaObjects[i];
                    duration += mediaObject.get('duration');
                }
            } else {
		    	this.stop();
                soundManager.reboot();
		    }
		    this.setCurrentTrack(currentTrack);
		    this.sync("create", this);
		    $('#track-count').text(this.size().toString());
		    this.totalDuration = duration;
		    $('#playlist-duration').text(secondsToString(this.totalDuration));
		    $(this.playlistDOM.parentTable).sortable('refresh');
		    this.updateTrackEnumeration();
		});
	},
	_addPlaylistDOMRow: function(mediaObject, index) {
        var playlist = this;
        var appendedHTML = this._getDOMRowForMediaObject(mediaObject, index);
        $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        var id = mediaObject.get('id');
        $(this.playlistDOM.getActionForID(id, 'remove')).live('click', function() {
            playlist.remove(mediaObject);
        });
    },
    _addPlaylistDOMRows: function(mediaObjects, insertLocation) {
        var index;
    	if ( !(mediaObjects instanceof Array) ) {
            mediaObjects = [mediaObjects];
        }
        var playlist = this, appendedHTML = '';
        var currentLength = $(this.playlistDOM.allRowsInTable).length;
        for (index in mediaObjects){
            var mediaObject = mediaObjects[index];
            appendedHTML += this._getDOMRowForMediaObject(mediaObject, currentLength + parseInt(index) + 1);
        }
        if ($.isNumeric(insertLocation)) {
            if ($(this.playlistDOM.allRowsInTable).size()) {
                $($(this.playlistDOM.allRowsInTable).get(insertLocation)).after(appendedHTML);
            }
            else {
                $(this.playlistDOM.parentTable).append(appendedHTML);
            }
        }
        else {
            $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        }
        for (index in mediaObjects){
            var mediaObject = mediaObjects[index];
        	var row = $(this.playlistDOM.getRowForID(mediaObjects[index].get('id')));
            row.find(this.playlistDOM.trackName).width(row.find(this.playlistDOM.content).width() - row.find(this.playlistDOM.trackDurationBox).width());
        	row.dblclick(function() {
                playlist.goToTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index(), true);
            });
            $(this.playlistDOM.getActionForID(mediaObjects[index].get('id'), 'remove')).live('click', function() {
                var trackNumber = $($(this).closest(playlist.playlistDOM.allRowsInTable)).index();
                playlist.remove(playlist.at(trackNumber));
            });
            $(this.playlistDOM.getActionForID(mediaObjects[index].get('id'), 'play')).live('click', function() {
                playlist.goToTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index(), true);
            });
        }
    },
    _getDOMRowForMediaObject: function(mediaObject, index) {
        return '<tr class=' + mediaObject.get('id') + '>' + this._getDOMTableCellsForMediaObject(mediaObject, index) + '</tr>';
    },
    _getDOMTableCellsForMediaObject: function(mediaObject, index) {
    	var remove = '<a href onclick="return false;" class="btn action remove"><i class="icon-remove""></i></a>';
    	var play = '<a href onclick="return false;" class="btn action play"><i class="icon-play"></i></a>';
    	var actions = '<div class="actions">' + remove + play + '</div>';
    	var actionsCell = '<td class="action-cell">' + actions + '</td>';
    	var uploader = '<td class="uploader-cell" ' + getAttribute('title', mediaObject.get('uploader')) + '>' + mediaObject.get('uploader') + '</td>';
    	var title = '<td class="title-cell" ' + getAttribute('title', mediaObject.get('mediaName')) + '>' + mediaObject.get('mediaName') + '</td>';
    	var seconds = secondsToString(mediaObject.get('duration'));
    	var duration = '<td class="duration-cell" ' + getAttribute('title', seconds) + '>' + seconds + '</td>';
    	var link = '<td class="link-cell"><a href="' + mediaObject.get('permalink') + '"><img src="' + mediaObject.get('icon') + '" /></a></td>';
    	return actionsCell + uploader + title + duration + link;
    },
    getSetting: function(option) {
    	return this.settings[option];
    },
    getVolume: function() {
        return this.currentVolumePercent;
    },
    goToTrack: function(index, autostart) {
        if (!this.isEmpty()) {
            return;
        }
        var wasPlaying = this.isPlaying();
        this.stop();
        var media = this.currentMedia;
        if (media.get('type') == "video") {
            clearVideo();
        }
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
    indexOfTrackID: function(trackID) {
        var pos = -1, tracks = this.models;
        for (track in tracks) {
            if (tracks[track].get('id') == trackID) {
                pos = track;
                break;
            }
        }
        return pos;
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
    // Function is asynchronous, because the response can be depending on the media
    isPlaying: function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.currentMedia.isPlaying() || this.currentMedia.isPaused();
        }
        return status;
    },
    moveTrack: function(originalIndex, newIndex) {
        if (!this.isEmpty() && originalIndex != newIndex) {
        	var minIndex = 0;
            if (originalIndex >= 0 && newIndex >= 0 && originalIndex < this.size() && newIndex < this.size()) {
                var mediaObject = this.models.splice(originalIndex, 1)[0];
                this.models.splice(newIndex, 0, mediaObject);
                if (this.currentTrack == originalIndex) {
                    this.setCurrentTrack(newIndex);
                }
                else {
                    this.setCurrentTrack(Math.max(0, $(this.playlistDOM.allRowsInTable +'.playing').index()));
                }
            
                minIndex = Math.min(originalIndex, newIndex);
                // Track numbers are now inaccurate, so they are refreshed.
                this.renumberTracks(minIndex);
            }
            this.renumberTracks(minIndex);
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
	    			var mediaObject = getMediaObject(results[i]);
	    			mediaObject && mediaObjects.push(mediaObject);
	    		}
	    	}
            this.id = response.id;
    	}
    	return mediaObjects;
    },
    play: function() {
        if (!this.isEmpty()) {
            var playlist = this;
            var media = this.currentMedia;
            if (media.get('type') == 'audio') {
                media.play({
                    volume: (playlist.isMuted() ? 0 : playlist.currentVolumePercent),
                    onfinish: function() {
                        playlist.nextTrack(true);
                    },
                    onload: function(success) {
                        if (!success) {
                            playlist.nextTrack(true);
                        }
                    },
                    whileplaying: function() {
                        var position = this.position, seconds = position/ 1000;
                        var percent = Math
                        .min(100 * (position / this.duration), 100);
                        timeElapsed.text(secondsToString(seconds));
                        updateTimebar(percent);
                    }
                });
            }
            else if (media.get('type') == 'video') {
                if (media.get('siteName') == 'YouTube') {
                    if (media.get('interval')) {
                        window.clearInterval(media.get('interval'));
                    }
                    var clearMediaInterval = function() {
                        if (media.get('interval')) {
                            window.clearInterval(media.get('interval'));
                        }
                    };
                    media.play({
                        showControls: false,
                        autoPlay: true,
                        initialVideo: media.get('siteMediaID'),
                        loadSWFObject: false,
                        width: $("#video").width(),
                        height: $("#video").height(),
                        onStop: clearMediaInterval,
                        onPlayerBuffering: clearMediaInterval,
                        onPlayerPaused: clearMediaInterval,
                        volume: playlist.isMuted() ? 0 : playlist.getVolume(),
                        onPlayerPlaying: function() {
                            playlist.setVolume(playlist.isMuted() ? 0 : playlist.currentVolumePercent);
                            media.set('interval', window.setInterval(function() {
                                var data = $("#video").tubeplayer('data');
                                if (data && data.hasOwnProperty('currentTime') && data.hasOwnProperty('duration')) {
                                    var percent =  (data.currentTime / data.duration) * 100;
                                    timeElapsed.text(secondsToString(data.currentTime));
                                    updateTimebar(percent);
                                }
                            }, 333));
                        },
                        onPlayerEnded: function() {
                            clearMediaInterval();
                            media.stop();
                            playlist.nextTrack(true);
                        },
                        onErrorNotEmbeddable: function() {
                            playlist.nextTrack(true);
                        },
                        onErrorNotFound: function() {
                            playlist.nextTrack(true);
                        },
                        onErrorInvalidParameter: function() {
                            playlist.nextTrack(true);
                        }
                    });
                }
            }
            this.setPlayButton(false);
        }
    },
    previousTrack: function(autostart) {
        var trackInt = parseInt(this.currentTrack), next = (trackInt - 1 + this.size()) % this.size() || 0 ;
        this.goToTrack(next, autostart);
    },
    renumberTracks: function(startingIndex) {
        $(this.playlistDOM.allRowsInTable).filter(function(index) {
            return index >= startingIndex;
        }).each(function(index, element) {
            // Uses 1-indexed numbers for user
            $(element).find('span.index').html((startingIndex + index) + 1);
        });
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
            $('.playing').removeClass('playing');
            var rowDOM = this.playlistDOM.getRowForID(this.at(trackNumber).get('id'));
            $(rowDOM).addClass('playing');
            this.updateState('current', trackNumber);
            this.currentMedia = this.at(trackNumber);
        } else {
            this.currentTrack = 0;
            this.currentMedia = null;
        }
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
        this.setVolumeSymbol(setMute ? 0 : intPercent);
    },
    setVolumeSymbol: function(intPercent) {
        //Update volume bar
        var volumeBarWidth = intPercent.toString();
        $("#volume-inner").width(volumeBarWidth + "%");
        $("#volume-number").text(volumeBarWidth);
        if (intPercent >= 50) {
            $("#volume-symbol").removeClass("icon-volume-down").removeClass("icon-volume-off").addClass("icon-volume-up");
        }
        else if (intPercent > 0) {
            $("#volume-symbol").removeClass("icon-volume-up").removeClass("icon-volume-off").addClass("icon-volume-down");
        }
        else if (intPercent == 0) {
            $("#volume-symbol").removeClass("icon-volume-up").removeClass("icon-volume-down").addClass("icon-volume-off");
        }
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
    stop: function () {
        if (!this.isEmpty() || this.currentMedia) {
            this.currentMedia.stop();
            timebar.width(0);
            $('#time-elapsed').text('0:00');
            this.setPlayButton(true);
        }
    },
    sync: function(method, model, options) {
        options = options || {};
        if (method == 'create') {
            options.url = 'playlists/save';
        }
        return Backbone.sync(method, model, options).done(function(data) {
            data = data || {};
            model.trigger('sync', data);
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
                this.setVolumeSymbol(0);
            }
        }
    },
    togglePause: function() {
        this.setPlayButton(!this.isPaused());
        if (!this.isEmpty()) {
            this.currentMedia.togglePause();
        }
    },
    setPlayButton: function(on) {
        if (on) {
            $('#play').find('i').removeClass('icon-pause').addClass('icon-play');
        }
        else {
            $('#play').find('i').removeClass('icon-play').addClass('icon-pause');
        }
    },
    updateTrackEnumeration: function() {
        if (this.size() == 1 && $("#multiple-tracks").text().length) {
        	$("#multiple-tracks").empty();
        }
        else if (!$("#multiple-tracks").text().length) {
        	$("#multiple-tracks").text("s");
        }
    },
    updateState: function(key, value) {
    	this.isChangingState = true;
    	var currentState = History.getState();
    	var currentData = currentState.data;
    	if (currentData['id']) {
	    	currentData[key] = value;
	    	var title = currentState.title;
	    	var url = currentState.url;
	    	History.replaceState(currentData, title, url);
    	}
    	this.isChangingState = false;
    },
	url: function() {
		var loc = '/', id = this.id;
		if (id) {
			loc += 'playlists/' + id;
		}
		return loc;
	}
});