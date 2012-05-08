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
    }
});