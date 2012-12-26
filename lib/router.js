var _ = require('underscore')._,
    Q = require('q'),
	url = require('url'),
    apis = require('./apis');
	
_.str = require('underscore.string');

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
    get: function(url, mediaHandler, excludedSites) {
        url || (url = "");
        var success = false;
        var deferred = Q.defer();
        mediaHandler = mediaHandler || function(data) {return data;};
        var isString = typeof url == "string", isUrl = false;
        if (isString) {
            url = _.str.trim(url.toString());
            isUrl = verifyUrl(url);
        }
        if (url) {
            if (isUrl || url.key && url.value) {
                var func = this.testResource(url, excludedSites);
                if (func) {
                    deferred = func({query: url})
                    deferred.then(mediaHandler);
                    success = true;
                }
            }
        }
        if (!success) {
            if (url && !isUrl && verifyUrl('http://' + url)) {
                return this.get('http://' + url);
            }
            deferred.reject({
                success: false,
                error: "The resource submitted could not be identified."
            });
            deferred = deferred.promise;
        }
        return deferred;
    },
    addRoutes: function(routes) {
        var newRoutes =  _.clone(routes) || {};
        this.routingTable = _.extend({}, (this.routingTable || {}, newRoutes));
    },
    testResource: function(input, exclusions) {
        // Finds the first routing function from the routing table, 
        // possibly excluding some routes beforehand
        if (!exclusions) {
            exclusions = [];
        } else if (!_.isArray(exclusions)) {
            exclusions = [exclusions];
        }
        var route, callback = null, possibleRoutes = {}, i, j;
         _.each(this.routingTable, function(route, siteCode) {
            if (!_.contains(exclusions, siteCode)) {
                possibleRoutes[siteCode] = route;
            }
        });
        route = _.find(possibleRoutes, function(route, siteCode, list) {
            var accepted = route.locate(input);
            return accepted;
        });
        route && (callback = route.request);
        return callback;
    },
};

module.exports = {
	getRouter: function() {
		return new Router(apis.streams);
	},
	getURLParams: function(source, useOrderedList) {
		return getURLParams(source, useOrderedList);
	}
};