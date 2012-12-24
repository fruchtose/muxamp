var SearchResult = require('./searchresult').SearchResult,
	_ = require('underscore')._,
    Q = require('q'),
	request = require('request'),
	urlParser = require('url');
	
_.str = require('underscore.string');

function KeyValuePair(key, value) {
    this.key = key;
    this.value = value;
}

KeyValuePair.prototype.toString = function() {
    return "(" + this.key.toString() + "=" + this.value.toString() + ")";
}

var verifyUrl = function(url) {
    if (! _.isString(url)) {
        return false;
    }
    var parsed = urlParser.parse(url);
    return (parsed && parsed.href);
};

// 
// // Original code by Andy E of Stack Overflow
// http://stackoverflow.com/a/7676115/959934
// Modified by me to allow multiple values to be associated with a single key
function getURLParams(source, useOrderedList) {
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
    q = source;
    if (q[0] == '#') {
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

var getMediaRoute = function(options) {
    var siteCode  = options.siteCode,
        siteName  = options.siteName;
    var route = {
        process: function(input, params, context) {
            var handleData    = options.handleData,
                idPromise     = null,
                tracksPromise = Q.defer();
            params || (params = {});
            context || (context = route);
            idPromise = route.test(input, _.extend({}, {createPromise: true}, params));
            idPromise.then(function(media) {
                handleData.call(context, media, params).then(function(result) {
                    tracksPromise.resolve(result);
                }, function(error) {
                    tracksPromise.reject(error);
                });
            });
            return tracksPromise.promise;
        },
        siteName: siteName,
        test: function(input, params, context) {
            var handleUrl    = options.handleUrl,
                processedUrl = null
                result       = false,
                testUrl      = options.testUrl;
            params || (params = {});
            context || (context = route);
            createPromise = !!params.createPromise;
            if (_.isString(input) && verifyUrl(input) && (processedUrl = testUrl(input))) {
                if (!createPromise) {
                    return true;
                }
                result = handleUrl.call(context, processedUrl, params);
            } else if (input instanceof KeyValuePair && input.key == siteCode) {
                if (!createPromise) {
                    return true;
                }
                result = Q.defer();
                result.resolve(input);
                result = result.promise;
            }
            return result;
        }
    };
    return route;
};

var youtubeVideoOptions = {
    handleData: function(media) {
        var deferred = Q.defer(),
            youtubeID = media.value,
            deferredReject = {
                success: false,
                error: "SoundCloud track could not be used."
            },
            youtubeAPI = 'https://gdata.youtube.com/feeds/api/videos/' + youtubeID + '?v=2&alt=json',
            options = {
                uri: youtubeAPI,
                json: true,
                strictSSL: false
            };
        request(options, function(error, response, body) {
            if (error || response.statusCode != 200) {
                deferredReject.error = error || deferredReject.error;
                deferred.reject(deferredReject);
                return;
            }
            try {
                var entry     = body.entry,
                    authorObj = entry.author[0],
                    author    = authorObj.name.$t,
                    title     = entry.title.$t,
                    duration  = parseInt(entry.media$group.yt$duration.seconds),
                    url = 'http://www.youtube.com/watch?v=' + youtubeID,
                    trackObject = new SearchResult(url, url, youtubeID, "ytv", "img/youtube.png", author, title, duration, "video");
                deferred.resolve({
                    tracks: [trackObject]
                });
            }
            catch(e) {
                deferredReject.error = e.error;
                deferred.reject(deferredReject);
            }
        });
        return deferred.promise;
    },
    handleUrl: function(id) {
        // Getting the YouTube ID can be handled by preprocessing
        deferred = Q.defer();
        deferred.resolve(new KeyValuePair('ytv', id));
        return deferred.promise;
    },
    siteCode: 'ytv',
    siteName: 'YouTube',
    testUrl: function(input) {
        // Thanks to mantish
        // http://stackoverflow.com/a/9102270/959934
        var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
        var match = input.match(regex);
        if (match&&match[2].length==11){
            return match[2];
        }else{
            return false;
        }
    }
};

var soundcloudConsumerKey ='2f9bebd6bcd85fa5acb916b14aeef9a4';

var soundcloudTrackOptions = {
    handleData: function(input) {
        var consumerKey = soundcloudConsumerKey,
            deferred = Q.defer(),
            deferredReject = {
            success: false,
            error: "SoundCloud track could not be used."
        };
        var url = input;
        if (url instanceof KeyValuePair) {
            url = 'http://api.soundcloud.com/tracks/' + input.value + ".json?consumer_key=" + consumerKey;
        }
        var requestOptions = {
            uri: url,
            json: true
        };
        request(requestOptions, function(error, response, data) {
            if (error || response.statusCode != 200) {
                deferredReject.error = error || deferredReject.error;
                deferred.reject(deferredReject);
                return;
            }
            if (data.kind != 'track') {
                deferred.reject(deferredReject);
                return;
            }
            if ( !(data.streamable == true && data.stream_url) ) {
                deferred.reject(deferredReject);
                return;
            }
            var trackObject = new SearchResult(data.stream_url + '?client_id=' + consumerKey, data.permalink_url, data.id, "sct", "img/soundcloud_orange_white_16.png",data.user.username, data.title, data.duration / 1000, "audio");
            deferred.resolve({
                tracks: [trackObject]
            });
        });
        return deferred.promise;
    },
    handleUrl: function(url) {
        var consumerKey = soundcloudConsumerKey,
            deferred = Q.defer(),
            resolveUrl = '',
            deferredReject = {
                success: false,
                error: 'SoundCloud track could not be used.'
            };
        if (_.str.include('soundcloud.com/tracks/')) {
            resolveUrl = url + '.json?consumer_key=' + consumerKey;
        } else if (url && url.length) {
            resolveUrl = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + consumerKey;
        } else {
            deferred.reject(deferredReject);
        }
        deferred.resolve(resolveUrl);
        return deferred.promise;
    },
    siteCode: 'sct',
    siteName: 'SoundCloud',
    testUrl: function(input) {
        var httpTest = /http(s)?:\/\/(www\.)?soundcloud\.com\/(.*)?/,
            httpMatch = input.match(httpTest),
            // track format: <user> / <track name>
            trackFormat = /soundcloud\.com\/[^\/]+\/[^\/]+/,
            downloadFormat = /soundcloud.com\/([^\/]+\/[^\/]+)\/download/;
        if (httpMatch) {
            var downloadMatch = input.match(downloadFormat);
            if (downloadMatch) {
                input = downloadMatch[1];
            } else {
                input = httpMatch[3];
            }
            input = 'https://soundcloud.com/' + input;
            return trackFormat.test(input) ? input : false;
        }
        var playerTest = /http(s)?:\/\/(w|player)\.soundcloud\.com\/player(\/|.swf)?\?url=(http%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F.*)/,
            playerMatch = input.match(playerTest);
        if (playerMatch) {
            return decodeURIComponent(playerMatch[4]);
        }
    }
};

var Router = function(routingOptions) {
    this.addRoutes(routingOptions || []);
}

Router.prototype = {
    addResource: function(url, mediaHandler, excludedSites) {
        var success = false;
        var deferred = Q.defer();
        var failure = function() {
            console.log("Unable to fetch content from " + url + ".");
        }
        mediaHandler = mediaHandler || function(data) {return data;};
        var isString = typeof url == "string", isURL = false;
        if (isString) {
            url = _.str.trim(url.toString());
            isURL = this.verifyUrl(url);
        }
        if (url) {
            if (isURL || url instanceof KeyValuePair) {
                var func = this.testResource(url, excludedSites);
                if (func) {
                    deferred = func(url).then(mediaHandler).fail(failure);
                    success = true;
                }
            }
            if (!success && isString && !isURL) {
                if (this.verifyUrl('http://' + url)) {
                    return this.addResource('http://' + url);
                }
                else if (this.verifyUrl('http://www.' + url)) {
                    return this.addResource('http://www.' + url);
                }
                else {
                    deferred.reject({
                        success: false,
                        error: "The resource submitted could not be identified."
                    });
                    deferred = deferred.promise;
                }
            }
        }
        return deferred;
    },
    addRoutes: function(routes) {
        var newRoutes = _(routes).map(function(options) {
            return getMediaRoute(options);
        });
        this.routingTable = (this.routingTable || []).concat(newRoutes);
    },
    testResource: function(input, exclusions) {
        // Finds the first routing function from the routing table, 
        // possibly excluding some routes beforehand
        if (!exclusions) {
            exclusions = [];
        } else if (!_.isArray(exclusions)) {
            exclusions = [exclusions];
        }
        var result = null, possibleRoutes = [], i, j;
        possibleRoutes = _.reject(this.routingTable, function(route) {
            return _.contains(exclusions, route.siteName);
        });
        result = _.find(possibleRoutes, function(route) {
            return route.test(input);
        }).process;
        return result;
    },
    verifyUrl: verifyUrl
};

module.exports = {
	getRouter: function() {
		return new Router([soundcloudTrackOptions, youtubeVideoOptions]);
	},
	getURLParams: function(source, useOrderedList) {
		return getURLParams(source, useOrderedList);
	}
};