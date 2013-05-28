var SearchResult    = require('./searchresult').SearchResult,
    _               = require('underscore'),
    Q               = require('q'),
    request         = require('request'),
    urlParser       = require('url'),
    cacher          = require('node-dummy-cache'),
    config          = require('./config');

function QuotaError(site) {
    this.name = 'QuotaError';
    this.message = 'Too many API calls to ' + site;
}

QuotaError.prototype = Error.prototype;

var getSeparatedWords = function(query) {
    return query.replace(/[^\w\s]|_/g, ' ').toLowerCase().split(' ');
};

var missingProperties = function(object, expected) {
    return _.reject(expected, function (element) {
        return object[element] != null;
    }).toString();
}

var verifyUrl = function(input) {
    if (! _.isString(input)) {
        return false;
    }
    var parsed = urlParser.parse(input);
    return (parsed && parsed.href);
};

// See http://stackoverflow.com/questions/13320015/how-to-write-a-debounce-service-in-angularjs
var debouncePromiser = function(func, wait, immediate) {
    var self = this,
        timeout,
        args = _(arguments).toArray();
        dfd = Q.defer();

    return function() {
        function later() {
            timeout = null;
            if (!immediate) {
                dfd.resolve(func.apply(self, arguments));
                dfd = Q.defer();
            }
        }

        var now = immediate && !timeout;
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
        if (now) {
            dfd.resolve(func.apply(self, arguments));
            dfd = Q.defer();
        }
        return dfd.promise;
    };
};

var StreamApi = function(params){
    var defaultOptions = {
        json: true,
        method: 'GET',
        timeout: 12000,
        url: ''
    };
    var fifteenMinutes = cacher.ONE_SECOND * 60 * 30;
    params.identityMap = cacher.create(fifteenMinutes * 2, fifteenMinutes);
    this.options = _.extend({}, defaultOptions, params.options || {});
    _.extend(this, _.omit(params, 'options'));
    if (_.isFinite(this.options.debounce)) {
        this.callApi = debouncePromiser(this.callApi, this.options.debounce);
    }
};

StreamApi.prototype = {
    callApi: function(options) {
        return Q.nfcall(request, options);
    },
    getOne: function(entry) {return null;},
    locate: function(input, promise) {
        var url;
        if (_.isString(input) && verifyUrl(input) && (url = this.ownsUrl(input))) {
            return promise ? Q.fcall(this.resolveUrl, url) : true;
        } else {
            return this.ownsMedia(input, promise);
        }
    },
    ownsMedia: function(media, promise) {
        var match = media && media.key && media.key == this.siteCode && media.value;

        // Returns if no promise needed
        if (!promise) {
            return !!match;
        }

        var deferred = Q.defer();
        if (match) {
            deferred.resolve(_.pick(media, 'key', 'value'));
        } else {
            deferred.reject();
        }
        return deferred.promise;
    },
    ownsUrl: function(url) {
        return false;
    },
    request: function(params) {
        var api = this, callback, options, url, cached = false;
        callback = api.getOne;
        return this.locate(params.query, true).then(function(resource) {
            cached = api.identityMap.get(params.query);
            if (cached) {
                return cached;
            }
            url = api.url(resource);
            options = _.extend({}, api.options, {url: url});
            return api.callApi(options);
        }).then(function(args) {
            if (cached) {
                return cached;
            }
            var body = args[1];
            var results = callback(body);
            if (!results) {
                throw new Error('There was a problem getting search results.');
            }
            return results;
        }).then(function(tracks) {
            _.isArray(tracks) || (tracks = [tracks]);
            if (!cached && tracks) {
                api.identityMap.put(params.query, tracks);
            }
            return {tracks: tracks};
        });
    },
    resolveUrl: function(url) {
        throw new Error('Nop');
    },
    siteCode: 'nope',
    url: function(options) {return '';}
};

var SearchApi = function(params){
    var defaultOptions = {
        json: true,
        method: 'GET',
        timeout: 15000,
        url: ''
    };
    this.options = _.extend({}, defaultOptions, params.options || {});
    _.extend(this, _.omit(params, 'options'));
    if (_.isFinite(this.options.debounce)) {
        this.callApi = debouncePromiser(this.callApi, this.options.debounce);
    }
};

