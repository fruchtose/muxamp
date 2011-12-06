var PlaylistDOMInformation = function() {
    this.parentTable = "ol#tracks";
    
    this.lastElementOfParent = this.parentTable + ":last";
    
    this.lastRowInParent = this.parentTable + " li:last";
    
    this.allRowsInTable = this.parentTable + " li";
    
    this.getRowForID = function(id) {
        return this.parentTable + " li." + id;
    };
    
    this.getRemovalHyperlinkForID =  function(id) {
        var selector = this.getRowForID(id) + " a.remove";
        return selector;
    };
};

function Playlist(soundManager) {
    this.currentTrack = 0;
    this.list = [];
    this.nextNewID = 0;
    this.newTrackIDs = [];
    this.playlistDOM = new PlaylistDOMInformation();
    this.soundManager = soundManager;
    this.totalDuration = 0; // Duration in seconds
    this.tracksByClass = new Object();
    this.tracksByID = new Object();
    
    this._addPlaylistDOMRow = function(mediaObject, index) {
        var obj = this;
        var appendedHTML = this._getDOMRowForMediaObject(mediaObject, index);
        $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        var id = mediaObject.id;
        $(this.playlistDOM.getRemovalHyperlinkForID(id)).live('click', function() {
            obj.removeTrack(id);
        });
    }
    
    this._getDOMRowForMediaObject = function(mediaObject, index) {
        return '<li class=' + mediaObject.id + '>' + this._getDOMTableCellsForMediaObject(mediaObject, index) + '</li>';
    }
    
    this._getDOMTableCellsForMediaObject = function(mediaObject, index) {
        var extLink = '<a href="' + mediaObject.permalink +'" target="_blank" class="external">' + mediaObject.siteName + '</a>';
        var links = '<div class="right"><a onclick="return false;" class="remove" href>Remove</a>' + extLink + '</div>';
        return links + '<div class="desc">' + index + ". " +mediaObject.artist + ' - ' + mediaObject.mediaName + ' ' + '[' + secondsToString(mediaObject.getDuration()) + ']' + '</span>';
    }
    
    this._started = false;
    
    this.addTrack = function(mediaObject) {
        var index = this.list.length;
        var trackNumber = index + 1;
        this.list[index] = mediaObject;
        this.totalDuration += mediaObject.getDuration();
        this._addPlaylistDOMRow(mediaObject, trackNumber);
        $('#track-count').text(trackNumber.toString());
        $('#playlist-duration').text(secondsToString(this.totalDuration));
    };
    
    this.allocateNewIDs = function(count) {
        var firstNewID = this.nextNewID;
        this.nextNewID += count;
        var trackIDsLength = this.newTrackIDs.length;
        var i = 0;
        for (i = 0; i < count; i++) {
            this.newTrackIDs[trackIDsLength + i] = firstNewID + i;
        }
    }
    
    this.getNewTrackID = function() {
        var newID = this.newTrackIDs.splice(0, 1);
        newID = ($.isArray(newID) ? newID[0] : newID).toString();
        return newID;
    }
    
    this.hasNext = function() {
        return !this.isEmpty() && this.list.length > this.currentTrack + 1;
    }
    
    this.hasPrevious = function() {
        return !this.isEmpty() && this.currentTrack - 1 >= 0;
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
    
    this.nextTrack = function(autostart) {
        var wasPlaying = this.isPlaying();
        this.stop();
        var media = this.list[this.currentTrack];
        if (media.type == "video") {
            media.destruct();
        }
        this.currentTrack = this.currentTrack + 1 >= this.list.length ? 0 : this.currentTrack + 1;
        if (wasPlaying || autostart) {
            this.play();
        }
    }
    
    this.play = function() {
        if (!this.isEmpty()) {
            var playlist = this;
            var media = this.list[this.currentTrack];
            if (media.type == 'audio') {
                media.play({
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
                        timeElapsed.text(secondsToString(seconds));
                        var percent = Math.min(100 * (position / this.duration), 100);
                        updateTimebar(percent);
                    }
                });
            }
            else if (media.type == 'video') {
                if (media.siteName == 'YouTube') {
                    media.play({
                        autoPlay: true,
                        initialVideo: media.id,
                        loadSWFObject: false,
                        width: 400,
                        height: 255,
                        onPlayerEnded: function() {
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
            this._started = true;
            $('#play').text('Pause');
            $('.playing').removeClass('playing');
            var rowDOM = this.playlistDOM.getRowForID(this.list[this.currentTrack].id);
            $(rowDOM).addClass('playing');
        }
    }
    
    this.previousTrack = function(autostart) {
        var wasPlaying = this.isPlaying();
        this.stop();
        var media = this.list[this.currentTrack];
        if (media.type == "video") {
            media.destruct();
        }
        this.currentTrack = this.currentTrack - 1 >= 0 ? this.currentTrack - 1 : (this.isEmpty() ? 0 : this.list.length - 1);
        if (wasPlaying || autostart) {
            this.play();
        }
    }
    
    this.removeTrack = function(track_id) {
        var pos = -1;
        for (track in this.list) {
            if (this.list[track].id == track_id) {
                pos = track;
                break;
            }
        }
        if (pos >= 0) {
            var wasPlaying = this.isPlaying() && pos == this.currentTrack;
            if (wasPlaying){
                this.stop();
            }
            if (!this.hasNext()) {
                this.currentTrack = 0;
            }
            var trackDuration = this.list[pos].getDuration();
            this.list[pos].destruct();
            this.list.splice(pos, 1);
            this.totalDuration -= trackDuration;
            if (this.isEmpty()) {
                $('#play').text('Play');
            }
            else {
                if (wasPlaying) {
                    this.play();
                    $('#play').text('Pause');
                }
            }
            var rowDOM = this.playlistDOM.getRowForID(track_id);
            $(rowDOM).remove();
            $('#track-count').text(this.list.length.toString());
            $('#playlist-duration').text(secondsToString(this.totalDuration));
        }
    }
    
    this.seek = function(decimalPercent) {
        if (!this.isEmpty()) {
            var track = this.list[this.currentTrack];
            track.seek(decimalPercent);
        }
    }
    
    this.shuffle = function() {
        if (this.isEmpty()) {
            return;
        }
        var listNumbers = [];
        for (track in this.list) {
            listNumbers[track] = track;
        }
        var newList = [];
        var newCurrentTrack = 0;
        while (listNumbers.length > 0) {
            var nextTrack = listNumbers[Math.floor(Math.random()*listNumbers.length)];
            listNumbers.splice(listNumbers.indexOf(nextTrack), 1);
            newList[newList.length] = this.list[nextTrack];
            if (nextTrack == this.currentTrack) {
                newCurrentTrack = newList.length - 1;
            }
        }
        var wasPlaying = this.isPlaying();
        if (this._started == true) {
            this.currentTrack = newCurrentTrack;
        }
        this.list = newList;
        var playlist = this;
        $(this.playlistDOM.allRowsInTable).attr("class", function(index) {
            return newList[index].id;
        }).each(function(index) {
            if (index == newCurrentTrack && wasPlaying) {
                $(this).addClass('playing');
            }
            $(this).html(playlist._getDOMTableCellsForMediaObject(newList[index], index + 1));
        });
    /*.each(function() {
            playlist.removeTrack(playlist.list[0].id);
        });*/
        
    /*for (index in this.list){
            this._addPlaylistDOMRow(this.list[index]);
        }*/
    }
    
    this.stop = function () {
        for (track in this.list) {
            this.list[track].stop();
        }
        timebar.width(0);
        $('#time-elapsed').text('0:00');
        $('#play').text('Play');
    }
    
    this.togglePause = function() {
        if (this.isPaused()) {
            $('#play').text('Pause');
        }
        else {
            $('#play').text('Resume');
        }
        this.list[this.currentTrack].togglePause();
    }
}
var playlist = new Playlist(soundManager);