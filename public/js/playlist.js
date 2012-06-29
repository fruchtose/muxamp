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

function Playlist(soundManager) {
    this.currentTrack = 0;
    this.currentVolumePercent = 50; // Start at 50% so users can increase/decrease volume if they want to
    this.list = [];
    this.locationUpdatesWaiting = 0;
    this.playlistDOM = new PlaylistDOMInformation();
    this.settings = {
    	updateLocationOnAdd: true
    };
    this.soundManager = soundManager;
    this.totalDuration = 0; // Duration in seconds
}

Playlist.prototype = {
    _addPlaylistDOMRow: function(mediaObject, index) {
        var obj = this;
        var appendedHTML = this._getDOMRowForMediaObject(mediaObject, index);
        $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        var id = mediaObject.id;
        $(this.playlistDOM.getActionForID(id, 'remove')).live('click', function() {
            obj.removeTrack(id);
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
        	var row = $(this.playlistDOM.getRowForID(mediaObjects[index].id));
            row.find(this.playlistDOM.trackName).width(row.find(this.playlistDOM.content).width() - row.find(this.playlistDOM.trackDurationBox).width());
        	row.dblclick(function() {
                playlist.goToTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index(), true);
            });
            $(this.playlistDOM.getActionForID(mediaObjects[index].id, 'remove')).live('click', function() {
                playlist.removeTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index());
            });
            $(this.playlistDOM.getActionForID(mediaObjects[index].id, 'play')).live('click', function() {
                playlist.goToTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index(), true);
            });
        }
    },
    _getDOMRowForMediaObject: function(mediaObject, index) {
        return '<tr class=' + mediaObject.id + '>' + this._getDOMTableCellsForMediaObject(mediaObject, index) + '</tr>';
    },
    _getDOMTableCellsForMediaObject: function(mediaObject, index) {
    	var remove = '<a href onclick="return false;" class="btn action remove"><i class="icon-remove""></i></a>';
    	var play = '<a href onclick="return false;" class="btn action play"><i class="icon-play"></i></a>';
    	var actions = '<div class="actions">' + remove + play + '</div>';
    	var actionsCell = '<td class="action-cell">' + actions + '</td>';
    	var uploader = '<td class="uploader-cell" ' + getAttribute('title', mediaObject.artist) + '>' + mediaObject.artist + '</td>';
    	var title = '<td class="title-cell" ' + getAttribute('title', mediaObject.mediaName) + '>' + mediaObject.mediaName + '</td>';
    	var seconds = secondsToString(mediaObject.duration);
    	var duration = '<td class="duration-cell" ' + getAttribute('title', seconds) + '>' + seconds + '</td>';
    	var link = '<td class="link-cell"><a href="' + mediaObject.permalink + '"><img src="' + mediaObject.icon + '" /></a></td>';
    	return actionsCell + uploader + title + duration + link;
    	//var remove = '<a href onclick="return false;" class="action remove close">&times;</a>';
    	/*var remove = '<a href onclick="return false;" class="btn action remove"><i class="icon-remove""></i></a>';
    	var extLink = '<a href="' + mediaObject.permalink +'" target="_blank"><img src="' + mediaObject.icon + '"/></a>';
        var links = '<div class="thin-button link">' + extLink + '</div>';
        var left = '<div class ="left">' + links + '</div>';
        var trackInfo = '<div class="track"><div class="name">' + mediaObject.mediaName + '</div>' + '<div class="dur-box">[<span class="duration">' + secondsToString(mediaObject.duration) + '</span>]</div></div>' + '<div class="artist">' + mediaObject.artist + '</div>';
        return '<div class="actions">' + remove + '</div><div class=content>' + trackInfo + '</div>';*/
    },
    addTracks: function(mediaObjects, currentTrack, insertLocation) {
        if ( !(mediaObjects instanceof Array) ) {
            mediaObjects = [mediaObjects];
        }
        var addedDuration = 0;
        if ($.isNumeric(insertLocation)) {
            this.list = this.list.slice(0, insertLocation + 1).concat(mediaObjects).concat(this.list.slice(insertLocation + 1));
        }
        else {
            this.list = this.list.concat(mediaObjects);
        }
        this._addPlaylistDOMRows(mediaObjects, insertLocation);
        for (var i in mediaObjects) {
            var mediaObject = mediaObjects[i];
            addedDuration += mediaObject.getDuration();
        }
        if (this.getSetting('updateLocationOnAdd')) {
        	this.setWindowLocation();
        }
        if ($.isNumeric(currentTrack)) {
            this.setCurrentTrack(currentTrack);
        }
        else {
            this.setCurrentTrack(this.currentTrack);
        }
        $('#track-count').text(this.list.length.toString());
        this.totalDuration += addedDuration;
        $('#playlist-duration').text(secondsToString(this.totalDuration));
        $(this.playlistDOM.parentTable).sortable('refresh');
        this.updateTrackEnumeration();
    },
    clear: function() {
        if (!this.isEmpty()) {
            this.stop();
            var media = this.list[this.currentTrack];
            if (media.type == "video") {
                clearVideo();
            }
            this.list = [];
            $(this.playlistDOM.allRowsInTable).remove();
            this.setWindowLocation();
            this.setCurrentTrack(0);
            this.setPlayButton(this.isEmpty());
            $('#track-count').text(this.list.length.toString());
            this.totalDuration = 0;
            $('#playlist-duration').text(secondsToString(this.totalDuration));
            this.updateTrackEnumeration();
            
        }
    },
    getID: function() {
    	var hash = this.getHash();
    	var result = $.Deferred();
    	if (!hash.length) {
    		result.reject();
    	}
    	else {
    		var queryLink = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'fetchid';
    		$.ajax({
    			url: queryLink,
        	dataType: 'json',
        	type: 'POST',
        	data: {query: hash}
    		}).done(function(data) {
    			if (data.id) {
    				result.resolve(data.id);
    			}
    			else {
    				result.reject();
    			}
    		});
    	}
    	return result.promise();
    },
    getHash: function() {
        var newHash = '', slicedList = [];
        if (!this.isEmpty()) {
            newHash = this.list[0].siteCode + '=' + this.list[0].siteMediaID;
            slicedList = this.list.slice(1);
        }
        for (var i in slicedList) {
            newHash += '&' + slicedList[i].siteCode + '=' + slicedList[i].siteMediaID;
        }
        return newHash;
    },
    getSetting: function(option) {
    	return this.settings[option];
    },
    getVolume: function() {
        return this.currentVolumePercent;
    },
    goToTrack: function(index, autostart) {
        var wasPlaying = this.isPlaying();
        this.stop();
        var media = this.list[this.currentTrack];
        if (media.type == "video") {
            clearVideo();
        }
        this.setCurrentTrack(parseInt(index));
        if (wasPlaying || autostart) {
            this.play();
        }
    },
    hasNext: function() {
        return !this.isEmpty() && this.list.length > this.currentTrack + 1;
    },
    hasPrevious: function() {
        return !this.isEmpty() && this.currentTrack - 1 >= 0;
    },
    indexOfTrackID: function(trackID) {
        var pos = -1;
        for (track in this.list) {
            if (this.list[track].id == trackID) {
                pos = track;
                break;
            }
        }
        return pos;
    },
    isEmpty: function() {
        return this.list.length == 0;
    },
    isMuted: function() {
        var result = false;
        if (!this.isEmpty()) {
            result = this.list[this.currentTrack].isMuted();
        }
        return result;
    },
    isPaused: function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.list[this.currentTrack].isPaused();
        }
        return status;
    },
    // Function is asynchronous, because the response can be depending on the media
    isPlaying: function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.list[this.currentTrack].isPlaying() || this.list[this.currentTrack].isPaused();
        }
        return status;
    },
    moveTrack: function(originalIndex, newIndex) {
        if (!this.isEmpty() && originalIndex != newIndex) {
            if (originalIndex >= 0 && newIndex >= 0 && originalIndex < this.list.length && newIndex < this.list.length) {
                var mediaObject = this.list.splice(originalIndex, 1)[0];
                this.list.splice(newIndex, 0, mediaObject);
                if (this.currentTrack == originalIndex) {
                    this.setCurrentTrack(newIndex);
                }
                else {
                    this.setCurrentTrack(Math.max(0, $(this.playlistDOM.allRowsInTable +'.playing').index()));
                }
            
                var minIndex = Math.min(originalIndex, newIndex);
                // Track numbers are now inaccurate, so they are refreshed.
                this.renumberTracks(minIndex);
            }
        }
        else {
            this.renumberTracks();
        }
        this.setWindowLocation();
    },
    nextTrack: function(autostart) {
        var trackInt = parseInt(this.currentTrack), next = trackInt + 1 >= this.list.length ? 0 : trackInt + 1;
        this.goToTrack(next, autostart);
    },
    play: function() {
        if (!this.isEmpty()) {
            var playlist = this;
            var media = this.list[this.currentTrack];
            if (media.type == 'audio') {
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
                        var percent = Math.min(100 * (position / this.duration), 100);
                        timeElapsed.text(secondsToString(seconds));
                        updateTimebar(percent);
                    }
                });
            }
            else if (media.type == 'video') {
                if (media.siteName == 'YouTube') {
                    if (media.interval != undefined) {
                        window.clearInterval(media.interval);
                    }
                    var clearMediaInterval = function() {
                        if (media.interval != undefined) {
                            window.clearInterval(media.interval);
                        }
                    };
                    media.play({
                        showControls: false,
                        autoPlay: true,
                        initialVideo: media.siteMediaID,
                        loadSWFObject: false,
                        width: $("#video").width(),
                        height: $("#video").height(),
                        onStop: clearMediaInterval,
                        onPlayerBuffering: clearMediaInterval,
                        onPlayerPaused: clearMediaInterval,
                        volume: playlist.isMuted() ? 0 : playlist.getVolume(),
                        onPlayerPlaying: function() {
                            playlist.setVolume(playlist.isMuted() ? 0 : playlist.currentVolumePercent);
                            media.interval = window.setInterval(function() {
                                var data = $("#video").tubeplayer('data');
                                if (data && data.hasOwnProperty('currentTime') && data.hasOwnProperty('duration')) {
                                    var percent =  (data.currentTime / data.duration) * 100;
                                    timeElapsed.text(secondsToString(data.currentTime));
                                    updateTimebar(percent);
                                }
                            }, 333);
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
        var trackInt = parseInt(this.currentTrack), next = trackInt - 1 >= 0 ? trackInt - 1 : (this.isEmpty() ? 0 : this.list.length - 1);
        this.goToTrack(next, autostart);
    },
    removeTrack: function(index) {
        if (index >= 0) {
            var wasPlaying = this.isPlaying() && index == this.currentTrack;
            if (wasPlaying){
                this.stop();
            }
            
            var trackDuration = this.list[index].getDuration();
            this.list[index].destruct();
            this.list.splice(index, 1);
            
            $($(this.playlistDOM.allRowsInTable).get(index)).remove();
            this.renumberTracks(Math.max(0, Math.min(this.list.length - 1, index)));
            this.setWindowLocation();
            if (index == this.currentTrack) {
                this.setCurrentTrack(Math.min(this.list.length - 1, index));
            }
            if (!this.isEmpty() && wasPlaying) {
                this.play();
            }
            this.setPlayButton(this.isEmpty());
            $('#track-count').text(this.list.length.toString());
            this.totalDuration -= trackDuration;
            $('#playlist-duration').text(secondsToString(this.totalDuration));
            this.updateTrackEnumeration();
            
        }
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
            var track = this.list[this.currentTrack];
            track.seek(decimalPercent);
        }
    },
    setCurrentTrack: function(trackNumber) {
        this.currentTrack = trackNumber;
        if (!this.isEmpty() && trackNumber >= 0 && trackNumber < this.list.length) {
            $('.playing').removeClass('playing');
            var rowDOM = this.playlistDOM.getRowForID(this.list[this.currentTrack].id);
            $(rowDOM).addClass('playing');
        }
    },
    setMute: function(mute) {
        if (!this.isEmpty()) {
            this.list[this.currentTrack].setMute(mute);
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
            var media = this.list[this.currentTrack];
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
    setWindowLocation: function() {
    	var playlist = this, currentHash = this.getHash();
    	var updateID = function() {
    		var idGetter = playlist.getID();
	    	idGetter.done(function(id) {
	    		History.pushState({id: id}, "Muxamp", id);
	    		this.locationUpdatesWaiting--;
	    	});
    	};
    	var waitToUpdate = 0;
    	if (this.locationUpdatesWaiting > 0) {
    		waitToUpdate = 450;
    	}
    	setTimeout(function() {
    		var nowHash = playlist.getHash();
    		if (currentHash == nowHash) {
    			updateID();
	    	}
    	}, waitToUpdate);
    	this.locationUpdatesWaiting++;
    },
    shuffle: function() {
        if (this.isEmpty()) {
            return false;
        }
        
        // Fisher-Yates shuffle implementation by Cristoph (http://stackoverflow.com/users/48015/christoph),
        // some changes by me
        var currentSiteMediaID = this.list[this.currentTrack].siteMediaID;
        var newCurrentTrack = this.currentTrack, arrayShuffle = function(array) {
            var tmp, current, top = array.length;

            if(top) while(--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }

            return array;
        }
        
        var newList = this.list.slice(0);
        newList = arrayShuffle(newList);
        // Rewrites the DOM for the new playlist
        this.totalDuration = 0;
        $(this.playlistDOM.parentTable).html('');
        this.list = [];
        this.addTracks(newList, newCurrentTrack);
        this.setWindowLocation();
        for (i in newList) {
            if (this.list[i].siteMediaID == currentSiteMediaID) {
                this.setCurrentTrack(parseInt(i));
                break;
            }
        }
        
    },
    stop: function () {
        if (!this.isEmpty()) {
            this.list[this.currentTrack].stop();
            timebar.width(0);
            $('#time-elapsed').text('0:00');
            this.setPlayButton(true);
        }
    },
    toggleMute: function() {
        if (!this.isEmpty()) {
            var shouldUnmute = this.list[this.currentTrack].isMuted();
            this.list[this.currentTrack].toggleMute();
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
        this.list[this.currentTrack].togglePause();
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
        if (this.list.length == 1 && $("#multiple-tracks").text().length) {
        	$("#multiple-tracks").empty();
        }
        else if (!$("#multiple-tracks").text().length) {
        	$("#multiple-tracks").text("s");
        }
    }
};
var playlist = new Playlist(soundManager);
$(document).ready(function() {
    var startPos;
    $(playlist.playlistDOM.parentTable).sortable({
        axis: 'y',
        containment: 'document',
        helper: function(event, ui) {
    		var children = ui.children();
    		var helper = ui.clone();
    		helper.children().each(function(index) {
    			$(this).width(children.eq(index).width());
    		});
    		return helper;
    	},
        start: function(event, ui) {
            startPos = $(event.target).parent(playlist.playlistDOM.allRowsInTable).index();
        },
        tolerance: 'pointer',
        stop: function(event, ui) {
            var pos = ui.item.index();
            playlist.moveTrack(startPos, pos);
        }
    });
});