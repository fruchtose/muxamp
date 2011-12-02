var SoundObject = new JS.Class({
    initialize: function(siteName, url, permalink, clazz, id, soundManager, artist, soundName) {
        this.clazz = clazz;
        this.id = id;
        this.permalink = permalink != "" ? permalink : "";
        this.url = url;
        this.soundManager = soundManager;
        this.artist = artist != "" ? artist : "";
        this.siteName = siteName != "" ? siteName : "";
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
    initialize: function(id, url, consumerKey, track, soundManager) {
        var trackClass = 'soundcloud_' + track.id;
        this.callSuper("SoundCloud", url, track.permalink_url, trackClass, id, soundManager, track.user.username, track.title);
        var apiURL = url;
        (apiURL.toString().indexOf("secret_token") == -1) ? apiURL = apiURL + '?' : apiURL = apiURL + '&';
        apiURL = apiURL + 'consumer_key=' + consumerKey;
        this.url = apiURL;
        this.sound = soundManager.createSound({
            id: id,
            url: this.url				
        });
        this.isPaused = false;
    },

    getSound: function() {
        return this.sound;
    }
});

var BandcampObject = new JS.Class(SoundObject, {
    initialize: function(id, linkURL, consumerKey, track, artistName, soundManager) {
        var trackClass = 'bandcamp_' + track.track_id;
        this.callSuper("Bandcamp", track.streaming_url, linkURL, trackClass, id, soundManager, artistName, track.title);
        var apiURL = track.streaming_url;
        apiURL = apiURL + '&api_key=' + consumerKey;
        this.url = apiURL;
        this.sound = soundManager.createSound({
            id: id,
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