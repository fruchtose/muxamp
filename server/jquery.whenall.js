var $ = jQuery = module.exports = require('jquery-deferred');

$.extend({
    whenAll: function( firstParam ) {
        var sliceDeferred = [].slice,
        args = sliceDeferred.call( arguments, 0 ),
        i = 0,
        length = args.length,
        pValues = new Array( length ),
        count = length,
        pCount = length,
        deferred = length <= 1 && firstParam && $.isFunction( firstParam.promise ) ?
        firstParam :
        $.Deferred(),
        promise = deferred.promise();
        function resolveFunc( i ) {
            return function( value ) {
                args[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
                if ( !( --count ) ) {
                    deferred.resolveWith( deferred, args );
                }
            };
        }
        function progressFunc( i ) {
            return function( value ) {
                pValues[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
                deferred.notifyWith( promise, pValues );
            };
        }
        if ( length > 1 ) {
            for ( ; i < length; i++ ) {
                if ( args[ i ] && args[ i ].promise && $.isFunction( args[ i ].promise ) ) {
                    args[ i ].promise().then( resolveFunc(i), resolveFunc(i), progressFunc(i) );
                } else {
                    --count;
                }
            }
            if ( !count ) {
                deferred.resolveWith( deferred, args );
            }
        } else if ( deferred !== firstParam ) {
            deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
        }
        return promise;
    },
    extend: function () {
	    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
	        i = 1,
	        length = arguments.length,
	        deep = false;
	
	    // Handle a deep copy situation
	    if (typeof target === "boolean") {
	        deep = target;
	        target = arguments[1] || {};
	        // skip the boolean and the target
	        i = 2;
	    }
	
	    // Handle case when target is a string or something (possible in deep copy)
	    if (typeof target !== "object" && !jQuery.isFunction(target)) {
	        target = {};
	    }
	
	    // extend jQuery itself if only one argument is passed
	    if (length === i) {
	        target = this;
	        --i;
	    }
	
	    for (; i < length; i++) {
	        // Only deal with non-null/undefined values
	        if ((options = arguments[i]) != null) {
	            // Extend the base object
	            for (name in options) {
	                src = target[name];
	                copy = options[name];
	
	                // Prevent never-ending loop
	                if (target === copy) {
	                    continue;
	                }
	
	                // Recurse if we're merging plain objects or arrays
	                if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
	                    if (copyIsArray) {
	                        copyIsArray = false;
	                        clone = src && jQuery.isArray(src) ? src : [];
	
	                    } else {
	                        clone = src && jQuery.isPlainObject(src) ? src : {};
	                    }
	
	                    // Never move original objects, clone them
	                    target[name] = jQuery.extend(deep, clone, copy);
	
	                    // Don't bring in undefined values
	                } else if (copy !== undefined) {
	                    target[name] = copy;
	                }
	            }
	        }
	    }
	
	    // Return the modified object
	    return target;
	},
    trim: function(text) {
    	return text == null ? "" : text.replace(/^\s+|\s+$/g, '');
    }
});