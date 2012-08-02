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
    if (playlist.isChangingState) {
    	return;
    }
	return $.ajax({
    	url: queryLink,
    	dataType: 'json',
    	type: 'POST',
    	data: {query: str}
    }).done(function(data) {
    	if (!data.id) {
    		History.pushState({id: null, current: null}, "Muxamp", "/");
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
    			playlist.setTracks(mediaObjects, History.getState().data['current']);
    		}
    		else {
    			alertError("Unable to load playlist", "The tracks you want to load " +
    				"are invalid, or you are unable to connect to the Internet. " + 
    				"Please address these issues and try again.");
    		}
    	}
    });
}
var isLoading = false;

var loadFunction = function() {
	if (isLoading) {
		return;
	}
	isLoading = true;
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
        	isLoading = false;
        });
    }
    else {
        $.unblockUI();
        isLoading = false;
    }
};

$(document).ready(function() {
	var rejected = false;
	if ($.browser.mobile === true) {
		$.blockUI({message: "Sorry, Muxamp currently does not support mobile browsers. :("});
		rejected = true;
	}
	else {
		$.reject({
			afterReject: function() {
				rejected = true;
			},
			browserInfo: {
				chrome: {
					text: 'Chrome 20'
				},
				firefox: {
					text: 'Firefox 13'
				},
				opera: {
					text: 'Opera 12'
				}
			},
			close: false,
			closeMessage: 'Muxamp will not function using your current browser.',
			display: ['firefox','chrome','opera'],
			header: 'You need a modern Internet browser to enjoy Muxamp.',
			imagePath: './img/',
			paragraph1: 'Get one of the browsers you see below.',
			reject: {
				chrome1: true,
				firefox1: true,
				firefox2: true,
				iphone: true,
				msie7: true,
				msie8: true,
				msie9: true,
				opera7: true,
				safari1: true,
				safari2: true,
				safari3: true
			}
			
		});
	}
	if (rejected) {
		$('#header, #wrapper, #footer, #about').html('');
		return;
	}
    $.blockUI();
    History.Adapter.bind(window, 'statechange', function() {
    	var state = History.getState();
    	fetchTracksFromString(state.data.id);
    });
    soundManager.onready(loadFunction);
    soundManager.ontimeout(loadFunction);
});