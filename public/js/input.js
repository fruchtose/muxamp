var counter = (function() {
	var val = 1;
	return function() {
		return val++;
	};
})();

var getMediaObject = function(searchResult) {
    var mediaObject = null;
    var id = counter();
    switch (searchResult.siteName) {
        case 'SoundCloud':
            mediaObject = new SoundCloudObject(id, searchResult.siteMediaID, searchResult.url, searchResult.permalink, searchResult.artist, searchResult.mediaName, searchResult.duration, soundManager);
            break;
        case 'YouTube':
            mediaObject = new YouTubeObject(id, searchResult.siteMediaID, searchResult.artist, searchResult.mediaName, searchResult.duration);
            break;
    }
    return mediaObject;
};

var addHashParam = function(key, value) {
    var currentHash = window.location.hash;
    if (!currentHash.length) {
        return key + "=" + value;
    }
    else return currentHash + "&" + key + "=" + value;
}

var fetchTracksFromString = function(str) {
	var queryLink = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'fetch?' + str;
    return $.ajax({
    	url: queryLink,
    	dataType: 'json'
    }).done(function(searchResults) {
    	if (searchResults.length) {
    		var i, mediaObjects = [];
    		for (i in searchResults) {
    			var mediaObject = getMediaObject(searchResults[i]);
    			if (mediaObject) {
    				mediaObjects.push(mediaObject);
    			}
    		}
    		if (mediaObjects.length) {
    			playlist.addTracks(mediaObjects);
    		}
    	}
    });
}

var loadFunction = function() {
    //var urlParams = getURLParams(window.location.hash, true);
    //var inputCount = urlParams.length;
    if (window.location.hash.length) {
        playlist.updateSettings({
            updateURLOnAdd: false
        });
        /*var inputResources = [];
        for (var param in urlParams) {
            var keyValuePair = urlParams[param];
            inputResources.push(keyValuePair);
        }
        playlist.addResourceAndWaitUntilLoaded(inputResources).always(function() {
            playlist.updateSettings({
                updateURLOnAdd: true
            });
        });*/
        fetchTracksFromString(window.location.hash.substring(1)).always(function() {
        	playlist.updateSettings({
                updateURLOnAdd: true
            });
        	$.unblockUI();
        });
    }
    else {
        $.unblockUI();
    }
};

$(document).ready(function() {
    $.blockUI();
    soundManager.onready(loadFunction);
});