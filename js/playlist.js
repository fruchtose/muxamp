function Playlist(soundManager) {
    this.currentTrack = 0;
    this.list = [];
    this.soundManager = soundManager;
    
    this.addTrack = function(soundObject) {
        this.list[this.list.length] = soundObject;
        var obj = this;
        $('#playlist table tbody tr:last').after('<tr><td>' + soundObject.url + '</td><td><a class="remove" href="#remove">Remove</a></td></tr>');
        $('#playlist table tbody tr:last').addClass(soundObject.getID());
        var rowDOM = '#playlist table tbody tr.' + soundObject.getID();
        var domName = '#playlist table tbody tr.' + soundObject.getID() + ' td a.remove';
        $(domName).live('click', function() {
            obj.removeTrack(soundObject.getID());
            $(rowDOM).remove();
        });
    };
    
    this.hasNext = function() {
        return this.list.length > this.currentTrack + 1;
    }
    
    this.isEmpty = function() {
        return this.list.length == 0;
    }
    
    this.isPaused = function() {
        return this.list[this.currentTrack].getSound().paused;
    }
    
    this.isPlaying = function() {
        return this.list[this.currentTrack].getSound().playState == 1;
    }
    
    this.nextTrack = function() {
        this.soundManager.stopAll();
        this.currentTrack = this.currentTrack + 1 >= this.list.length ? 0 : this.currentTrack + 1;
        this.play();
    }
    
    this.play = function() {
        var obj = this;
        this.soundManager.play(this.list[this.currentTrack].getID(), {
            onfinish: function() {
                obj.nextTrack();
            }
        });
        return true;
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
            if (!this.hasNext()) {
                this.currentTrack = 0;
            }
            this.list[pos].getSound().destruct();
            this.list.splice(pos, 1);
            $('#play').text('Play');
        }
    }
    
    this.togglePause = function() {
        return this.list[this.currentTrack].getSound().togglePause();
    }
    
    this.stop = function () {
        for (track in this.list) {
            this.list[track].getSound().stop();
        }
    }
}
var playlist = new Playlist(soundManager);