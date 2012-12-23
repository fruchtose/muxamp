var SearchResult = require('./searchresult').SearchResult,
	_ = require('underscore')._,
	$ = require('./jquery.whenall'),
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

function MultilevelTable() {
    this.dirty = true;
    this.table = [];
    this.flat = [];
}

MultilevelTable.prototype = {
    addItem: function(item, index, innerIndex) {
        if (!this.table[index]) {
            this.table[index] = [];
        }
        // Source playlists (SoundCloud, etc.) are lists at a given index in a hash table.
        // The lists arre translated into a flat structure at playlist construction.
        if (undefined == innerIndex) {
            this.table[index].push(item);
        }
        else {
            if (!this.table[index][innerIndex])
                this.table[index][innerIndex] = [];
            this.table[index][innerIndex].push(item);
        }
        this.dirty = true;
    },
    getFlatTable: function() {
        if (this.dirty) {
            this.flat = _.flatten(this.table);
            this.dirty = false;
        }
        return this.flat;
    },
    getTable: function() {
        return this.table;
    }
};

function Router (soundcloudConsumerKey, youtubeKey) {
    var defaults = { 
    };
    
    this.opts = _.extend({}, defaults);
    this.actionQueue = [];
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.youtubeKey = youtubeKey != null ? youtubeKey : "";
    this.lastRedditRequest = new Date(0);  
    this.requestsInProgress = 0;
    
    this.buildRoutingTable = function() {
        var router = this;
        var table = [];
        /*table.push({
            site: 'Reddit',
            test: function(input) {
                return (typeof input == "string" && input.indexOf("reddit.com/r/") >= 0) ||
                (input instanceof KeyValuePair && input.key == 'rdt');
            },
            getAction: function(input) {
                if (typeof input == "string"){
                    return router.resolveReddit;
                }
                else if (input instanceof KeyValuePair) {
                    return router.processRedditLink;
                }
                else return null;
            }
        });*/
        table.push({
            site: 'SoundCloud',
            test: function(input) {
                return (typeof input == "string" && (input.indexOf("soundcloud.com/") >= 0 || input.indexOf("http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F") === 0)) ||
                (input instanceof KeyValuePair && (input.key == 'sct' || input.key == 'scp'));
            },
            getAction: function(input) {
                if (typeof input == "string"){
                    return router.resolveSoundCloud;
                }
                else if (input instanceof KeyValuePair) {
                    if (input.key == 'scp')
                        return router.processSoundCloudPlaylist;
                    else return router.processSoundCloudTrack;
                }
                else return null;
            }
        });
        table.push({
            site: 'YouTube',
            test: function(input) {
                return (typeof input == "string" && ((/youtube\.com\/watch\\?/.test(input) && /v=[\w\-]+/.test(input)) || 
                    /youtu.be\/[\w\-]+/.test(input) || /http:\/\/www.youtube\.com\/embed\/[\w\-]+\?/.test(input))) 
                || (input instanceof KeyValuePair && input.key == 'ytv');
            },
            getAction: function(input) {
                if (typeof input == "string"){
                    return router.resolveYouTube;
                }
                else if (input instanceof KeyValuePair) {
                    return router.processYouTubeVideoID;
                }
                else return null;
            }
        });
        /*table.push({
            site: 'Internet',
            test: function(input) {
                return router.testResource(input, ['Internet']) === null;
            },
            getAction: function(input) {
                if (typeof input == "string") {
                    return router.resolveInternetLink;
                }
                else return null;
            }
        });*/
        return table;
    }
    
    this.routingTable = this.buildRoutingTable();
}

