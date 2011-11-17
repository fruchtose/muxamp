function Playlist(soundManager) {
    this.currentTrack = 0;
    this.list = [];
    this.soundManager = soundManager;
    
    this.addTrack = function(soundObject) {
        this.list[this.list.length] = soundObject;
        var obj = this;
        $('#playlist table tbody:last').append('<tr id=' + soundObject.getID() + '><td>' + soundObject.artist + ' - ' + soundObject.soundName + '</td><td><a onclick="return false;" class="remove" href>Remove</a></td></tr>');
        $('#playlist table tbody tr:last').css('font-weight', 'normal');
        var rowDOM = '#playlist table tbody tr#' + soundObject.getID();
        var domName = '#playlist table tbody tr#' + soundObject.getID() + ' td a.remove';
        $(domName).live('click', function() {
            obj.removeTrack(soundObject.getID());
            $(rowDOM).remove();
        });
    };
    
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
            this.soundManager.play(this.list[this.currentTrack].getID(), {
                onfinish: function() {
                    obj.nextTrack(true);
                }
            });
            $('#play').text('Pause');
            var rowDOM = '#playlist table tbody tr#' + this.list[this.currentTrack].getID();
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
            if (this.list[track].getID() == track_id) {
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
            
        }
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
    
    this.stop = function () {
        for (track in this.list) {
            this.list[track].getSound().stop();
        }
        var rowDOM = '#playlist table tbody tr#' + this.list[this.currentTrack].getID();
        $(rowDOM).removeClass('playing');
        $('#play').text('Play');
    }
}
var playlist = new Playlist(soundManager);