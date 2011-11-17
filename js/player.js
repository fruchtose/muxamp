var SoundObject = new JS.Class({
    initialize: function(urlArg, id, soundManagerArg) {
        this.id = id;
        this.url = urlArg;
        this.soundManager = soundManagerArg;
    },
    
    getSound: function() {
        return 'I don\'t have a sound!';
    },
    
    getID: function() {
        return this.id;
    }
});

var SoundCloudObject = new JS.Class(SoundObject, {
    initialize: function(urlArg, consumerKeyArg, trackArg, soundManagerArg) {
        var trackID = 'soundcloud_' + trackArg.id;
        this.callSuper(urlArg, trackID, soundManagerArg);
        var apiURL = urlArg;
        (apiURL.toString().indexOf("secret_token") == -1) ? apiURL = apiURL + '?' : apiURL = apiURL + '&';
        apiURL = apiURL + 'consumer_key=' + consumerKeyArg;
        this.url = apiURL;
        this.sound = soundManagerArg.createSound({
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