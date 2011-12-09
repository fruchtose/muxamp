// Original code by "Andy E" of Stack Overflow
// http://stackoverflow.com/a/7676115/959934
// Modified by me to allow multiple values to be associated with a single key
var getURLParams = function(useOrderedList) {
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
    q = window.location.search.substring(1);

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

$(document).ready(function() {
    var urlParams = getURLParams(true);
    for (var param in urlParams) {
        var keyValuePair = urlParams[param];
        switch(keyValuePair.key.toString().toLowerCase()) {
            case 'youtubevid':
                if (keyValuePair.value) {
                    router.processYouTubeVideoID(keyValuePair.value);
                }
                break;
        }
    }
});