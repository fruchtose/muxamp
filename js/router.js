function MultilevelTable() {
    this.dirty = false;
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
            this.flat = hashTableToFlatList(this.table);
            this.dirty = false;
        }
        return this.flat;
    },
    getTable: function() {
        return this.table;
    }
};

function Router (playlist, soundManager, soundcloudConsumerKey, youtubeKey) {
    var defaults = { 
    };
    
    this.opts = $.extend({}, defaults);
    this.actionQueue = [];
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.playlistObject = playlist != null ? playlist : new Playlist();
    this.youtubeKey = youtubeKey != null ? youtubeKey : "";
    this.lastRedditRequest = new Date(0);  
    
    this.buildRoutingTable = function() {
        var router = this;
        var table = [];
        table.push({
            site: 'Reddit',
            test: function(input) {
                return (input instanceof String && input.indexOf("reddit.com/r/") >= 0) ||
                    (input instanceof KeyValuePair && input.key == 'rdt');
            },
            getAction: function(input) {
                if (input instanceof String){
                    return router.resolveReddit;
                }
                else if (input instanceof KeyValuePair) {
                    return router.processRedditLink;
                }
                else return null;
            }
        });
        table.push({
            site: 'SoundCloud',
            test: function(input) {
                return (input instanceof String && input.indexOf("soundcloud.com/") >= 0) ||
                    (input instanceof KeyValuePair && (input.key == 'sct' || input.key == 'scp'));
            },
            getAction: function(input) {
                if (input instanceof String){
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
                return (input instanceof String && /youtube\.com\/watch\\?/.test(input) && /v=[\w\-]+/.test(input)) ||
                    (input instanceof KeyValuePair && input.key == 'ytv');
            },
            getAction: function(input) {
                if (input instanceof String){
                    return router.resolveYouTube;
                }
                else if (input instanceof KeyValuePair) {
                    return router.processYouTubeVideoID;
                }
                else return null;
            }
        });
        return table;
    }
    
    this.routingTable = this.buildRoutingTable();
}

Router.prototype = {
    addToActionQueue: function(deferredPlaylistAction, onQueueExecution) {
        this.actionQueue.push(deferredPlaylistAction);
        
        var router = this;
        return deferredPlaylistAction.always(function() {
            var nextAction = router.actionQueue.shift();
            if (nextAction) {
                nextAction.always(router.executeActionQueueItem);
                if (onQueueExecution) {
                    nextAction.always(onQueueExecution);
                }
            }
        });
    },
    addResource: function(url, onActionQueueExection) {
        onActionQueueExection = onActionQueueExection || $.noop;
        var success = false;
        var failure = function() {
            alert("Unable to fetch content from " + url + ".");
        }
        var isString = url instanceof String;
        if (isString)
            url = $.trim(url.toString());
        if (url) {
            if ((isString && this.verifyURL(url)) || url instanceof KeyValuePair) {
                for (var entry in this.routingTable) {
                    var route = this.routingTable[entry];
                    if (route.test(url)) {
                        var func = route.getAction();
                        if (func)
                            this.addToActionQueue(func.call(this, url, failure), onActionQueueExection);
                        success = true;
                        break;
                    }
                }
            }
            if (!success && isString) {
                if (this.verifyURL('http://' + url)) {
                    success = this.addTrack('http://' + url);
                }
                else if (this.verifyURL('http://www.' + url)) {
                    success = this.addTrack('http://' + url);
                }
            }
        }
        return success;
    },
    executeActionQueueItem: function(deferredData) {
        if (deferredData && deferredData.action) {
            deferredData.action();
        }
    },
    allocateNewTracks: function(count) {
        this.playlistObject.allocateNewIDs(count);
    },
    getNewTrackID: function() {
        return this.playlistObject.getNewTrackID();
    },
    getOption: function(option) {
        return this.opts[option];
    },
    processRedditLink: function(url, mediaHandler, params, deferred, failure) {
        var router = this;
        var resolveURL = url + ".json?limit=25&jsonp=?";
        var deferredReject = {
            success: false,
            error: "SoundCloud track could not be used."
        };
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
            
            var entries = $.grep(data.data.children, function(element) {
                var link = element.data.url;
                return (link.indexOf('soundcloud.com/') >= 0) || (/youtube\.com\/watch\\?/.test(link) && /v=[\w\-]+/.test(link));
            });
            var actionCounter = 0;
            var actionTable = new MultilevelTable();
            var resolveData = {
                action: function() {
                    var actions = actionTable.getFlatTable();
                    for (var item in actions) {
                        var func = actions[item];
                        func();
                    }
                }
            };
            $.each(entries, function(index, element) {
                var deferredAction = $.Deferred();
                var entry = element.data;
                var link = entry.url;
                var newParams = $.extend({}, params, {innerIndex: index});
                if (link.indexOf('soundcloud.com/') >= 0) {
                    router.resolveSoundCloud(link, failure, deferredAction, mediaHandler, newParams);
                }
                else if(/youtube\.com\/watch\\?/.test(link) && /v=[\w\-]+/.test(link)) {
                    router.resolveYouTube(link, failure, deferredAction, mediaHandler, newParams);
                }
                deferredAction.always(function(data) {
                    if (data && data.hasOwnProperty('action') && data.hasOwnProperty('trackIndex') && data.hasOwnProperty('innerIndex')) {
                        actionTable.addItem(data['action'], data['trackIndex'], data['innerIndex']);
                    }
                    actionCounter++;
                    if (actionCounter == entries.length) {
                        deferred.resolve(resolveData);
                    }
                });
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
    processSoundCloudPlaylist: function(playlistID, mediaHandler, params, deferred, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var deferredReject = {
            success: false,
            error: "SoundCloud track could not be used."
        };
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var addPlaylistData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                deferred.resolve($.extend({}, params, {
                    action: function() {
                        if (data.tracks && data.tracks.length > 0) {
                            $.each(data.tracks, function(index, track) {
                                var deferredAction = $.Deferred();
                                router.processSoundCloudTrack(track, mediaHandler, params, deferredAction, failure);
                                deferredAction.always(function(data){
                                    if (data && data.action) {
                                        data.action();
                                    }
                                }).promise();
                            });
                        }
                    }
                }));
            }
            else {
                errorFunction();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof playlistID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/playlists/' + playlistID + ".json?consumer_key=" + consumerKey + '&callback=?';
            var options = {
                url: resolveURL,
                error: errorFunction,
                dataType: 'jsonp',
                success: function(data, textStatus) {
                    if (textStatus == "success") {
                        addPlaylistData(data);
                    }
                    else {
                        errorFunction();
                    }
                },
                timeout: 10000
            };
            $.ajax(options);
        }
        // If a data object is provided, the track data is fetched from it
        else addPlaylistData(playlistID);
        return deferred.promise();
    },
    processSoundCloudTrack: function(trackID, mediaHandler, params, deferred, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var deferredReject = {
            success: false,
            error: "SoundCloud track could not be used."
        };
        var errorFunction = function() {
            deferred.reject(deferredReject);
            if (failure)
                failure();
        }
        var addTrackData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.stream_url) {
                    deferred.resolve($.extend({}, params, {
                        action: function() {
                            router.allocateNewTracks(1);
                            var id = router.getNewTrackID();
                            var trackObject = new SoundCloudObject(id, data.stream_url, consumerKey, data, soundManager);
                            mediaHandler && mediaHandler.apply(this, [trackObject].concat(params['trackIndex']).concat(params['innerIndex']));
                        }
                    }));
                }
                else {
                    errorFunction();
                }
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof trackID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/tracks/' + trackID + ".json?consumer_key=" + consumerKey + '&callback=?';
            var options = {
                url: resolveURL,
                dataType: 'jsonp',
                error: errorFunction,
                success: function(data, textStatus) {
                    if (textStatus == "success") {
                        addTrackData(data);
                    }
                    else {
                        errorFunction();
                    }
                },
                timeout: 10000
            };
            $.ajax(options);
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
    processYouTubeVideoID: function(youtubeID, mediaHandler, params, deferred, failure) {
        var router = this;
        var youtubeAPI = 'https://gdata.youtube.com/feeds/api/videos/' + youtubeID + '?v=2&alt=json';
        var options = {
            url: youtubeAPI,
            dataType: 'jsonp',
            timeout: 10000,
            success: function(response) {
                var entry = response.entry;
                var authorObj = entry.author[0];
                var author = authorObj.name.$t;
                var title = entry.title.$t;
                var duration = parseInt(entry.media$group.yt$duration.seconds);
                deferred.resolve($.extend({}, params, {
                    action: function() {
                        router.allocateNewTracks(1);
                        var id = router.getNewTrackID();
                        var trackObject = new YouTubeObject(id, youtubeID, author, title, duration);
                        mediaHandler && mediaHandler.apply(this, [trackObject].concat(params['trackIndex']).concat(params['innerIndex']));
                    }
                }));
            },
            error: function() {
                deferred.reject({
                    success: false,
                    error: "Unable to contact YouTube."
                });
                if (failure)
                    failure();
            }
        };
        $.ajax(options);
        return deferred.promise();
        /*if (queue) {
            queue.add(options);
        }
        else {
            $.ajax(options);
        }*/
    },
    resolveReddit: function(url, failure, deferred, mediaHandler, params) {
        var router = this;
        var addNewTrack = function(mediaObject) {
            router.playlistObject.addTracks(mediaObject);
        };
        if (!deferred)
            deferred = $.Deferred();
        if (!mediaHandler) {
            mediaHandler = addNewTrack;
        }
        if (!params)
            params = {};
        this.processRedditLink(url, mediaHandler, params, deferred, failure);
        return deferred.promise();
    },
    resolveSoundCloud: function(url, failure, deferred, mediaHandler, params) {
        var router = this;
        var resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey + '&callback=?';
        if (!deferred)
            deferred = $.Deferred();
        var addNewTrack = function(mediaObject) {
            router.playlistObject.addTracks(mediaObject);
        };
        if (!mediaHandler) {
            mediaHandler = addNewTrack;
        }
        if (!params) {
            params = {};
        }
        var ajaxOptions = {
            url: resolveURL,
            error: function(){
                if (failure)
                    failure();
            },
            timeout: 10000,
            dataType: 'jsonp',
            success: function(data, textStatus) {
                if (textStatus == "success") {
                    if (data.streamable === true) {
                        //Tracks have stream URL
                        if (data.stream_url) {
                            router.processSoundCloudTrack(data, mediaHandler, params, deferred, failure);
                        }
                        else {
                            router.processSoundCloudPlaylist(data, mediaHandler, params, deferred, failure);
                        }
                    }
                }
                else {
                    deferred.reject({
                        success: false,
                        error: "Unable to resolve Soundcloud URL."
                    });
                    if (failure)
                        failure();
                }
            }
        };
        $.ajax(ajaxOptions);
        return deferred.promise();
        /*if (queue) {
            queue.add(ajaxOptions);
        }
        else {
            $.ajax(ajaxOptions);
        }*/
        
    },
    resolveYouTube: function(url, failure, deferred, mediaHandler, params) {
        var router = this;
        var beginningURL = "v=";
        var beginningURLLoc = url.indexOf(beginningURL);
        var beginningURLLength = beginningURL.length;
        var idSubstring = url.substring(beginningURLLoc + beginningURLLength);
        var match = idSubstring.match(/[\w\-]+/);
        var addNewTrack = function(mediaObject) {
            router.playlistObject.addTracks(mediaObject);
        };
        if (!deferred)
            deferred = $.Deferred();
        if (match) {
            var youtubeID = match[0];
            if (!mediaHandler) {
                mediaHandler = addNewTrack;
            }
            if (!params) {
                params = {};
            }
            this.processYouTubeVideoID(youtubeID, mediaHandler, params, deferred, failure);
        }
        else {
            if (failure)
                failure();
            deferred.reject({
                success: false,
                error: "YouTube video was not present in URL."
            });
        }
        return deferred.promise();
    },
    setOption: function(option, value) {
        this.opts[option] = value;
    },
    // Diego Perini's URL regex
    // https://gist.github.com/729294
    verifyURL: function(url) {
        return url instanceof String && /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i.test(url);
    }
};
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4", "AI39si5BFyt8MJ8G-sU6ZtLTT8EESCsLT6NS3K8VrA1naS1mIKy5qfsAl6lQ208tIwJQWXuDUebBRee2QNo3CAjQx58KmkxaKw");