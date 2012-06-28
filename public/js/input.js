var counter = (function() {
	var val = 1;
	return function() {
		return val++;
	};
})();

var getWindowLocation = (function() {
	if ($.isFunction(history.pushState)) {
		return function() {
			if (window.location.pathname.length) {
				return window.location.pathname.substring(1);
			}
			else {
				return window.location.hash.substring(1);
			}
		}
	}
	else {
		return function() {
			return window.location.hash.substring(1);
		};
	}
})();

var getMediaObject = function(searchResult) {
    var mediaObject = null;
    if (searchResult) {
	    var id = counter();
	    switch (searchResult.siteCode) {
	        case 'sct':
	            mediaObject = new SoundCloudObject(id, searchResult.siteMediaID, searchResult.url, searchResult.permalink, searchResult.author, searchResult.mediaName, searchResult.duration, soundManager);
	            break;
	        case 'ytv':
	            mediaObject = new YouTubeObject(id, searchResult.siteMediaID, searchResult.author, searchResult.mediaName, searchResult.duration);
	            break;
	    }
    }
    return mediaObject;
};

var fetchTracksFromString = function(str) {
	var queryLink = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'fetchplaylist';
    return $.ajax({
    	url: queryLink,
    	dataType: 'json',
    	type: 'POST',
    	data: {query: str}
    }).done(function(data) {
    	if (!data.id) {
    		History.pushState({id: null}, "Muxamp", "");
    	}
    	var searchResults = data.results;
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
    		else {
    			alertError("Unable to load playlist", "The tracks you want to load " +
    				"are invalid, or you are unable to connect to the Internet. " + 
    				"Please address these issues and try again.");
    		}
    	}
    });
}

var loadFunction = function() {
    //var urlParams = getURLParams(window.location.hash, true);
    //var inputCount = urlParams.length;
	var loc = getWindowLocation();
    if (loc.length) {
        playlist.setSetting({
            updateLocationOnAdd: false
        });
        fetchTracksFromString(loc).always(function() {
        	playlist.setSetting({
                updateLocationOnAdd: true
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