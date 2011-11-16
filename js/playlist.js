function Playlist(soundManager) {
    this.currentTrack = 0;
    this.list = [];
    this.soundManager = soundManager;
    
    this.addTrack = function(soundObject) {
        this.list[this.list.length] = soundObject;
        $('#playlist table tbody tr:last').after('<tr><td>' + soundObject.url + '</td></tr>');
    };
    
    this.isPlaying = function() {
        return this.list[this.currentTrack].getSound().playState == 1;
    }
    
    this.pause = function() {
        return this.list[this.currentTrack].getSound().pause();
    }
    
    this.play = function() {
        var nextTrack = this.currentTrack + 1 >= this.list.length ? 0 : this.currentTrack + 1;
        this.soundManager.play(this.list[this.currentTrack].getID(), {
            onfinish: function() {
                alert("Next track!");
                this.currentTrack = nextTrack;
                this.play();
            }
        });
    }
    
    this.resume = function() {
        return this.list[this.currentTrack].getSound().resume();
    }
    
    this.stop = function ()
    {
        for (track in this.list)
        {
            this.list[track].getSound().stop();
        }
    }
}
var playlist = new Playlist(soundManager);