Router.prototype = {
    addResource: function(url, mediaHandler, excludedSites) {
        var success = false;
        var deferred = $.Deferred();
        var failure = function() {
            console.log("Unable to fetch content from " + url + ".");
        }
        mediaHandler = mediaHandler || function() {};
        var isString = typeof url == "string", isURL = false;
        if (isString) {
            url = _.str.trim(url.toString());
            isURL = this.verifyURL(url);
        }
        if (url) {
            if (isURL || url instanceof KeyValuePair) {
                var func = this.testResource(url, excludedSites);
                if (func) {
                    func.call(this, url, failure, deferred).then(mediaHandler);
                    success = true;
                }
            }
            if (!success && isString && !isURL) {
                if (this.verifyURL('http://' + url)) {
                    return this.addResource('http://' + url);
                }
                else if (this.verifyURL('http://www.' + url)) {
                    return this.addResource('http://www.' + url);
                }
                else {
                    deferred.reject({
                        success: false,
                        error: "The resource submitted could not be identified."
                    });
                }
            }
        }
        return deferred.promise();
    },
    getOption: function(option) {
        return this.opts[option];
    },
    processInternetLink: function(url, failure, deferred, params) {
        var router = this;
        var deferredReject = _.extend({}, params, {
            success: false,
            error: "SoundCloud track could not be used."
        });
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var proxyURL = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'proxy.php';
        var resolveURL = proxyURL + "?url=" + url;
        var options = {
            url: resolveURL,
            dataType: 'json',
            timeout: 5000,
            success: function(response) {
                var links = response.results;
                var actions =  _.map(links, function(element) {
                    var func = router.testResource(element, ['Internet']);
                    if (func != null) {
                        return {
                            action: func,
                            url: element
                        }
                    }
                    else return null;
                });
                var multiLevelTracks = new MultilevelTable();
                var deferredActions = [];
                for (index in actions) {
                    var action = actions[index];
                    var deferredAction = $.Deferred();
                    action.action.call(router, action.url, false, deferredAction, {
                        trackIndex: index
                    });
                    deferredActions.push(deferredAction.always(function(trackData) {
                        if (trackData && trackData.hasOwnProperty('tracks') && trackData.hasOwnProperty('trackIndex')) {
                            multiLevelTracks.addItem(trackData.tracks, trackData.trackIndex);
                        }
                    }));
                }
                
                $.whenAll.apply(null, deferredActions).always(function() {
                    var tracks = multiLevelTracks.getFlatTable();
                    deferred.resolve(_.extend({}, params, {
                        tracks: tracks
                    }));
                });
            },
            error: errorFunction
        };
        $.ajax(options);
    },
    processRedditLink: function(url, failure, deferred, params) {
        var router = this;
        if (url instanceof KeyValuePair) {
            var link = 'http://www.reddit.com/';
            if (url.value) {
                var linkSuffix = url.value.toString().toLowerCase()
                if (linkSuffix != 'front')
                    link += 'r/' + url.value;
            }
            url = link;
        }
        var resolveURL = url + ".json?limit=25&jsonp=?";
        var deferredReject = _.extend({}, params, {
            success: false,
            error: "SoundCloud track could not be used."
        });
        var error = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        };
        var success = function(data, textStatus) {
            if (textStatus != "success") {
                error();
                return;
            }

            if (data.error == "404") {
                error();
                return;
            }

            if ( !(data.kind && data.kind == 'Listing' && data.data && data.data.children) ) {
                error();
                return;
            }
            
            var entries = _.find(data.data.children, function(element) {
                var link = element.data.url;
                return _.isFunction(router.testResource(link, ["Reddit"]));
            });
            var multiLevelTracks = new MultilevelTable();
            var deferredArray = [];
            for (var index in entries) {
                var element = entries[index];
                var deferredAction = $.Deferred();
                var entry = element.data;
                var link = entry.url;
                var newParams = {
                    trackIndex: index
                };
                var action = router.testResource(link, ["Reddit"]);
                action.call(router, link, false, deferredAction, newParams);
                deferredArray[index] = deferredAction;
                deferredAction.promise().always(function(trackData) {
                    if (trackData && trackData.hasOwnProperty('tracks')) {
                        multiLevelTracks.addItem(trackData['tracks'], trackData['trackIndex']);
                    }
                });
            }
            var tracks = [];
            $.whenAll.apply(null, deferredArray).always(function() {
                tracks = multiLevelTracks.getFlatTable();
                deferred.resolve(_.extend({}, params, {
                    tracks: tracks
                }));
            });
        };
        while (new Date() - router.lastRedditRequest < 2000) {}
        router.lastRedditRequest = new Date();
        $.ajax({
            url: resolveURL,
            data: null,
            dataType: 'json'
        }).success(success).error(error);
        return deferred.promise();
    },
    processSoundCloudPlaylist: function(playlistID, failure, deferred, params) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        if (playlistID instanceof KeyValuePair) {
            playlistID = playlistID.value;
        }
        var deferredReject = _.extend({}, params, {
            success: false,
            error: "SoundCloud track could not be used."
        });
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var addPlaylistData = function(data) {
            if (data.streamable === true) {
                var multilevelTracks = new MultilevelTable();
                var tracksDeferred = [], tracks = [];
                if (data.tracks && data.tracks.length > 0) {
                    for (var index in data.tracks) {
                        var track = data.tracks[index];
                        var deferredAction = $.Deferred();
                        router.processSoundCloudTrack(track, failure, deferredAction, params);
                        tracksDeferred.push(deferredAction);
                        deferredAction.promise().always(function(trackData) {
                            multilevelTracks.addItem(trackData.tracks, index);
                        });
                    }
                    $.whenAll.apply(null, tracksDeferred).always(function() {
                        tracks = multilevelTracks.getFlatTable();
                        deferred.resolve(_.extend({}, params, {
                            tracks: tracks
                        }));
                    });
                }
            }
            else {
                errorFunction();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof playlistID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/playlists/' + playlistID + ".json?consumer_key=" + consumerKey;
            var options = {
                uri: resolveURL,
                json: true
            };
            request(options, function(error, response, body) {
            	if (error || response.statusCode != 200) {
            		errorFunction();
            		return;
            	}
            	addPlaylistData(body);
            });
        }
        // If a data object is provided, the track data is fetched from it
        else addPlaylistData(playlistID);
        return deferred.promise();
    },
    processSoundCloudTrack: function(trackID, failure, deferred, params) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        if (trackID instanceof KeyValuePair) {
            trackID = trackID.value;
        }
        var deferredReject = _.extend({}, params, {
            success: false,
            error: "SoundCloud track could not be used."
        });
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var addTrackData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.stream_url) {
                    var trackObject = new SearchResult(data.stream_url + '?client_id=' + router.soundcloudConsumerKey, data.permalink_url, data.id, "sct", "img/soundcloud_orange_white_16.png",data.user.username, data.title, data.duration / 1000, "audio");
                    deferred.resolve(_.extend({}, params, {
                        tracks: [trackObject]
                    }));
                }
                else {
                    errorFunction();
                }
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof trackID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/tracks/' + trackID + ".json?consumer_key=" + consumerKey;
            var options = {
                uri: resolveURL,
                json: true
            };
            request(options, function(error, response, body) {
            	if (error || response.statusCode != 200) {
            		errorFunction();
            		return;
            	}
            	addTrackData(body);
            });
        /*if (queue) {
                queue.add(options);
            }
            else {
                $.ajax(options);
            }*/
        }
        // If a data object is provided, the track data is fetched from it
        else addTrackData(trackID);
        return deferred.promise();
    },
    processYouTubeVideoID: function(youtubeID, failure, deferred, params) {
        var router = this;
        if (youtubeID instanceof KeyValuePair) {
            youtubeID = youtubeID.value;
        }
        var deferredReject = _.extend({}, params, {
            success: false,
            error: "SoundCloud track could not be used."
        });
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var youtubeAPI = 'https://gdata.youtube.com/feeds/api/videos/' + youtubeID + '?v=2&alt=json';
        var options = {
            uri: youtubeAPI,
            json: true,
            strictSSL: false
        };
        request(options, function(error, response, body) {
        	if (error || response.statusCode != 200) {
        		errorFunction();
        		return;
        	}
        	try {
	        	var entry = body.entry;
	            var authorObj = entry.author[0];
	            var author = authorObj.name.$t;
	            var title = entry.title.$t;
	            var duration = parseInt(entry.media$group.yt$duration.seconds);
	            var url = 'http://www.youtube.com/watch?v=' + youtubeID;
	            var trackObject = new SearchResult(url, url, youtubeID, "ytv", "img/youtube.png", author, title, duration, "video");
	            deferred.resolve(_.extend({}, params, {
	                tracks: [trackObject]
	            }));
            }
        	catch(e) {
        		deferred.resolve(_.extend({}, params, {
	                tracks: []
	            }));
        	}
        });
        return deferred.promise();
    },
    resolveInternetLink: function(url, failure, deferred, params) {
        deferred || (deferred = $.Deferred());
        if (!params)
            params = {};
        this.processInternetLink(url, failure, deferred, params);
        return deferred.promise();
    },
    resolveReddit: function(url, failure, deferred, params) {
        deferred || (deferred = $.Deferred());
        if (!params)
            params = {};
        this.processRedditLink(url, failure, deferred, params);
        return deferred.promise();
    },
    resolveSoundCloud: function(url, failure, deferred, params) {
        var router = this, 
            resolveURL, 
            miniPlayerLocator = "http://w.soundcloud.com/player/?url=", 
            flashPlayerLocator = "http://player.soundcloud.com/player.swf?url=";
        var urlParams, decodedURL;
        if (url.indexOf(miniPlayerLocator) === 0 || url.indexOf(flashPlayerLocator) === 0) {
            urlParams = getURLParams(url.substring(url.indexOf("?") + 1));
            decodedURL = decodeURIComponent(urlParams['url'][0]);
            resolveURL = decodedURL + ".json?consumer_key=" + this.soundcloudConsumerKey;
        } else {
            if (/soundcloud.com\/[^\/]+\/[^\/]+\/download/.test(url)) {
                url = url.substring(0, url.lastIndexOf("/download") + 1);
            }
            resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey;
        }
        deferred || (deferred = $.Deferred());
        params || (params = {});
        var deferredReject = _.extend({}, params, {
            success: false,
            error: "SoundCloud track could not be used."
        });
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var requestOptions = {
    		uri: resolveURL,
    		json: true
        };
        request(requestOptions, function(error, response, body) {
        	if (error || response.statusCode != 200) {
        		errorFunction();
        		return;
        	}
        	if ( !(body.kind == "track" || body.kind == "playlist") ) {
                errorFunction();
                return;
            }
            if (body.streamable != true) {
                errorFunction();
                return;
            }
            
            //Tracks have stream URL
            if (body.stream_url) {
                router.processSoundCloudTrack(body, failure, deferred, params);
            }
            else {
                router.processSoundCloudPlaylist(body, failure, deferred, params);
            }
        });
        return deferred.promise();
    },
    resolveYouTube: function(url, failure, deferred, params) {
        var youtubeID, urlPrefix, urlPrefixLoc, urlPrefixLength, idSubstring;
        deferred || (deferred = $.Deferred());
        if (/http:\/\/www.youtube\.com\/embed\/[\w\-]+\?/.test(url)) {
            urlPrefix = "/embed/";
        }
        else if (url.indexOf("youtube.com") > -1) {
            urlPrefix = "v=";
        }
        else if (url.indexOf("youtu.be") > -1) {
            urlPrefix = "youtu.be/";
        } else {
            if (failure)
                failure();
            deferred.reject(_.extend({}, params, {
                success: false,
                error: "YouTube video was not present in URL."
            }));
        }
        urlPrefixLoc = url.indexOf(urlPrefix);
        urlPrefixLength = urlPrefix.length;
        idSubstring = url.substring(urlPrefixLoc + urlPrefixLength);
        youtubeID = /[\w\-]+/.exec(idSubstring);
        params || (params = {});
        this.processYouTubeVideoID(youtubeID, failure, deferred, params);
        return deferred.promise();
    },
    setOption: function(option, value) {
        this.opts[option] = value;
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
            return _.contains(exclusions, route.site);
        });
        result = _.find(possibleRoutes, function(route) {
            return route.test(input);
        }).getAction(input);
        return result;
    },
    verifyURL: function(url) {
    	if (typeof url != 'string') {
    		return false;
    	}
    	var parsed = urlParser.parse(url);
    	return (parsed && parsed.href);
    }
};

module.exports = {
	getRouter: function() {
		return new Router("2f9bebd6bcd85fa5acb916b14aeef9a4", "AI39si5BFyt8MJ8G-sU6ZtLTT8EESCsLT6NS3K8VrA1naS1mIKy5qfsAl6lQ208tIwJQWXuDUebBRee2QNo3CAjQx58KmkxaKw");
	},
	getURLParams: function(source, useOrderedList) {
		return getURLParams(source, useOrderedList);
	}
};