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
        if (list) {
            var index;
            for (index in list) {
                flatList.push(list[index]);
            }
        }
    }
    return flatList;
};

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
                router.setOption('expectationsMode', true);
                var ajaxManager = $.ajaxBatch.create('pageload', {
                    executeOnBatchSize: true
                });
                var mediaObjectHashTable = [];
                var mediaHandler = function(mediaObject, index, innerIndex) {
                    if (!mediaObjectHashTable[index]) {
                        mediaObjectHashTable[index] = [];
                    }
                    // Source playlists (SoundCloud, etc.) are lists at a given index in a hash table.
                    // The lists arre translated into a flat structure at playlist construction.
                    if (!innerIndex) {
                        mediaObjectHashTable[index].push(mediaObject);
                    }
                    else {
                        mediaObjectHashTable[index][innerIndex] = mediaObject;
                    }
                }
                $(document).bind('routerAjaxStop', function() {
                    var flatList = hashTableToFlatList(mediaObjectHashTable);
                        router.playlistObject.addTracks(flatList, 0);
                        router.playlistObject.updateSettings({
                            updateURLOnAdd: true
                        });
                        router.setOption('expectationsMode', false);
                        $(this).unbind('routerAjaxStop');
                        $.unblockUI();
                });
                router.expectMoreRequests(urlParams.length);
                var param;
                for (param in urlParams) {
                    var keyValuePair = urlParams[param];
                    var failure = function() {
                        alert("The media ID " + keyValuePair.value + " could not be found.");
                    };
                    switch(keyValuePair.key.toString().toLowerCase()) {
                        case 'ytv':
                            if (keyValuePair.value) {
                                router.processYouTubeVideoID(keyValuePair.value, mediaHandler, {trackIndex: param}, ajaxManager, failure);
                            }
                            break;
                        case 'sct':
                            if (keyValuePair.value) {
                                router.processSoundCloudTrack(keyValuePair.value, mediaHandler, {trackIndex: param}, ajaxManager, failure);
                            }
                            break;
                        case 'scp':
                            if (keyValuePair.value) {
                                router.processSoundCloudPlaylist(keyValuePair.value, mediaHandler, {trackIndex: param}, ajaxManager, failure);
                            }
                            break;
                        case 'rdt':
                            var link = 'http://www.reddit.com/';
                            if (keyValuePair.value) {
                                var linkSuffix = keyValuePair.value.toString().toLowerCase()
                                if (linkSuffix != 'front')
                                    link += 'r/' + keyValuePair.value;
                            }
                            router.processRedditLink(link, mediaHandler, {trackIndex: param}, ajaxManager, failure);
                            break;
                        default:
                            router.expectFewerRequests(1);
                            break;
                    }
                }
            }
        });
    }
});