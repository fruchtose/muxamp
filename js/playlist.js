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
    this.tracksByClass = new Object();
    this.tracksByID = new Object();
    
    this._addPlaylistDOMRow = function(soundObject) {
        var obj = this;
        var appendedHTML = this._getDOMRowForSoundObject(soundObject);
        $(this.playlistDOM.lastElementOfParent).append(appendedHTML);
        var id = soundObject.id;
        $(this.playlistDOM.getRemovalHyperlinkForID(id)).live('click', function() {
            obj.removeTrack(id);
        });
    }
    
    this._getDOMRowForSoundObject = function(soundObject) {
        return '<li class=' + soundObject.id + '>' + this._getDOMTableCellsForSoundObject(soundObject) + '</li>';
    }
    
    this._getDOMTableCellsForSoundObject = function(soundObject) {
        var extLink = '<a href="' + soundObject.permalink +'" target="_blank" class="external">' + soundObject.siteName + '</a>';
        var links = '<div class="right"><a onclick="return false;" class="remove" href>Remove</a>' + extLink + '</div>';
        return links + '<div class="desc">' +soundObject.artist + ' - ' + soundObject.soundName + '</span>';
    }
    
    this._started = false;
    
    this.addTrack = function(soundObject) {
        this.list[this.list.length] = soundObject;
        this._addPlaylistDOMRow(soundObject);
    };
    
    this.allocateNewIDs = function(count) {
        var firstNewID = this.nextNewID;
        this.nextNewID += count;
        var trackIDsLength = this.newTrackIDs.length;
        for (i = 0; i < count; i++) {
            this.newTrackIDs[trackIDsLength + i] = firstNewID + i;
        }
    }
    
    this.getNewTrackID = function() {
        var newID = this.newTrackIDs.splice(0, 1);
        newID = $.isArray(newID) ? newID[0] : newID;
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
        return this.list[this.currentTrack].getSound().paused;
    }
    
    this.isPlaying = function() {
        var status = false;
        if (!this.isEmpty()) {
            status = this.list[this.currentTrack].getSound().playState == 1;
        }
        return status;
    }
    
    this.nextTrack = function(autostart) {
        var wasPlaying = this.isPlaying();
        this.stop();
        this.currentTrack = this.currentTrack + 1 >= this.list.length ? 0 : this.currentTrack + 1;
        if (wasPlaying || autostart) {
            this.play();
        }
    }
    
    this.play = function() {
        if (!this.isEmpty()) {
            var obj = this;
            this.soundManager.play(this.list[this.currentTrack].id, {
                onfinish: function() {
                    obj.nextTrack(true);
                },
                onload: function(success) {
                    if (!success) {
                            obj.nextTrack(true);
                        }
                }
            });
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
            if (!this.hasNext()) {
                this.currentTrack = 0;
            }
            this.list[pos].getSound().destruct();
            this.list.splice(pos, 1);
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
            $(this).html(playlist._getDOMTableCellsForSoundObject(newList[index]));
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
            this.list[track].getSound().stop();
        }
        $('#play').text('Play');
    }
    
    this.togglePause = function() {
        this.list[this.currentTrack].getSound().togglePause();
        if (this.isPaused()) {
            $('#play').text('Resume');
        }
        else {
            $('#play').text('Pause');
        }
    }
}
var playlist = new Playlist(soundManager);