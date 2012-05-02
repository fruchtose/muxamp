function KeyValuePair(key, value) {
    this.key = key;
    this.value = value;
}

// 
// // Original code by Andy E of Stack Overflow
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
            var listItem = new KeyValuePair(key, value);
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

var addHashParam = function(key, value) {
    var currentHash = window.location.hash;
    if (!currentHash.length) {
        return key + "=" + value;
    }
    else return currentHash + "&" + key + "=" + value;
}

var hashTableToFlatList = function(table) {
    var flatList = [];
    var hash;
    for (hash in table) {
        var list = table[hash];
        if (list && Object.prototype.toString.apply(list) === '[object Array]') {
            list = hashTableToFlatList(list);
        }
        if (Object.prototype.toString.apply(list) === '[object Array]')
            flatList = flatList.concat(list);
        else flatList.push(list);
    }
    return flatList;
};

$(document).ready(function() {
    /*var urlParams = getURLParams(true);
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
                var mediaObjectTable = new MultilevelTable();
                var mediaHandler = function(item, index, innerIndex) {
                    mediaObjectTable.addItem(item, index, innerIndex);
                    console.log("x");
                };
                var mediaObjectCounter = 0;
                for (var param in urlParams) {
                    var keyValuePair = urlParams[param];
                    var failure = function() {
                        alert("The media ID " + keyValuePair.value + " could not be found.");
                    };
                    var deferred = $.Deferred();
                    var deferredPromise;
                    switch(keyValuePair.key.toString().toLowerCase()) {
                        case 'ytv':
                            if (keyValuePair.value) {
                                deferredPromise = router.processYouTubeVideoID(keyValuePair.value, mediaHandler, {trackIndex:param}, deferred, failure);
                            }
                            break;
                        case 'sct':
                            if (keyValuePair.value) {
                                deferredPromise = router.processSoundCloudTrack(keyValuePair.value, mediaHandler, {trackIndex: param}, deferred, failure);
                            }
                            break;
                        case 'scp':
                            if (keyValuePair.value) {
                                deferredPromise = router.processSoundCloudPlaylist(keyValuePair.value, mediaHandler, {trackIndex:param}, deferred, failure);
                            }
                            break;
                        case 'rdt':
                            var link = 'http://www.reddit.com/';
                            if (keyValuePair.value) {
                                var linkSuffix = keyValuePair.value.toString().toLowerCase()
                                if (linkSuffix != 'front')
                                    link += 'r/' + keyValuePair.value;
                            }
                            deferredPromise = router.processRedditLink(link, mediaHandler, {trackIndex:param}, deferred, failure);
                            break;
                        default:
                            deferred.reject({
                                success: false,
                                error: "Media source not found."
                            });
                            deferredPromise = deferred.promise();
                            break;
                    }
                    var completeLoad = function() {
                        mediaObjectCounter++;
                        if (mediaObjectCounter == urlParams.length) {
                            var flatList = mediaObjectTable.getFlatTable();
                            router.playlistObject.addTracks(flatList, 0);
                            router.playlistObject.updateSettings({
                                updateURLOnAdd: true
                            });

                            $.unblockUI();
                        }
                    };
                    router.addToActionQueue(deferredPromise, completeLoad);
                }
            }
        });
    }*/
});