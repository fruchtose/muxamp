(function($) {
    
    var defaults = {
        // All mouse events will be bound with a namespace so as not to interfere with other bindings
        snapToEdges: true,
        snapDimensions: ['x', 'y'],
        snapPoints: [[0, 'any'], ['any', 0], ['width()', 'any'], ['any', 'height()']],
        snapAtDistance: 4,
        namespace: 'draginside',
        onMouseDown: function(x, y, params){},
        onMouseDownParams: {},
        onMouseMove: function(x, y, params){},
        onMouseMoveParams: {},
        onMouseUp: function(x, y, params){},
        onMouseUpParams: {}
    };
    
    var methods = {
        init: function(options) {
            // Settings and defaults merged
            var settings = $.extend({}, defaults, options);
            
            // A non-empty namespace is enforced
            if (!settings.namespace) {
                $.error('Namespace for draginside cannot be empty');
            }
            else {
                // Methods that are called when events happen. These internal events call 
                // the functions specified in the options by the user (or the defaults, which are empty)
                var internal_methods = {
                    doSnap: function (x, y, element) {
                        var checkX, checkY;
                        var xArrLoc = 0, yArrLoc = 1;
                        if (typeof settings.snapDimensions == 'string') {
                            checkX = settings.snapDimensions == 'x';
                            checkY = settings.snapDimensions == 'y';
                        }
                        else {
                            checkX = $.inArray('x', settings.snapDimensions) != -1;
                            checkY = $.inArray('y', settings.snapDimensions) != -1;
                        }
                        var distance = settings.snapAtDistance;
                        
                        var snapX = !checkX, snapY = !checkY;
                        var newX = x, newY = y;
                        for (var i in settings.snapPoints) {
                            var point = settings.snapPoints[i];
                            var xAny = point[xArrLoc] == 'any', yAny = point[yArrLoc] == 'any';
                            snapX = !checkX, snapY = !checkY;
                            if ((snapX || xAny) && (snapY || yAny)) {
                                break;
                            }
                            if (checkX && !xAny) {
                                var xPoint = typeof point[xArrLoc] == 'string' ? eval('$(element).' + point[xArrLoc]) : point[xArrLoc];
                                if (Math.abs(xPoint - x) <= distance) {
                                    snapX = true;
                                    newX = xPoint;
                                }
                            }
                            if (checkY && !yAny) {
                                var yPoint = typeof point[yArrLoc] == 'string' ? eval('$(element).' + point[yArrLoc]) : point[yArrLoc];
                                if (Math.abs(yPoint - y) <= distance) {
                                    snapY = true;
                                    newY = yPoint;
                                }
                            }
                            if ((snapX || xAny) && (snapY || yAny))
                                break;
                        }
                        
                        return {
                            x: newX, 
                            y: newY
                        };
                    },
                    mousedown: function(x, y, element, params) {
                        // Calls onMouseDown before mousemove is bound so as to call the function without the 
                        // state of the draginside environment being changed
                        var xValue = x, yValue = y;
                        var position = internal_methods.processPoints(xValue, yValue, element);
                        xValue = position.x;
                        yValue = position.y;
                        settings.onMouseDown(xValue, yValue, params);
                        if (event.button == 0) {
                            $(element).bind('mousemove.' + settings.namespace, function(event) {
                                internal_methods.mousemove(event.clientX - element.offsetLeft, event.clientY - element.offsetTop, element, settings.onMouseMoveParams);
                            });
                        }
                    },
                    mousemove: function(x, y, element, params) {
                        var xValue = x, yValue = y;
                        var position = internal_methods.processPoints(xValue, yValue, element);
                        xValue = position.x;
                        yValue = position.y;
                        settings.onMouseMove(xValue, yValue, params);
                    },
                    mouseup: function(x, y, element, params) {
                        $(element).unbind('mousemove.' + settings.namespace);
                        // onMouseUp called after mousemove is unbound so that so that 
                        // onMouseUp does not interfere draginside
                        var xValue = x, yValue = y;
                        var position = internal_methods.processPoints(xValue, yValue, element);
                        xValue = position.x;
                        yValue = position.y;
                        settings.onMouseUp(xValue, yValue, params);
                    },
                    processPoints: function(x, y, element) {
                        return settings.snapToEdges 
                        ? internal_methods.doSnap(x, y, element) 
                        : {
                            x: x, 
                            y: y
                        };
                    }
                };
            
                // Applies the bindings to each of the elements captured by jQuery
                return this.each(function() {
                    var $this = $(this);
                    
                    $this.bind('mousedown.' + settings.namespace, function(event) {
                        internal_methods.mousedown(event.pageX - $this.offset().left, event.pageY - $this.offset().top, this, settings.onMouseDownParams);
                    }).bind('mouseup.' + settings.namespace, function(event) {
                        internal_methods.mouseup(event.pageX - $this.offset().left, event.pageY - $this.offset().top, this, settings.onMouseUpParams);
                    });
                    
                    return $this;
                });
            }
        },
        destruct: function(namespace) {
            if (!namepsace) {
                $.error('Cannot call destruct on draginside with no namespace specified.');
            }
            else return this.each(function() {
                return $this.unbind('mouseup.' + namespace).unbind('mousedown.' + namespace);
            });
        } 
    };
    
    $.fn.draginside = function(method) {
        if (methods[method]) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        else if (typeof method === 'object' || !method) {
            return methods.init.apply( this, arguments );
        }
        else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.draginside' );
        }
    };
})(jQuery);