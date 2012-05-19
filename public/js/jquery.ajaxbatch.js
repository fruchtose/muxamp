/*
 * ajax batch future ideas
 * options:
 *      batchTimeout: default amount of time for amount of time to expect, default 0
 *      executeOnBatchTimeout: bool, should batch request execute on timeout, default true
 *      onBatchTimeout: function, executes when a timeout event occurs, default $.noop
 *      priroity: default priority for executed requests, default 10
 * function add(ajaxOptions, priority): options for an ajax request. decreases expectations by 1. lower priority requests are sent first
 * function expectMore(count, timeout): expect count more requests. if they are not added within timeout period, timeout event occurs. Adding a new request resets the timeout. If timeout is 0 or less, timeout is ignored
 * 
 * AjaxBatch
 * @author Robert Fruchtman
 * @version 0.2
 * Copyright 2012 Robert Fruchtman
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 * Based on the Ajaxmanager project:
 * project-site: http://plugins.jquery.com/project/AjaxManager
 * repository: http://github.com/aFarkas/Ajaxmanager
 * @author Alexander Farkas
 * @version 3.12
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
    "use strict";
    var batches = {};
    
    $.ajaxBatch = (function() {
        var create = function(name, opts){
            batches[name] = new $.ajaxBatch._batch(name, opts);
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
    
    $.ajaxBatch._batch = function(name, opts) {
        this.opts = $.extend({}, $.ajaxBatch.defaults, opts);
        this.batch = [];
        this.requests = {};
        this.inProgress = 0;
        this.name = name;
        this.autoexecuteBatchSize = this.opts.autoexecuteBatchSize;
    }
    
    $.ajaxBatch._batch.prototype = {
        _checkForAutoexecute: function() {
            if (this.opts.executeOnBatchSize && this.batch.length >= this.autoexecuteBatchSize) {
                this.execute();
            }
        },
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
            this._checkForAutoexecute();
        },
        execute: function() {
            var that = this;
            (function() {
                var currentQueue = that.batch.slice(0);
                that.batch = [];
                var dequeueFunction = function() {
                    if (currentQueue.length) {
                        var ajaxFn = currentQueue.shift();
                        if (ajaxFn) {
                            var id = ajaxFn();
                            that.requests[id].always(function() {
                                if (currentQueue.length) {
                                    dequeueFunction();
                                }
                            });
                        }
                    }
                },
                limitingAmount = Math.min(currentQueue.length, (that.opts.queue ? that.opts.maxSimultaneousRequests : Infinity)), 
                i;
                for (i = 0; i < limitingAmount; i++) {
                    dequeueFunction();
                }
            })();
            
            return true;
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
        },
        setAutoexecuteBatchSize: function(count) {
            count = parseInt(count);
            if (count >= 0) {
                this.autoexecuteBatchSize = count;
            }
        }
    };
    
    $.ajaxBatch._batch.prototype.getXHR = $.ajaxBatch._batch.prototype.getData;
    $.ajaxBatch.defaults = {
        abort: $.noop,
        abortIsNoSuccess: true,
        beforeCreate: $.noop,
        domCompleteTrigger: false,
        domSuccessTrigger: false,
        queue: false,
        maxSimultaneousRequests: 1,
        autoexecuteBatchSize: 0,
        executeOnBatchSize: false
    };
    
    $.each($.ajaxBatch._batch.prototype, function(n, fn){
        if(n.indexOf('_') === 0 || !$.isFunction(fn)){
            return;
        }
        $.ajaxBatch[n] =  function(name, o){
            if(!batches[name]){
                if(n === 'add'){
                    $.manageAjax.create(name, o);
                } else {
                    return;
                }
            }
            var args = Array.prototype.slice.call(arguments, 1);
            batches[name][n].apply(batches[name], args);
        };
    });
})(jQuery);