SearchApi.prototype = {
    callApi: function(options) {
        return Q.nfcall(request, options);
    },
    callback: function() {return function() {};},
    checkedProperties: [],
    consumerKey: '',
    search: function(params) {
        var api = this, deferred, callback, options, url;
        deferred = Q.defer();
        if ( !(params && params.query && _.isNumber(params.page) && _.isNumber(params.perPage)) ) {
            deferred.reject(new Error('Search parameters must include a query, page number, and results per page.'));
            return deferred.promise;
        }
        callback = api.callback;
        url = this.url(params);
        options = _.extend({}, this.options, {url: url});
        return api.callApi(options).then(function(args) {
            var body = args[1];
            var results = callback(body);
            if (!results) {
                throw new Error('There was a problem getting search results.');
            }
            return results;
        }).then(function(tracks) {
            return {tracks: api.sort(tracks, params)};
        });
    },
    sort: function(tracks, options) {
        if (!(tracks && tracks.length)) {
            return [];
        }
        // Ensures that no errors are contained in the search results
        tracks = _.filter(tracks, function(track){
            return _.has(track, 'stats');
        });

        var allFavorites = 0,
            allPlaybacks = 0,
            avgFavorites = 0,
            avgPlaybacks = 0,
            maxPlays = 0,
            maxFavorites = 0,
            missingPlays = [],
            queryWords = getSeparatedWords(options.query);
        _(tracks).each(function(result) {
            var resultWords, intersection;
            resultWords = getSeparatedWords(result.author + ' ' + result.mediaName);
            intersection = _.intersection(queryWords, resultWords);
            result.stats.querySimilarity = intersection.length / queryWords.length;
            if (result.stats.plays == 0) {
                missingPlays.push(result);
            } else {
                allFavorites += result.stats.favorites;
                allPlaybacks += result.stats.plays;
            }
        });
        avgFavorites = allFavorites / tracks.length || 0;
        avgPlaybacks = allPlaybacks / tracks.length || 0;
        // If a track is missing playbacks, we give it the average number of plays/favorites
        // with a slight penalty; we devide by the number of total tracks, 
        // not the number with recorded values.
        _(missingPlays).each(function(track, i) {
            tracks[i].stats.favorites = avgFavorites;
            tracks[i].stats.plays = avgPlaybacks;
        });

        maxPlays = _(tracks).max(function(result) {
            return result.stats.plays || 0;
        }).stats.plays;
        maxFavorites = _(tracks).max(function(result) {
            return result.stats.favorites || 0;
        }).stats.favorites;
        return _.chain(tracks).map(function(result) {
            // Calculates relevance of each track
            result.stats.playRelevance = Math.log(result.stats.plays + Math.E) / Math.log(maxPlays + Math.E);
            result.stats.favoriteRelevance = Math.log(result.stats.favorites + Math.E) / Math.log(maxFavorites + Math.E);
            result.calculateRelevance();
            return result;
        }).sortBy(function(result) {
            // Sorts tracks by relevance
            return result.stats.relevance;
        }).reverse().map(function(result) {
            // Deletes unnecessary properties to minimize data sent over the wire
            delete result.stats;
            return result;
        }).value();
    },
    url: function(options) {return '';}
};

var Jamendo = new function() {
    var checkedProperties = ['id', 'audio'], 
        consumerKey = config.get('muxamp:apis:jamendo:clientId'),
        regex = /^http(s)?:\/\/(www.)?jamendo\.com\/(\w{2}\/)?track\/(\d+)/;

    var queryArray = [
        'client_id=' + consumerKey,
        'format=json',
        'audioformat=mp32',
        'include=stats'
    ];

    var getOne = function(entry) {
        var params,
            missingProps = missingProperties(entry, checkedProperties);
        if (missingProps) {
            throw new Error('Jamendo entry ' + (entry.id || 'unknown') + ' is missing properties: ' + JSON.stringify(missingProps));
        }

        params = {
            author: entry.artist_name,
            duration: entry.duration,
            favorites: entry.stats.favorited,
            icon: 'img/jamendo_16.png',
            mediaName: entry.name,
            permalink: 'http://jamendo.com/track/' + entry.id,
            plays: entry.stats.rate_listened_total,
            siteCode: 'jmt',
            siteMediaID: entry.id,
            type: 'audio',
            url: 'http://api.jamendo.com/v3.0/tracks/file?client_id=' + consumerKey + '&id=' + entry.id
        };
        return new SearchResult(params);
    };
    var trackStreamApi = new StreamApi({
        debounce: 250,
        getOne: function(body) {
            return getOne(_.first(body.results));
        },
        ownsUrl: function(input) {
            var matches = input.match(regex);
            return matches ? matches[0] : false;
        },
        resolveUrl: function(url) {
            var trackId = null,
                base = 'http://jamendo.com/track/',
                matches = url.match(regex),
                resolved = base;

            if (matches) {
                resolved += matches[4];
            }
            return {url: resolved};
        },
        siteCode: 'jmt',
        url: function(options) {
            var id;
            if (options.url) {
                id = options.url.match(regex)[4];
            } else {
                id = options.value;
            }
            return 'http://api.jamendo.com/v3.0/tracks/?' + queryArray.concat(['id=' + id]).join('&');
        }
    });
    var searchApi = new SearchApi({
        debounce: 250,
        callback: function(body) {
            var self = this;
            if (body.headers && body.headers.error_message && body.headers.error_message.length) {
                return {error: body.headers.error_message};
            }
            _.isArray(body.results) || (body.results = [body.results]);
            var searchResults = _(body.results).map(function(entry) {
                try {
                    return getOne.call(self, entry);
                } catch(err) {
                    return {error: err.message};
                }
            });
            return searchResults;
        },
        url: function(options) {
            var query = options.query,
                page = options.page,
                perPage = options.perPage;
            var url = 'http://api.jamendo.com/v3.0/tracks/?' + queryArray.concat([
                'limit=' + perPage,
                'offset=' + (page * perPage + 1).toString(),
                'search=' + encodeURIComponent(query)
            ]).join('&');
            return url;
        }
    });

    var Tracks = {
        search: function(options) {
            return searchApi.search(options);
        },
        streams: {
            locate: function(input) {
                return trackStreamApi.locate(input, false);
            },
            request: function(options) {
                return trackStreamApi.request(options);
            },
        },
        siteCode: 'jmt'
    };
    this.Tracks = Tracks;
    this.toString = function() {
        return "Jamendo";
    };
};

