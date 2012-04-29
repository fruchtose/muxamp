function Router (playlist, soundManager, soundcloudConsumerKey, youtubeKey) {
    var defaults = {
      expectationsMode: false  
    };
    
    this.opts = $.extend({}, defaults);
    this.expected = 0;
    this.soundManager = (typeof soundManager === 'object') ? soundManager : null;
    this.soundcloudConsumerKey = soundcloudConsumerKey != "" ? soundcloudConsumerKey : "";
    this.playlistObject = playlist != null ? playlist : new Playlist();
    this.youtubeKey = youtubeKey != null ? youtubeKey : "";
    this.lastRedditRequest = new Date(0);  
    
    var buildRoutingTable = function() {
        var router = this;
        var failure = function(url) {
            alert("Unable to add track from specified URL " + url);
        };
        var table = [];
        table.push({
            site: 'Reddit',
            test: function(url) {
                return url.indexOf("reddit.com/r/") >= 0;
            },
            action: function(url) {
                router.resolveReddit(url, function() {
                    failure(url);
                });
            }
        });
        table.push({
            site: 'SoundCloud',
            test: function(url) {
                return url.indexOf("soundcloud.com/") >= 0;
            },
            action: function(url) {
                router.resolveSoundCloud(url, function() {
                    failure(url);
                });
            }
        });
        table.push({
            site: 'YouTube',
            test: function(url) {
                return /youtube\.com\/watch\\?/.test(url) && /v=[\w\-]+/.test(url);
            },
            action: function(url) {
                router.resolveYouTube(url, function() {
                    failure(url);
                });
            }
        });
        return table;
    }
    
    this.routingTable = (function() {
        return buildRoutingTable();
    })();
}

