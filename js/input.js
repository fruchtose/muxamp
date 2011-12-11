// Original code by Andy E of Stack Overflow
// http://stackoverflow.com/a/7676115/959934
// Modified by me to allow multiple values to be associated with a single key
function getURLParams(useOrderedList) {
    var urlParams = {};
    var orderedList = [];
    var e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&=;]+)=?([^&;]*)/g,
    d = function (s) {
        //Returns the original string if it can't be URI component decoded
        var spaced = s.replace(a, " ");
        try {
            return decodeURIComponent(spaced);
        }
        catch(e) {
            return spaced;
        }
    },
    q = window.location.hash;
    if (q.charAt(0) == '#') {
        q = q.substring(1);
    }

    while (e = r.exec(q)) {
        var key = d(e[1]);
        var value = d(e[2]);
        if (useOrderedList) {
            var listItem = new Object();
            listItem['value'] = value;
            listItem['key'] = key;
            orderedList.push(listItem);
        }
        else {
            if (!urlParams[key]) {
                urlParams[key] = [value];
            }
            else {
                // If key already found in the query string, the value is tacked on
                urlParams[key].push(value);
            }
        }
    }
    if (useOrderedList) {
        return orderedList;
    }
    else {
        return urlParams;
    }
};

function addHashParam(key, value) {
    var currentHash = window.location.hash;
    if (!currentHash.length) {
        return key + "=" + value;
    }
    else return currentHash + "&" + key + "=" + value;
}

$(document).ready(function() {
    var urlParams = getURLParams(true);
    $.ajaxSetup({
        async: false
    });
    if (urlParams) {
        soundManager.onready(function(status) {
            var inputCount = urlParams.length;
            if (inputCount) {
                $.blockUI();
                router.playlistObject.updateSettings({
                    updateURLOnAdd: false
                });
                var ajaxManager = $.manageAjax.create('pageload', {
                    cacheResponse: true,
                    preventDoubleRequests: false,
                    queue: true
                });
                for (var param in urlParams) {
                    var keyValuePair = urlParams[param];
                    switch(keyValuePair.key.toString().toLowerCase()) {
                        case 'ytv':
                            if (keyValuePair.value) {
                                router.processYouTubeVideoID(keyValuePair.value, ajaxManager);
                            }
                            break;
                        case 'sct':
                            if (keyValuePair.value) {
                                router.processSoundCloudTrack(keyValuePair.value, ajaxManager);
                            }
                            break;
                        case 'scp':
                            if (keyValuePair.value) {
                                router.processSoundCloudPlaylist(keyValuePair.value, ajaxManager);
                            }
                            break;
                        case 'bct':
                            if (keyValuePair.value) {
                                router.processBandcampTrack(keyValuePair.value, 'pageload');
                            }
                            break;
                        case 'bca':
                            if (keyValuePair.value) {
                                router.processBandcampAlbum(keyValuePair.value, 'pageload');
                            }
                            break;
                    }
                }
                var interval = window.setInterval(function() {
                    ajaxManager.clearTimeouts();
                    if (!ajaxManager.size()) {
                        window.clearInterval(interval);
                        router.playlistObject.updateSettings({
                            updateURLOnAdd: true
                        });
                        $.unblockUI();
                    }
                }, 100);
            }
        });
    }
});