var SoundCloud = new function() {
    var checkedProperties, consumerKey;
    checkedProperties = [
    'stream_url', 'permalink_url', 'streamable'
    ];
    consumerKey = config.get('muxamp:apis:soundcloud:clientId');
    var getOne = function(entry) {
        if (entry.kind != 'track') {
            throw new Error('Expected a SoundCloud track.');
        }
        if ( !(entry.streamable == true && entry.stream_url) ) {
            throw new Error('SoundCloud track not streamable.');
        }
        var missingProps, options;
        missingProps = missingProperties(entry, checkedProperties);
        if (missingProps) {
            throw new Error('SoundCloud entry ' + (entry.id || 'unknown') + ' is missing properties: ' + JSON.stringify(missingProps));
        }
        options = {
            author: entry.user.username,
            duration: entry.duration / 1000,
            favorites: entry.favoritings_count,
            icon: 'img/soundcloud_orange_white_16.png',
            mediaName: entry.title,
            permalink: entry.permalink_url,
            plays: entry.playback_count,
            siteCode: 'sct',
            siteMediaID: entry.id,
            type: 'audio',
            url: entry.stream_url + "?client_id=" + consumerKey
        };
        return new SearchResult(options);
    };
    var trackStreamApi = new StreamApi({
        getOne: getOne,
        ownsUrl: function(input) {
            var httpTest = /http(s)?:\/\/(www\.|api\.)?soundcloud\.com\/(.*)?/,
                httpMatch = input.match(httpTest),
                trackFormat = /soundcloud\.com\/([^\/]+\/[^\/]+|tracks\/\d+)/,
                apiFormat = /api\.soundcloud.com\/(tracks\/\d+)\/(download)?/;
            // Checks to see if URL matches broadest class possible
            if (httpMatch) {
                var prefix = httpMatch[2] || '',
                    apiMatch = input.match(apiFormat);
                // If API regex matched, get the track number
                if (apiMatch) {
                    // tracks/<number>
                    input = apiMatch[1];
                // If non-API matched, get regular track link
                } else {
                    // <user> / <track name>
                    input = httpMatch[3];
                }
                input = 'http://' + prefix + 'soundcloud.com/' + input;
                return trackFormat.test(input) ? input : false;
            }
            var playerTest = /http(s)?:\/\/w\.soundcloud\.com\/player(\/)?\?url=(http%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F\d+)/,
                playerMatch = input.match(playerTest);
            if (playerMatch) {
                return decodeURIComponent(playerMatch[3]);
            }
            var flashPlayerTest = /http(s)?:\/\/(player|p.*)\.soundcloud\.com\/player\.swf(\/)?\?url=(http%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F\d+)/,
                flashPlayerMatch = input.match(flashPlayerTest);
            if (flashPlayerMatch) {
                return decodeURIComponent(flashPlayerMatch[4]);
            }
        },
        resolveUrl: function(url) {
            var processed = '';
            if (_.str.include('api.soundcloud.com/tracks/')) {
                processed = url + '.json?';
            } else if (url && url.length) {
                processed = 'http://api.soundcloud.com/resolve?url=' + url + '&format=json&';
            } else {
                throw new Error('SoundCloud track could not be used.')
            }
            processed += 'consumer_key=' + consumerKey;
            return {url: processed};
        },
        siteCode: 'sct',
        url: function(options) {
            if (options.url) {
                // Returns URL if it there was an API lookup
                return options.url;
            } else {
                // Otherwise, options contains a key/value pair. The value is the media ID
                return 'http://api.soundcloud.com/tracks/' + options.value + ".json?consumer_key=" + consumerKey;
            }
        }
    });
    var searchApi = new SearchApi({
        callback: function(body) {
            var api = this;
            if (!body.length) {
                return [];
            }
            var allPlaybacks = 0,
                avgPlaybacks = 0,
                missingPlays = [],
                searchResults;
            searchResults = _(body).map(function(entry) {
                try {
                    return getOne.call(api, entry);
                } catch(err) {
                    return {
                        error: err.message
                    };
                }
            });
            return searchResults;
        },
        url: function(options) {
            var query = options.query,
            page = options.page,
            perPage = options.perPage;
            return 'http://api.soundcloud.com/tracks.json?client_id=' + consumerKey + '&limit=' + 
                perPage + '&filter=streamable&order=hotness&offset=' + (perPage * page + 1) + 
                '&q=' + encodeURIComponent(query);
        }
    });
    var Tracks = {
        search: function(options) {
            return searchApi.search(options);
        },
        streams: {
            locate: function(input) {
                return trackStreamApi.locate(input, false);
            },
            request: function(options) {
                return trackStreamApi.request(options);
            },
        },
        siteCode: 'sct'
    };
    this.Tracks = Tracks;
    this.toString = function() {
        return "SoundCloud";
    };
};

