/*
 * ajax batch requirements
 * options:
 *      batchTimeout: default amount of time for amount of time to expect, default 0
 *      executeOnBatchTimeout: bool, should batch request execute on timeout, default true
 *      expected: int, number of requests expected. if user desires, batch will execute when number of requests expected drops to 0. default 0
 *      expectRequests: bool, should system execute batch when number of requests reaches 0. default: false
 *      onBatchTimeout: function, executes when a timeout event occurs, default $.noop
 *      priroity: default priority for executed requests, default 10
 * function add(ajaxOptions, priority): options for an ajax request. decreases expectations by 1. lower priority requests are sent first
 * function execute: executes all ajax requests
 * function expectMore(count, timeout): expect count more requests. if they are not added within timeout period, timeout event occurs. Adding a new request resets the timeout. If timeout is 0 or less, timeout is ignored
 * function expectNone: expectations go to 0. batch executes if specified by user
 */
(function($){
    "use strict";
    var batches = {};
    
    $.batchajax = (function() {
        var create = function(name, opts){
            batches[name] = new $.batchajax._batch(name, opts);
            return batches[name];
        }
		
        var destroy = function(name){
            if(batches[name]){
                batches[name].clear(true);
                delete batches[name];
            }
        }

	var publicFns = {
            create: create,
            destroy: destroy
        };
        return publicFns;
    })();
    
    $.batchajax._batch = function(name, opts) {
        this.opts = $.extend({}, $.batchajax.defaults, opts);
        this.batch = [];
        this.requests = [];
        this.inProgress = 0;
        this.name = name;
        this.expected = this.opts.expected;
    }
    
    $.batchajax._batch.prototype = {
        _complete: function(context, origFn, xhr, status, xhrID, o){
            if(this._isAbort(xhr, status, o)){
                status = 'abort';
                o.abort.call(context, xhr, status, o);
            }
            origFn.call(context, xhr, status, o);
			
            $.event.trigger(this.name +'AjaxComplete', [xhr, status, o]);
			
            if(o.domCompleteTrigger){
                $(o.domCompleteTrigger)
                .trigger(this.name +'DOMComplete', [xhr, status, o])
                .trigger('DOMComplete', [xhr, status, o])
            ;
            }
			
            this._removeXHR(xhrID);
            if(!this.inProgress){
                $.event.trigger(this.name +'AjaxStop');
            }
            xhr = null;
        },
        _createAjax: function(id, o){
            var that = this;
            return function(){
                if(o.beforeCreate.call(o.context || that, id, o) === false){
                    return;
                }
                that.inProgress++;
                if(that.inProgress === 1){
                    $.event.trigger(that.name +'AjaxStart');
                }
                that.requests[id] = $.ajax(o);
                return id;
            };
        },
        _isAbort: function(xhr, status, o){
            if(!o.abortIsNoSuccess || (!xhr && !status)){
                return false;
            }
            var ret = !!(  ( !xhr || xhr.readyState === 0 || this.lastAbort === o.xhrID ) );
            xhr = null;
            return ret;
        },
        _success: function(context, origFn, data, status, xhr, o){
            if(this._isAbort(xhr, status, o)){
                xhr = null;
                return;
            }
            origFn.call(context, data, status, xhr, o);
            $.event.trigger(this.name +'AjaxSuccess', [xhr, o, data]);
            if(o.domSuccessTrigger){
                $(o.domSuccessTrigger)
                .trigger(this.name +'DOMSuccess', [data, o])
                .trigger('DOMSuccess', [data, o])
                ;
            }
            xhr = null;
        },
        _removeXHR: function(xhrID){
            this.inProgress--;
            this.requests[xhrID] = null;
            delete this.requests[xhrID];
        },
        abort: function(id){
            var xhr;
            if(id){
                xhr = this.getData(id);
				
                if(xhr && xhr.abort){
                    this.lastAbort = id;
                    xhr.abort();
                    this.lastAbort = false;
                }
                xhr = null;
                return;
            }
			
            var that 	= this,
            ids 	= []
            ;
            $.each(this.requests, function(id){
                ids.push(id);
            });
            $.each(ids, function(i, id){
                that.abort(id);
            });
        },
        add: function(url, o) {
            if(typeof url == 'object'){
                o = url;
            } else if(typeof url == 'string'){
                if (typeof o == 'number') {
                    o = {};
                }
                o = $.extend(o || {}, {
                    url: url
                });
            }
            o = $.extend({}, this.opts, o);
            
            var origCom		= o.complete || $.noop,
            origSuc		= o.success || $.noop,
            beforeSend	= o.beforeSend || $.noop,
            origError 	= o.error || $.noop,
            strData 	= (typeof o.data == 'string') ? o.data : $.param(o.data || {}),
            xhrID 		= o.type + o.url + strData,
            that 		= this,
            ajaxFn 		= this._createAjax(xhrID, o, origSuc, origCom)
            ;
            
            ajaxFn.xhrID = xhrID;
            o.xhrID = xhrID;
			
            o.beforeSend = function(xhr, opts){
                var ret = beforeSend.call(this, xhr, opts);
                if(ret === false){
                    that._removeXHR(xhrID);
                }
                xhr = null;
                return ret;
            };
            o.complete = function(xhr, status){
                that._complete.call(that, this, origCom, xhr, status, xhrID, o);
                xhr = null;
            };
			
            o.success = function(data, status, xhr){
                that._success.call(that, this, origSuc, data, status, xhr, o);
                xhr = null;
            };
						
            //always add some error callback
            o.error =  function(ahr, status, errorStr){
                var httpStatus 	= '',
                content 	= ''
                ;
                if(status !== 'timeout' && ahr){
                    httpStatus = ahr.status;
                    content = ahr.responseXML || ahr.responseText;
                }
                if(origError) {
                    origError.call(this, ahr, status, errorStr, o);
                } else {
                    setTimeout(function(){
                        throw status + '| status: ' + httpStatus + ' | URL: ' + o.url + ' | data: '+ strData + ' | thrown: '+ errorStr + ' | response: '+ content;
                    }, 0);
                }
                ahr = null;
            };
            this.batch.push(ajaxFn);
            this.expectFewer(1);
        },
        execute: function() {
            var i;
            while (this.batch.length) {
                var ajaxFn = this.batch.shift();
                ajaxFn();
            }
            this.expected = 0;
            
            return true;
        },
        expectFewer: function(count) {
            if (this.opts.expectRequests) {
                count = parseInt(count);
                if (count > 0) {
                    this.expected-= count;
                    this.epected = Math.max(0, this.expected);
                    if (this.expected === 0) {
                        this.execute();
                    }
                }
            }
            return this.expected;
        },
        expectMore: function(count) {
            if (this.opts.expectRequests) {
                count = parseInt(count);
                if (count > 0) {
                    this.expected += count;
                }
            }
            return this.expected;
        },
        expectNone: function() {
            return this.expectFewer(this.expected);
        },
        getData: function(id){
            if( id ){
                var ret = this.requests[id];
                return ret;
            }
            return {
                requests: this.requests,
                inProgress: this.inProgress
            };
        }
    };
    
    $.batchajax._batch.prototype.getXHR = $.batchajax._batch.prototype.getData;
    $.batchajax.defaults = {
        abort: $.noop,
        abortIsNoSuccess: true,
        beforeCreate: $.noop,
        domCompleteTrigger: false,
        domSuccessTrigger: false,
        expected: 0,
        expectRequests: false
    };
    
    $.each($.batchajax._batch.prototype, function(n, fn){
        if(n.indexOf('_') === 0 || !$.isFunction(fn)){
            return;
        }
        $.batchajax[n] =  function(name, o){
            if(!managed[name]){
                if(n === 'add'){
                    $.manageAjax.create(name, o);
                } else {
                    return;
                }
            }
            var args = Array.prototype.slice.call(arguments, 1);
            managed[name][n].apply(managed[name], args);
        };
    });
})(jQuery);