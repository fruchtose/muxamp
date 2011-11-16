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
        var obj = this;
        this.soundManager.play(this.list[this.currentTrack].getID(), {
            onfinish: function() {
                alert("Next track!");
                obj.currentTrack = obj.currentTrack + 1 >= obj.list.length ? 0 : obj.currentTrack + 1;
                obj.play();
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