var YouTube = new function() {
    var checkedProperties = [
        'uploader', 'title', 'viewCount', 'favoriteCount', 'duration', 'accessControl'
    ];
    var getOne = function(entry) {
        var id = entry.id, missingProps = missingProperties(entry, checkedProperties);
        if (entry.accessControl && entry.accessControl.embed != 'allowed') {
            throw new Error('YouTube entry ' + id + ' cannot be embedded.');
        }
        if (missingProps) {
            throw new Error('YouTube entry ' + id + ' is missing properties: ' + JSON.stringify(missingProps));
        }
        var permalink = 'http://www.youtube.com/watch?v=' + id, options, searchResult;
        options = {
            author: entry.uploader,
            duration: parseInt(entry.duration),
            favorites: entry.favoriteCount,
            icon: 'img/youtube.png',
            mediaName: entry.title,
            permalink: permalink,
            plays: entry.viewCount,
            siteCode: 'ytv',
            siteMediaID: id,
            type: 'video',
            url: permalink
        };
        return new SearchResult(options);
    }
    var trackStreamApi = new StreamApi({
        getOne: function(body) {
            if (!body.data && /too_many_recent_calls/.test(body)) {
                throw new QuotaError('YouTube');
            }
            return getOne(body.data);
        },
        ownsUrl: function(url) {
            // Thanks to mantish
            // http://stackoverflow.com/a/9102270/959934
            var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?(.*&)?v=)([^#\&\?]*).*/;
            var match = url.match(regex);
            if (match&&match[3].length==11){
                // If success, returns YouTube ID
                return match[3];
            } else{
                return false;
            }
        },
        options: {
            strictSSL: false,
        },
        // Only has YouTube id after ownsUrl is called
        resolveUrl: function(id) {
            return {key: 'ytv', value: id};
        },
        siteCode: 'ytv',
        url: function(options) {
            var id = options.value;
            return 'http://gdata.youtube.com/feeds/api/videos/' + id + '?v=2&alt=jsonc';
        }
    });
    var searchApi = new SearchApi({
        checkedProperties: [
            'author', 'title', 'yt$statistics', 'media$group'
        ],
        callback: function(body) {
            var api = this;
            if ( !(body.data && body.data.items && body.data.items.length) ) {
                return [];
            }
            return _.chain(body.data.items).map(function(entry) {
                try {
                    return getOne.call(api, entry);
                } catch (err) {
                    return {
                        error: err.message
                    };
                }
                
            }).compact().value();
        },
        options: {
            strictSSL: false,
        },
        url: function(options) {
            var query = options.query,
            page = options.page,
            perPage = options.perPage;
            return 'http://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=' + 
                perPage + '&orderby=relevance&alt=jsonc&start-index=' + (perPage * page + 1) + 
                '&q=' + encodeURIComponent(query);
        }
    });
    var Tracks = {
        search: function(options) {
            return searchApi.search(options);
        },
        streams: {
            locate: function(input) {
                return trackStreamApi.locate(input, false);
            },
            request: function(options) {
                return trackStreamApi.request(options);
            },
        },
        siteCode: 'ytv'
    };
    this.Tracks = Tracks;
    this.toString = function() {
        return "YouTube";
    };
};

var siteCodeTable = _.chain([SoundCloud, YouTube, Jamendo]).map(function(api) {
    var tracks = api.Tracks;
    return [tracks.siteCode, tracks.streams];
}).object().value();

module.exports = {
    streams: siteCodeTable,
    Jamendo: Jamendo,
    SoundCloud: SoundCloud,
    YouTube: YouTube
}