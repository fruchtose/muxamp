/*var counter = (function() {
	var val = 1;
	return function() {
		return val++;
	};
})();*/

/*var getWindowLocation = (function() {
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
})();*/

/*var getMediaObject = function(mediaData) {
    var mediaObject = null;
    if (mediaData) {
	    var id = counter();
	    switch (mediaData.siteCode) {
	        case 'sct':
	        	mediaObject = new SoundCloudTrack({
	        		id: id,
	        		siteMediaID: mediaData.siteMediaID,
	        		url: mediaData.url,
	        		permalink: mediaData.permalink,
	        		uploader: mediaData.author,
	        		mediaName: mediaData.mediaName,
	        		duration: mediaData.duration,
	        		soundManager: soundManager
	        	});
	            break;
	        case 'ytv':
	        	mediaObject = new YouTubeTrack({
	        		id: id,
	        		siteMediaID: mediaData.siteMediaID,
	        		uploader: mediaData.author,
	        		mediaName: mediaData.mediaName,
	        		duration: mediaData.duration,
	        	});
	            break;
	    }
    }
    return mediaObject;
};*/

/*var fetchTracksFromString = function(str) {
	if (playlist.isChangingState) {
    	return;
    }
	return playlistRouter.load(str).always(function(data) {
    	if (!data.id) {
    		//History.pushState({id: null, current: null}, "Muxamp", "/");
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
        /*fetchTracksFromString(loc).always(function() {
        	playlist.setSetting({
                updateLocationOnAdd: true
            });
        	$.unblockUI();
        	isLoading = false;
        });*/
    /*}
    else {
        $.unblockUI();
        isLoading = false;
    }
};*/

$(document).ready(function() {
	/*var rejected = false;
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
	}*/
    //$.blockUI();
    /*History.Adapter.bind(window, 'statechange', function() {
    	var state = History.getState();
    	fetchTracksFromString(state.data.id);
    });*/
    /*soundManager.onready(loadFunction);
    soundManager.ontimeout(loadFunction);*/
});