Router.prototype = {
    addTrack: function(url) {
        var success = false;
        var failure = function() {
            alert("Unable to fetch content from " + url + ".");
        }
        url = $.trim(url.toString());
        if (this.verifyURL(url)) {
            var entry;
            for (entry in this.routingTable) {
                var route = this.routingTable[entry];
                if (route.test(url)) {
                    route.action(url);
                    success = true;
                    break;
                }
            }
        }
        if (!success) {
            if (this.verifyURL('http://' + url)) {
                this.addTrack('http://' + url);
            }
            else if (this.verifyURL('http://www.' + url)) {
                this.addTrack('http://' + url);
            }
            else {
                failure();
            }
        }
        return success;
    },
    expectFewerRequests: function(count) {
        if (this.opts.expectationsMode) {
            count = parseInt(count);
            if (count > 0) {
                this.expected-= count;
                this.epected = Math.max(0, this.expected);
                if (this.expected === 0) {
                    $.event.trigger('routerAjaxStop');
                }
                else if (this.expected < 0) {
                    $.event.trigger('routerOverflow');
                }
            }
        }
        return this.expected;
    },
    expectMoreRequests: function(count) {
        if (this.opts.expectationsMode) {
            count = parseInt(count);
            if (count > 0) {
                this.expected += count;
            }
        }
        return this.expected;
    },
    expectNoRequests: function() {
        return this.expectFewer(this.expected);
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
    processRedditLink: function(url, mediaHandler, params, queue, failure) {
        var router = this;
        var resolveURL = url + ".json?limit=25&jsonp=?";
        var error = function() {
            if (failure)
                failure();
        };
        var success = function(data, textStatus) {
            if (textStatus != "success") {
                if (failure)
                    failure();
                return;
            }

            if (data.error == "404") {
                if (failure)
                    failure();
                return;
            }

            if ( !(data.kind && data.kind == 'Listing' && data.data && data.data.children) ) {
                if (failure) {
                    failure();
                    return;
                }
            }
            
            var item;
            var entries = $.grep(data.data.children, function(element) {
                var link = element.data.url;
                return (link.indexOf('soundcloud.com/') >= 0) || (/youtube\.com\/watch\\?/.test(link) && /v=[\w\-]+/.test(link));
            });
            router.expectMoreRequests(entries.length);
            for (item in entries) {
                var entry = entries[item].data;
                var link = entry.url;
                var newParams = {trackIndex: item};
                if (link.indexOf('soundcloud.com/') >= 0) {
                    router.resolveSoundCloud(link, failure, queue, mediaHandler, newParams);
                }
                else if(/youtube\.com\/watch\\?/.test(link) && /v=[\w\-]+/.test(link)) {
                    router.resolveYouTube(link, failure, queue, mediaHandler, newParams);
                }
            }
        };
        while (new Date() - router.lastRedditRequest < 2000) {}
        router.lastRedditRequest = new Date();
        $.ajax({
            url: resolveURL,
            data: null,
            dataType: 'json'
        }).success(success).error(error);
    },
    processSoundCloudPlaylist: function(playlistID, mediaHandler, params, queue, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var addPlaylistData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.tracks && data.tracks.length > 0) {
                    $.each(data.tracks, function(index, track) {
                        router.processSoundCloudTrack(track, mediaHandler, params, queue, failure);
                    });
                }
                else if (failure)
                    failure();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof playlistID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/playlists/' + playlistID + ".json?consumer_key=" + consumerKey + '&callback=?';
            var options = {
                url: resolveURL,
                error: function() {
                    failure();
                },
                dataType: 'jsonp',
                success: function(data, textStatus) {
                    if (textStatus == "success") {
                        addPlaylistData(data);
                    }
                    else if (failure)
                        failure();
                },
                timeout: 10000
            };
            $.ajax(options);
        }
        // If a data object is provided, the track data is fetched from it
        else addPlaylistData(playlistID);
    },
    processSoundCloudTrack: function(trackID, mediaHandler, params, queue, failure) {
        var consumerKey = this.soundcloudConsumerKey;
        var router = this;
        var success = false;
        var addTrackData = function(data) {
            if (data.streamable === true) {
                //Tracks have stream URL
                if (data.stream_url) {
                    router.allocateNewTracks(1);
                    var id = router.getNewTrackID();
                    var trackObject = new SoundCloudObject(id, data.stream_url, consumerKey, data, soundManager);
                    mediaHandler && mediaHandler.apply(this, [trackObject].concat(params['trackIndex']));
                    success = true;
                }
                else if (failure)
                    failure();
            }
        };
        // If a data object is not provided, the data is fetched using the id
        if (typeof trackID == 'string') {
            var resolveURL = 'http://api.soundcloud.com/tracks/' + trackID + ".json?consumer_key=" + consumerKey + '&callback=?';
            var options = {
                url: resolveURL,
                dataType: 'jsonp',
                complete: function() {
                    router.expectFewerRequests(1);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    if (failure)
                        failure();
                },
                success: function(data, textStatus) {
                    if (textStatus == "success") {
                        addTrackData(data);
                    }
                    else if (failure)
                        failure();
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
        return success;
    },
    processYouTubeVideoID: function(youtubeID, mediaHandler, params, queue, failure) {
        var router = this;
        var youtubeAPI = 'https://gdata.youtube.com/feeds/api/videos/' + youtubeID + '?v=2&alt=json';
        var success = false;
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
                router.allocateNewTracks(1);
                var id = router.getNewTrackID();
                var trackObject = new YouTubeObject(id, youtubeID, author, title, duration);
                mediaHandler && mediaHandler.apply(this, [trackObject].concat(params['trackIndex']));
                success = true;
            },
            error: function() {
                if (failure)
                    failure();
            },
            complete: function() {
                router.expectFewerRequests(1);
            }
        };
        $.ajax(options);
        /*if (queue) {
            queue.add(options);
        }
        else {
            $.ajax(options);
        }*/
        return success;
    },
    resolveReddit: function(url, failure) {
        var router = this;
        var addNewTrack = function(mediaObject) {
            router.playlistObject.addTracks(mediaObject);
        };
        this.processRedditLink(url, addNewTrack, {}, false, failure);
    },
    resolveSoundCloud: function(url, failure, queue, mediaHandler, params) {
        var router = this;
        var resolveURL = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + this.soundcloudConsumerKey + '&callback=?';
        var ajaxOptions = {
            url: resolveURL,
            complete: function() {
                router.expectFewerRequests(1);
            },
            error: function(){
                if (failure)
                    failure();
            },
            timeout: 10000,
            dataType: 'jsonp',
            success: function(data, textStatus) {
                var addNewTrack = function(mediaObject) {
                    router.playlistObject.addTracks(mediaObject);
                };
                if (textStatus == "success") {
                    if (data.streamable === true) {
                        //Tracks have stream URL
                        if (data.stream_url) {
                            if (queue) {
                                router.processSoundCloudTrack(data, mediaHandler, params, false, failure);
                            }
                            else {
                                router.processSoundCloudTrack(data, addNewTrack, {}, false, failure);
                            }
                        }
                        else {
                            if (queue) {
                                router.processSoundCloudPlaylist(data, mediaHandler, params, false, failure);
                            }
                            else {
                                router.processSoundCloudPlaylist(data, addNewTrack, {}, false, failure);
                            }
                        }
                    }
                }
                else if (failure)
                    failure();
            }
        };
        $.ajax(ajaxOptions);
        /*if (queue) {
            queue.add(ajaxOptions);
        }
        else {
            $.ajax(ajaxOptions);
        }*/
        
    },
    resolveYouTube: function(url, failure, queue, mediaHandler, params) {
        var router = this;
        var beginningURL = "v=";
        var beginningURLLoc = url.indexOf(beginningURL);
        var beginningURLLength = beginningURL.length;
        var idSubstring = url.substring(beginningURLLoc + beginningURLLength);
        var match = idSubstring.match(/[\w\-]+/);
        var canBeSearched = false;
        var addNewTrack = function(mediaObject) {
            router.playlistObject.addTracks(mediaObject);
        };
        if (match) {
            canBeSearched = true;
            var youtubeID = match[0];
            if (queue) {
                this.processYouTubeVideoID(youtubeID, mediaHandler, params, queue, failure);
            }
            else {
                this.processYouTubeVideoID(youtubeID, addNewTrack, {}, false, failure);
            }
        }
        else if (failure)
            failure();
        return canBeSearched;
    },
    setOption: function(option, value) {
        this.opts[option] = value;
    },
    verifyURL: function(url) {
        return /^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
    }
};
var router = new Router(playlist, soundManager, "2f9bebd6bcd85fa5acb916b14aeef9a4", "AI39si5BFyt8MJ8G-sU6ZtLTT8EESCsLT6NS3K8VrA1naS1mIKy5qfsAl6lQ208tIwJQWXuDUebBRee2QNo3CAjQx58KmkxaKw");