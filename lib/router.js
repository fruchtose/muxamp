var _ = require('underscore'),
    Q = require('q'),
    url = require('url'),
    apis = require('./apis');
    
_.str = require('underscore.string');

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

function KeyValuePair(key, value) {
    this.key = key;
    this.value = value;
}

KeyValuePair.prototype.toString = function() {
    return "(" + this.key.toString() + "=" + this.value.toString() + ")";
}

var verifyUrl = function(input) {
    if (! _.isString(input)) {
        return false;
    }
    var parsed = url.parse(input);
    return (parsed && parsed.href);
};

var Router = function(routingOptions) {
    this.addRoutes(routingOptions || []);
}

Router.prototype = {
    get: function(url, excludedSites) {
        if (!excludedSites) {
            excludedSites = [];
        } else if (!_.isArray(excludedSites)) {
            excludedSites = [excludedSites];
        }
        url || (url = '');
        var success = false,
            deferred = Q.defer(),
            isString = typeof url == "string",
            isUrl = false;
        if (isString) {
            url = _.str.trim(url.toString());
            isUrl = verifyUrl(url);
        }
        if (url && (isUrl || (_(url).has('key') && _(url).has('value')))) {
            var callback = this.testResource(url, excludedSites);
            if (callback) {
                return callback({query: url});
            }
        }
        if (url && !isUrl && isString && verifyUrl('http://' + url)) {
            return this.get('http://' + url);
        }

        deferred.reject(new Error("The resource submitted could not be identified."));
        return deferred.promise;
    },
    addRoutes: function(routes) {
        var newRoutes =  _.clone(routes) || {},
            table = this.routingTable || {};
        this.routingTable = _.extend({}, table, newRoutes);
    },
    testResource: function(input, exclusions) {
        // Finds the first routing function from the routing table, 
        // possibly excluding some routes beforehand
        if (!exclusions) {
            exclusions = [];
        } else if (!_.isArray(exclusions)) {
            exclusions = [exclusions];
        }
        var route = _.chain(this.routingTable).reject(function(route, siteCode) {
            return _.contains(exclusions, siteCode);
        }).find(function(route) {
            return route.locate(input);
        }).value();
        if (route) {
            return route.request;
        }
        return null;
    },
};

module.exports = {
    getRouter: function() {
        return new Router(apis.streams);
    },
    getURLParams: getURLParams,
    KeyValuePair: KeyValuePair
};