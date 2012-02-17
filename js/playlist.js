var PlaylistDOMInformation = function() {
    this.parentTable = "ol#tracks";
    
    this.lastElementOfParent = this.parentTable + ":last";
    
    this.lastRowInParent = this.parentTable + " li:last";
    
    this.allRowsInTable = this.parentTable + " li";
    
    this.getRowForID = function(id) {
        return this.parentTable + " li." + id;
    };
    
    this.getRemovalHyperlinkForID =  function(id) {
        var selector = this.getRowForID(id) + " " + this.removalHyperlink;
        return selector;
    };
    
    this.removalHyperlink = "a.remove";
};

function Playlist(soundManager) {
    this.currentTrack = 0;
    this.currentVolumePercent = 50; // Start at 50% so users can increase/decrease volume if they want to
    this.list = [];
    this.nextNewID = 0;
    this.newTrackIDs = [];
    this.playlistDOM = new PlaylistDOMInformation();
    this.soundManager = soundManager;
    this.totalDuration = 0; // Duration in seconds
    this.settings = {
        updateURLOnAdd: true
    };
    
    this._addPlaylistDOMRow = function(mediaObject, index) {
        var obj = this;
        var appendedHTML = this._getDOMRowForMediaObject(mediaObject, index);
        $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        var id = mediaObject.id;
        $(this.playlistDOM.getRemovalHyperlinkForID(id)).live('click', function() {
            obj.removeTrack(id);
        });
    }
    
    this._addPlaylistDOMRows = function(mediaObjects) {
        if ( !(mediaObjects instanceof Array) ) {
            mediaObjects = [mediaObjects];
        }
        var playlist = this, appendedHTML = '';
        var currentLength = $(this.playlistDOM.allRowsInTable).length;
        for (index in mediaObjects){
            var mediaObject = mediaObjects[index];
            appendedHTML += this._getDOMRowForMediaObject(mediaObject, currentLength + parseInt(index) + 1);
        }
        $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        for (index in mediaObjects){
            $(this.playlistDOM.getRowForID(mediaObjects[index].id)).dblclick(function() {
                playlist.goToTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index(), true);
            });
            $(this.playlistDOM.getRemovalHyperlinkForID(mediaObjects[index].id)).live('click', function() {
                playlist.removeTrack($($(this).closest(playlist.playlistDOM.allRowsInTable)).index());
            });
        }
    }
    
    this._getDOMRowForMediaObject = function(mediaObject, index) {
        return '<li class=' + mediaObject.id + '>' + this._getDOMTableCellsForMediaObject(mediaObject, index) + '</li>';
    }
    
    this._getDOMTableCellsForMediaObject = function(mediaObject, index) {
        var extLink = '<a href="' + mediaObject.permalink +'" target="_blank"><img src="' + mediaObject.icon + '"/></a>';
        var remove = '<div class="remove"><a href onclick="return false;" class="remove" >x</a></div>';
        var links = '<div class="link">' + extLink + '</div>';
        var left = '<div class ="left">' + remove + links + '</div>';
        return left + '<div class="desc">' + '<span class="index">' + index + "</span>. " +mediaObject.artist + ' - ' + mediaObject.mediaName + ' ' + '[' + secondsToString(mediaObject.getDuration()) + ']' + '</span>';
    }
    
    this.addTracks = function(mediaObjects, currentTrack) {
        if ( !(mediaObjects instanceof Array) ) {
            mediaObjects = [mediaObjects];
        }
        var addedDuration = 0;
        this.list = this.list.concat(mediaObjects);
        this._addPlaylistDOMRows(mediaObjects);
        for (i in mediaObjects) {
            var mediaObject = mediaObjects[i];
            addedDuration += mediaObject.getDuration()
        }
        if (this.settings.updateURLOnAdd) {
            var newHash = '', slicedList = [];
            if (mediaObjects.length > 0) {
                newHash = mediaObjects[0].siteCode + '=' + mediaObjects[0].siteMediaID;
                slicedList = mediaObjects.slice(1);
            }
            for (i in slicedList) {
                newHash += '&' + slicedList[i].siteCode + '=' + slicedList[i].siteMediaID;
            }
            if (this.list.length > 0) {
                newHash = '&' + newHash;
            }
            // Making sure user cannot create huuuuuuuge URL by default
            if (newHash.length < 2083 && window.location.hostname.length + window.location.pathname.length + newHash.length < 2083){
                window.location.hash += newHash;
            }
            else {
                alert("Your playlist URL will not be appended because it is too long.");
            }
        }
        if (currentTrack != undefined && currentTrack.toString()) {
            this.setCurrentTrack(currentTrack);
        }
        else {
            this.setCurrentTrack(this.currentTrack);
        }
        $('#track-count').text(this.list.length.toString());
        this.totalDuration += addedDuration;
        $('#playlist-duration').text(secondsToString(this.totalDuration));
        $(this.playlistDOM.parentTable).sortable('refresh');
    }
    
    this.allocateNewIDs = function(count) {
        var firstNewID = this.nextNewID;
        this.nextNewID += count;
        for (i = 0; i < count; i++) {
            this.newTrackIDs.push(firstNewID + i);
        }
    }
    
    this.getNewTrackID = function() {
        var newID = this.newTrackIDs.splice(0, 1);
        newID = ($.isArray(newID) ? newID[0] : newID).toString();
        return newID;
    }
    
    this.getVolume = function() {
        return this.currentVolumePercent;
    }
    
    this.goToTrack = function(index, autostart) {
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
    }
    
    this.hasNext = function() {
        return !this.isEmpty() && this.list.length > this.currentTrack + 1;
    }
    
    this.hasPrevious = function() {
        return !this.isEmpty() && this.currentTrack - 1 >= 0;
    }
    
    this.indexOfTrackID = function(trackID) {
        var pos = -1;
        for (track in this.list) {
            if (this.list[track].id == trackID) {
                pos = track;
                break;
            }
        }
        return pos;
    }
    
    this.isEmpty = function() {
        return this.list.length == 0;
    }
    
    this.isPaused = function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.list[this.currentTrack].isPaused();
        }
        return status;
    }
    
    // Function is asynchronous, because the response can be depending on the media
    this.isPlaying = function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.list[this.currentTrack].isPlaying() || this.list[this.currentTrack].isPaused();
        }
        return status;
    }
    
    this.moveTrack = function(originalIndex, newIndex) {
        if (!this.isEmpty() && originalIndex != newIndex) {
            if (originalIndex >= 0 && newIndex >= 0 && originalIndex < this.list.length && newIndex < this.list.length) {
                var mediaObject = this.list.splice(originalIndex, 1)[0];
                this.list.splice(newIndex, 0, mediaObject);
                if (this.currentTrack == originalIndex) {
                    this.setCurrentTrack(newIndex);
                }
                else {
                    this.setCurrentTrack(Math.max(0, $('li.playing').index()));
                }
            
                var minIndex = Math.min(originalIndex, newIndex);
                // Track numbers are now inaccurate, so they are refreshed.
                this.renumberTracks(minIndex);
            }
        }
        else {
            this.renumberTracks();
        }
        this.refreshWindowLocationHash();
    };
    
    this.nextTrack = function(autostart) {
        var trackInt = parseInt(this.currentTrack), next = trackInt + 1 >= this.list.length ? 0 : trackInt + 1;
        this.goToTrack(next, autostart);
    }
    
    this.play = function() {
        if (!this.isEmpty()) {
            var playlist = this;
            var media = this.list[this.currentTrack];
            if (media.type == 'audio') {
                media.play({
                    volume: playlist.currentVolumePercent,
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
                        width: 399,
                        height: 256,
                        onStop: clearMediaInterval,
                        onPlayerUnstarted: function() {
                            playlist.setVolume(playlist.currentVolumePercent);
                        },
                        onPlayerCued: function() {
                            playlist.setVolume(playlist.currentVolumePercent);
                        },
                        onPlayerBuffering: clearMediaInterval,
                        onPlayerPaused: clearMediaInterval,
                        onPlayerPlaying: function() {
                            playlist.setVolume(playlist.currentVolumePercent);
                            media.interval = window.setInterval(function() {
                                var data = $("#video").tubeplayer('data');
                                var percent =  (data.currentTime / data.duration) * 100;
                                timeElapsed.text(secondsToString(data.currentTime));
                                updateTimebar(percent);
                            }, 334);
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
            $('#play').css("background-image", 'url("img/pause.png")');
            $('#play:active').css("background-image", 'url("img/pause-hi.png)');
        }
    }
    
    this.previousTrack = function(autostart) {
        var trackInt = parseInt(this.currentTrack), next = trackInt - 1 >= 0 ? trackInt - 1 : (this.isEmpty() ? 0 : this.list.length - 1);
        this.goToTrack(next, autostart);
    }
    
    this.refreshWindowLocationHash = function() {
        var newHash = '', slicedList = [];
        if (!this.isEmpty()) {
            newHash = this.list[0].siteCode + '=' + this.list[0].siteMediaID;
            slicedList = this.list.slice(1);
        }
        for (i in slicedList) {
            newHash += '&' + slicedList[i].siteCode + '=' + slicedList[i].siteMediaID;
        }
        // Making sure user cannot create huuuuuuuge URL by default
        if (newHash.length < 2083 && window.location.hostname.length + window.location.pathname.length + newHash.length < 2083){
            window.location.hash = newHash;
        }
        else {
            alert("Your playlist URL will not be appended because it is too long.");
        }
    }
    
    this.removeTrack = function(index) {
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
            this.refreshWindowLocationHash();
            if (index == this.currentTrack) {
                this.setCurrentTrack(Math.min(this.list.length - 1, index));
            }
            if (this.isEmpty()) {
                $('#play').css("background-image", 'url("img/play.png")');
                $('#play:active').css("background-image", 'url("img/play-hi.png")');
            }
            else {
                if (wasPlaying) {
                    this.play();
                    $('#play').css("background-image", 'url("img/pause.png")');
                    $('#play:active').css("background-image", 'url("img/pause-hi.png)');
                }
            }
            $('#track-count').text(this.list.length.toString());
            this.totalDuration -= trackDuration;
            $('#playlist-duration').text(secondsToString(this.totalDuration));
        }
    }
    
    this.renumberTracks = function(startingIndex) {
        $(this.playlistDOM.allRowsInTable).filter(function(index) {
            return index >= startingIndex;
        }).each(function(index, element) {
            // Uses 1-indexed numbers for user
            $(element).find('span.index').html((startingIndex + index) + 1);
        });
    }
    
    this.seek = function(decimalPercent) {
        if (!this.isEmpty()) {
            var track = this.list[this.currentTrack];
            track.seek(decimalPercent);
        }
    }
    
    this.setCurrentTrack = function(trackNumber) {
        this.currentTrack = trackNumber;
        if (!this.isEmpty() && trackNumber >= 0 && trackNumber < this.list.length) {
            $('.playing').removeClass('playing');
            var rowDOM = this.playlistDOM.getRowForID(this.list[this.currentTrack].id);
            $(rowDOM).addClass('playing');
        }
    }
    
    this.setVolume = function(intPercent) {
        intPercent = Math.round(intPercent);
        this.currentVolumePercent = intPercent;
        if (this.isPlaying() || this.isPaused()) {
            var media = this.list[this.currentTrack];
            if (media.type == 'audio') {
                soundManager.setVolume(media.id, intPercent);
            }
            else if (media.type == 'video') {
                if (media.siteName == 'YouTube') {
                    $('#video').tubeplayer('volume', intPercent);
                }
            }
        }
        //Update volume bar
        var volumeBarHeight = 100 - intPercent;
        $("#volume-inner").height(volumeBarHeight.toString() + "%");
        $("#volume-amount").text(intPercent + "% Volume");
    }
    
    this.shuffle = function() {
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
        this.settings.updateURLOnAdd = false;
        this.addTracks(newList, newCurrentTrack);
        this.refreshWindowLocationHash();
        this.settings.updateURLOnAdd = true;
        for (i in newList) {
            if (this.list[i].siteMediaID == currentSiteMediaID) {
                this.setCurrentTrack(parseInt(i));
                break;
            }
        }
    }
    
    this.stop = function () {
        this.list[this.currentTrack].stop();
        timebar.width(0);
        $('#time-elapsed').text('0:00');
        $('#play').css("background-image", 'url("img/play.png")');
        $('#play:active').css("background-image", 'url("img/play-hi.png")');
    }
    
    this.togglePause = function() {
        if (this.isPaused()) {
            $('#play').css("background-image", 'url("img/pause.png")');
            $('#play:active').css("background-image", 'url("img/pause-hi.png)');
        }
        else {
            $('#play').css("background-image", 'url("img/play.png")');
            $('#play:active').css("background-image", 'url("img/play-hi.png")');
        }
        this.list[this.currentTrack].togglePause();
    }
    
    this.updateSettings = function(options) {
        if (options) {
            this.settings = $.extend({}, this.settings, options);
        }
    }
}
var playlist = new Playlist(soundManager);
$(document).ready(function() {
    var startPos;
    $(playlist.playlistDOM.parentTable).sortable({
        axis: 'y',
        containment: '#main',
        start: function(event, ui) {
            startPos = $(event.target).parent('li').index();
        },
        tolerance: 'pointer',
        update: function(event, ui) {
            var pos = Math.max(0, Math.min(playlist.list.length - 1, $(event.target).parent('li').index()));
            playlist.moveTrack(startPos, pos);
        }
    });
});