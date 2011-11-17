var SoundObject = new JS.Class({
    initialize: function(url, id, soundManager, artist, soundName) {
        this.id = id;
        this.url = url;
        this.soundManager = soundManager;
        this.artist = artist != "" ? artist : "";
        this.soundName = soundName != "" ? soundName : "";
    },
    
    getArtist: function() {
        return this.artist;
    },
    
    getSound: function() {
        return 'I don\'t have a sound!';
    },
    
    getSoundName: function() {
        return this.soundName;
    },
    
    getID: function() {
        return this.id;
    }
});

var SoundCloudObject = new JS.Class(SoundObject, {
    initialize: function(url, consumerKey, track, soundManager) {
        var trackID = 'soundcloud_' + track.id;
        this.callSuper(url, trackID, soundManager, track.user.username, track.title);
        var apiURL = url;
        (apiURL.toString().indexOf("secret_token") == -1) ? apiURL = apiURL + '?' : apiURL = apiURL + '&';
        apiURL = apiURL + 'consumer_key=' + consumerKey;
        this.url = apiURL;
        this.sound = soundManager.createSound({
            id: trackID,
            url: this.url				
        });
        this.isPaused = false;
    },

    getSound: function() {
        return this.sound;
    }
});
/*var SoundObject = function(url, soundManager, player) {
    this.url = url != "" ? url : "";
    
    this.play = function(player) {
        player(url, soundManager);
    };
    alert("Hi");
};
SoundObject.prototype.constructor = SoundObject;

var SoundCloudObject = function(url, SoundManager) {
    alert("Hi 2");
};
SoundCloudObject.prototype = new SoundObject(url, SoundManager, function(url, soundManager){});
SoundCloudObject.constructor = SoundCloudObject;
 */