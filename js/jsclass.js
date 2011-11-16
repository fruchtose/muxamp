/**
 * JS.Class: Ruby-style JavaScript
 * http://jsclass.jcoglan.com
 * Copyright (c) 2007-2011 James Coglan and contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * Parts of the Software build on techniques from the following open-source
 * projects:
 * 
 * * The Prototype framework, (c) 2005-2010 Sam Stephenson (MIT license)
 * * Alex Arnell's Inheritance library, (c) 2006 Alex Arnell (MIT license)
 * * Base, (c) 2006-2010 Dean Edwards (MIT license)
 * 
 * The Software contains direct translations to JavaScript of these open-source
 * Ruby libraries:
 * 
 * * Ruby standard library modules, (c) Yukihiro Matsumoto and contributors (Ruby license)
 * * Test::Unit, (c) 2000-2003 Nathaniel Talbott (Ruby license)
 * * Context, (c) 2008 Jeremy McAnally (MIT license)
 * * EventMachine::Deferrable, (c) 2006-07 Francis Cianfrocca (Ruby license)
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function() {
  var $ = (typeof this.global === 'object') ? this.global : this;
  $.JS = $.JS || {};
  JS.ENV = $;
})();

JS.Package = function(loader) {
  var Set = JS.Package.OrderedSet;
  JS.Package._index(this);
  
  this._loader    = loader;
  this._names     = new Set();
  this._deps      = new Set();
  this._uses      = new Set();
  this._styles    = new Set();
  this._observers = {};
  this._events    = {};
};

(function(klass) {
  klass.displayName = 'Package';
  klass.toString = function() { return klass.displayName };
  
  klass.log = function(message) {
    if (typeof window === 'undefined') return;
    if (typeof window.runtime === 'object') window.runtime.trace(message);
    if (window.console && console.info) console.info(message);
  };
  
  //================================================================
  // Ordered list of unique elements, for storing dependencies
  
  var Set = klass.OrderedSet = function(list) {
    this._members = this.list = [];
    this._index = {};
    if (!list) return;
    
    for (var i = 0, n = list.length; i < n; i++)
      this.push(list[i]);
  };

  Set.prototype.push = function(item) {
    var key   = (item.id !== undefined) ? item.id : item,
        index = this._index;
    
    if (index.hasOwnProperty(key)) return;
    index[key] = this._members.length;
    this._members.push(item);
  };
  
  //================================================================
  // Wrapper for deferred values
  
  var Deferred = klass.Deferred = function() {
    this._status    = 'deferred';
    this._value     = null;
    this._callbacks = [];
  };
  
  Deferred.prototype.callback = function(callback, context) {
    if (this._status === 'succeeded') callback.call(context, this._value);
    else this._callbacks.push([callback, context]);
  };
  
  Deferred.prototype.succeed = function(value) {
    this._status = 'succeeded';
    this._value  = value;
    var callback;
    while (callback = this._callbacks.shift())
      callback[0].call(callback[1], value);
  };
  
  //================================================================
  // Environment settings
  
  klass.ENV = JS.ENV;
  
  if ((this.document || {}).getElementsByTagName) {
    var script = document.getElementsByTagName('script')[0];
    klass._isIE = (script.readyState !== undefined);
  }
  
  klass.onerror = function(e) { throw e };
  
  klass._throw = function(message) {
    klass.onerror(new Error(message));
  };
  
  
  //================================================================
  // Configuration methods, called by the DSL
  
  var instance = klass.prototype,
      
      methods = [['requires', '_deps'],
                 ['uses',     '_uses'],
                 ['styling',  '_styles']],
      
      i = methods.length;
  
  while (i--)
    (function(pair) {
      var method = pair[0], list = pair[1];
      instance[method] = function() {
        var n = arguments.length, i;
        for (i = 0; i < n; i++) this[list].push(arguments[i]);
        return this;
      };
    })(methods[i]);
  
  instance.provides = function() {
    var n = arguments.length, i;
    for (i = 0; i < n; i++) {
      this._names.push(arguments[i]);
      klass._getFromCache(arguments[i]).pkg = this;
    }
    return this;
  };
  
  instance.setup = function(block) {
    this._onload = block;
    return this;
  };
  
  //================================================================
  // Event dispatchers, for communication between packages
  
  instance._on = function(eventType, block, context) {
    if (this._events[eventType]) return block.call(context);
    var list = this._observers[eventType] = this._observers[eventType] || [];
    list.push([block, context]);
    this._load();
  };
  
  instance._fire = function(eventType) {
    if (this._events[eventType]) return false;
    this._events[eventType] = true;
    
    var list = this._observers[eventType];
    if (!list) return true;
    delete this._observers[eventType];
    
    for (var i = 0, n = list.length; i < n; i++)
      list[i][0].call(list[i][1]);
    
    return true;
  };
  
  //================================================================
  // Loading frontend and other miscellany
  
  instance._isLoaded = function(withExceptions) {
    if (!withExceptions && this.__isLoaded !== undefined) return this.__isLoaded;
    
    var names = this._names.list,
        i     = names.length,
        name, object;
    
    while (i--) { name = names[i];
      object = klass._getObject(name, this._exports);
      if (object !== undefined) continue;
      if (withExceptions)
        return klass._throw('Expected package at ' + this._loader + ' to define ' + name);
      else
        return this.__isLoaded = false;
    }
    return this.__isLoaded = true;
  };
  
  instance._load = function() {
    if (!this._fire('request')) return;
    this._prefetch();
    
    var allDeps = this._deps.list.concat(this._uses.list),
        i = allDeps.length;
    
    klass.when({load: allDeps});
    
    klass.when({complete: this._deps.list}, function() {
      klass.when({complete: allDeps, load: [this]}, function() {
        this._fire('complete');
      }, this);
      
      var self = this, fireOnLoad = function(exports) {
        self._exports = exports;
        if (self._onload) self._onload();
        self._isLoaded(true);
        self._fire('load');
      };
      
      if (this._isLoaded()) {
        this._fire('download');
        return this._fire('load');
      }
      
      if (this._loader === undefined)
        return klass._throw('No load path found for ' + this._names.list[0]);
      
      typeof this._loader === 'function'
            ? this._loader(fireOnLoad)
            : klass.Loader.loadFile(this._loader, fireOnLoad, this._source);
      
      if (!klass.Loader.loadStyle) return;
      
      var styles = this._styles.list,
          i      = styles.length;
      
      while (i--) klass.Loader.loadStyle(styles[i]);
      
      this._fire('download');
    }, this);
  };
  
  instance._prefetch = function() {
    if (typeof this._loader !== 'string' ||!klass.Loader.fetch) return;
    this._source = this._source ||
                   klass.Loader.fetch(this._loader);
  };
  
  instance.toString = function() {
    return 'Package:' + this._names.list.join(',');
  };
  
  //================================================================
  // Class-level event API, handles group listeners
  
  klass.when = function(eventTable, block, context) {
    var eventList = [], objects = {}, event, packages, i;
    for (event in eventTable) {
      if (!eventTable.hasOwnProperty(event)) continue;
      objects[event] = [];
      packages = new klass.OrderedSet(eventTable[event]);
      i = packages.list.length;
      while (i--) eventList.push([event, packages.list[i], i]);
    }
    
    var waiting = i = eventList.length;
    if (waiting === 0) return block && block.call(context, objects);
    
    while (i--)
      (function(event) {
        var pkg = klass._getByName(event[1]);
        pkg._on(event[0], function() {
          objects[event[0]][event[2]] = klass._getObject(event[1], pkg._exports);
          waiting -= 1;
          if (waiting === 0 && block) block.call(context, objects);
        });
      })(eventList[i]);
  };
  
  //================================================================
  // Indexes for fast lookup by path and name, and assigning IDs
  
  klass._autoIncrement = 1;
  klass._indexByPath = {};
  klass._indexByName = {};
  klass._autoloaders = [];
  
  klass._index = function(pkg) {
    pkg.id = this._autoIncrement;
    this._autoIncrement += 1;
  };
  
  klass._getByPath = function(loader) {
    var path = loader.toString();
    return this._indexByPath[path] = this._indexByPath[path] || new this(loader);
  };
  
  klass._getByName = function(name) {
    if (typeof name !== 'string') return name;
    var cached = this._getFromCache(name);
    if (cached.pkg) return cached.pkg;
    
    var autoloaded = this._manufacture(name);
    if (autoloaded) return autoloaded;
    
    var placeholder = new this();
    placeholder.provides(name);
    return placeholder;
  };
  
  klass.remove = function(name) {
    var pkg = this._getByName(name);
    delete this._indexByName[name];
    delete this._indexByPath[pkg._loader];
  };
  
  //================================================================
  // Auotloading API, generates packages from naming patterns
  
  klass._autoload = function(pattern, options) {
    this._autoloaders.push([pattern, options]);
  };
  
  klass._manufacture = function(name) {
    var autoloaders = this._autoloaders,
        n = autoloaders.length,
        i, autoloader, path;
    
    for (i = 0; i < n; i++) {
      autoloader = autoloaders[i];
      if (!autoloader[0].test(name)) continue;
      
      path = autoloader[1].from + '/' +
             name.replace(/([a-z])([A-Z])/g, function(m,a,b) { return a + '_' + b })
                 .replace(/\./g, '/')
                 .toLowerCase() + '.js';
      
      var pkg = new this(path);
      pkg.provides(name);
      
      if (path = autoloader[1].require)
        pkg.requires(name.replace(autoloader[0], path));
      
      return pkg;
    }
    return null;
  };
  
  //================================================================
  // Cache for named packages and runtime objects
  
  klass._getFromCache = function(name) {
    return this._indexByName[name] = this._indexByName[name] || {};
  };
  
  klass._getObject = function(name, rootObject) {
    if (typeof name !== 'string') return undefined;
    
    var cached = rootObject ? {} : this._getFromCache(name);
    if (cached.obj !== undefined) return cached.obj;
    
    var object = rootObject || this.ENV,
        parts  = name.split('.'), part;
    
    while (part = parts.shift()) object = object && object[part];
    
    if (rootObject && object === undefined)
      return this._getObject(name);
    
    return cached.obj = object;
  };
  
})(JS.Package);


JS.Package.DomLoader = {
  HOST_REGEX: /^https?\:\/\/[^\/]+/i,
  
  usable: function() {
    return !!JS.Package._getObject('window.document.getElementsByTagName');
  },
  
  __FILE__: function() {
    var scripts = document.getElementsByTagName('script');
        src     = scripts[scripts.length - 1].src,
        url     = window.location.href;
    
    if (/^\w+\:\/\//.test(src)) return src;
    if (/^\//.test(src)) return window.location.origin + src;
    return url.replace(/[^\/]*$/g, '') + src;
  },
  
  cacheBust: function(path) {
    var token = new Date().getTime();
    return path + (/\?/.test(path) ? '&' : '?') + token;
  },
  
  fetch: function(path) {
    if (JS.cacheBust) path = this.cacheBust(path);
    
    this.HOST = this.HOST || this.HOST_REGEX.exec(window.location.href);
    var host = this.HOST_REGEX.exec(path);
    
    if (!this.HOST || (host && host[0] !== this.HOST[0])) return null;
    JS.Package.log('Loading ' + path);
    
    var source = new JS.Package.Deferred(),
        self   = this,
        xhr    = window.ActiveXObject
               ? new ActiveXObject("Microsoft.XMLHTTP")
               : new XMLHttpRequest();
    
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      xhr.onreadystatechange = self._K;
      source.succeed(xhr.responseText);
      xhr = null;
    };
    xhr.send(null);
    return source;
  },
  
  loadFile: function(path, fireCallbacks, source) {
    if (JS.cacheBust && !source) path = this.cacheBust(path);
    
    var self   = this,
        head   = document.getElementsByTagName('head')[0],
        script = document.createElement('script');
    
    script.type = 'text/javascript';
    
    if (source)
      return source.callback(function(code) {
        JS.Package.log('Executing ' + path);
        head.appendChild(script);
        script.text = code;
        fireCallbacks();
      });
    
    JS.Package.log('Loading and executing ' + path);
    script.src = path;
    
    script.onload = script.onreadystatechange = function() {
      var state = script.readyState, status = script.status;
      if ( !state || state === 'loaded' || state === 'complete' ||
           (state === 4 && status === 200) ) {
        fireCallbacks();
        script.onload = script.onreadystatechange = self._K;
        head   = null;
        script = null;
      }
    };
    head.appendChild(script);
  },
  
  loadStyle: function(path) {
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = path;
    
    document.getElementsByTagName('head')[0].appendChild(link);
  },
  
  _K: function() {}
};


JS.Package.Loader = JS.Package.DomLoader;


JS.Package.DSL = {
  __FILE__: function() {
    return JS.Package.Loader.__FILE__();
  },
  
  pkg: function(name, path) {
    var pkg = path
        ? JS.Package._getByPath(path)
        : JS.Package._getByName(name);
    pkg.provides(name);
    return pkg;
  },
  
  file: function(path) {
    return JS.Package._getByPath(path);
  },
  
  load: function(path, fireCallbacks) {
    JS.Package.Loader.loadFile(path, fireCallbacks);
  },
  
  autoload: function(pattern, options) {
    JS.Package._autoload(pattern, options);
  }
};

JS.Package.DSL.loader = JS.Package.DSL.file;

JS.Packages = function(declaration) {
  declaration.call(JS.Package.DSL);
};

JS.cacheBust = false;

JS.load = function(url, callback) {
  JS.Package.Loader.loadFile(url, function() {
    if (typeof callback === 'function') callback();
  });
  return this;
};
 
JS.require = function() {
  var requirements = [], i = 0;
  
  while (typeof arguments[i] === 'string'){
    requirements.push(arguments[i]);
    i += 1;
  }
  var callback = arguments[i], context = arguments[i+1];
  
  JS.Package.when({complete: requirements}, function(objects) {
    if (!callback) return;
    callback.apply(context || null, objects && objects.complete);
  });
  
  return this;
};

/**
 * JS.Class: Ruby-style JavaScript
 * http://jsclass.jcoglan.com
 * Copyright (c) 2007-2011 James Coglan and contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * Parts of the Software build on techniques from the following open-source
 * projects:
 * 
 * * The Prototype framework, (c) 2005-2010 Sam Stephenson (MIT license)
 * * Alex Arnell's Inheritance library, (c) 2006 Alex Arnell (MIT license)
 * * Base, (c) 2006-2010 Dean Edwards (MIT license)
 * 
 * The Software contains direct translations to JavaScript of these open-source
 * Ruby libraries:
 * 
 * * Ruby standard library modules, (c) Yukihiro Matsumoto and contributors (Ruby license)
 * * Test::Unit, (c) 2000-2003 Nathaniel Talbott (Ruby license)
 * * Context, (c) 2008 Jeremy McAnally (MIT license)
 * * EventMachine::Deferrable, (c) 2006-07 Francis Cianfrocca (Ruby license)
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function() {
  var $ = (typeof this.global === 'object') ? this.global : this;
  $.JS = $.JS || {};
  JS.ENV = $;
})();

JS.END_WITHOUT_DOT = /([^\.])$/;

JS.array = function(enumerable) {
  var array = [], i = enumerable.length;
  while (i--) array[i] = enumerable[i];
  return array;
};

JS.bind = function(method, object) {
  return function() {
    return method.apply(object, arguments);
  };
};

JS.extend = function(destination, source, overwrite) {
  if (!destination || !source) return destination;
  for (var field in source) {
    if (destination[field] === source[field]) continue;
    if (overwrite === false && destination.hasOwnProperty(field)) continue;
    destination[field] = source[field];
  }
  return destination;
};

JS.indexOf = function(list, item) {
  if (list.indexOf) return list.indexOf(item);
  var i = list.length;
  while (i--) {
    if (list[i] === item) return i;
  }
  return -1;
};

JS.isType = function(object, type) {
  if (typeof type === 'string')
    return typeof object === type;
  
  if (object === null || object === undefined)
    return false;
  
  return (typeof type === 'function' && object instanceof type) ||
         (object.isA && object.isA(type)) ||
         object.constructor === type;
};

JS.makeBridge = function(parent) {
  var bridge = function() {};
  bridge.prototype = parent.prototype;
  return new bridge();
};

JS.makeClass = function(parent) {
  parent = parent || Object;
  
  var constructor = function() {
    return this.initialize
         ? this.initialize.apply(this, arguments) || this
         : this;
  };
  constructor.prototype = JS.makeBridge(parent);
  
  constructor.superclass = parent;
  
  constructor.subclasses = [];
  if (parent.subclasses) parent.subclasses.push(constructor);
  
  return constructor;
};

JS.match = function(category, object) {
  if (object === undefined) return false;
  return typeof category.test === 'function'
       ? category.test(object)
       : category.match(object);
};


JS.Method = JS.makeClass();

JS.extend(JS.Method.prototype, {
  initialize: function(module, name, callable) {
    this.module   = module;
    this.name     = name;
    this.callable = callable;
    
    this._words = {};
    if (typeof callable !== 'function') return;
    
    this.arity  = callable.length;
    
    var matches = callable.toString().match(/\b[a-z\_\$][a-z0-9\_\$]*\b/ig),
        i       = matches.length;
    
    while (i--) this._words[matches[i]] = true;
  },
  
  setName: function(name) {
    this.callable.displayName =
    this.displayName = name;
  },
  
  contains: function(word) {
    return this._words.hasOwnProperty(word);
  },
  
  call: function() {
    return this.callable.call.apply(this.callable, arguments);
  },
  
  apply: function(receiver, args) {
    return this.callable.apply(receiver, args);
  },
  
  compile: function(environment) {
    var method     = this,
        trace      = method.module.__trace__ || environment.__trace__,
        callable   = method.callable,
        words      = method._words,
        allWords   = JS.Method._keywords,
        i          = allWords.length,
        keywords   = [],
        keyword;
    
    while  (i--) {
      keyword = allWords[i];
      if (words[keyword.name]) keywords.push(keyword);
    }
    if (keywords.length === 0 && !trace) return callable;
    
    var compiled = function() {
      var N = keywords.length, j = N, previous = {}, keyword, existing, kwd;
      
      while (j--) {
        keyword  = keywords[j];
        existing = this[keyword.name];
        
        if (existing && !existing.__kwd__) continue;
        
        previous[keyword.name] = {
          _value: existing,
          _own:   this.hasOwnProperty(keyword.name)
        };
        kwd = keyword.filter(method, environment, this, arguments);
        kwd.__kwd__ = true;
        this[keyword.name] = kwd;
      }
      var returnValue = callable.apply(this, arguments),
          j = N;
      
      while (j--) {
        keyword = keywords[j];
        if (!previous[keyword.name]) continue;
        if (previous[keyword.name]._own)
          this[keyword.name] = previous[keyword.name]._value;
        else
          delete this[keyword.name];
      }
      return returnValue;
    };
    
    if (trace) return JS.StackTrace.wrap(compiled, method, environment);
    return compiled;
  },
  
  toString: function() {
    var name = this.displayName || (this.module.toString() + '#' + this.name);
    return '#<Method:' + name + '>';
  }
});

JS.Method.create = function(module, name, callable) {
  if (callable && callable.__inc__ && callable.__fns__)
    return callable;
  
  var method = (typeof callable !== 'function')
             ? callable
             : new this(module, name, callable);
  
  this.notify(method);
  return method;
};

JS.Method.compile = function(method, environment) {
  return method && method.compile
       ? method.compile(environment)
       : method;
};

JS.Method.__listeners__ = [];
  
JS.Method.added = function(block, context) {
  this.__listeners__.push([block, context]);
};
  
JS.Method.notify = function(method) {
  var listeners = this.__listeners__,
      i = listeners.length,
      listener;
  
  while (i--) {
    listener = listeners[i];
    listener[0].call(listener[1], method);
  }
};

JS.Method._keywords = [];

JS.Method.keyword = function(name, filter) {
  this._keywords.push({name: name, filter: filter});
};

JS.Method.tracing = function(classes, block, context) {
  JS.require('JS.StackTrace', function() {
    var logger = JS.StackTrace.logger,
        active = logger.active;
    
    classes = [].concat(classes);
    this.trace(classes);
    logger.active = true;
    block.call(context);
    
    this.untrace(classes);
    logger.active = active;
  }, this);
};

JS.Method.trace = function(classes) {
  var i = classes.length;
  while (i--) {
    classes[i].__trace__ = true;
    classes[i].resolve();
  }
};

JS.Method.untrace = function(classes) {
  var i = classes.length;
  while (i--) {
    classes[i].__trace__ = false;
    classes[i].resolve();
  }
};


JS.Module = JS.makeClass();
JS.Module.__queue__ = [];

JS.extend(JS.Module.prototype, {
  initialize: function(name, methods, options) {
    if (typeof name !== 'string') {
      options = arguments[1];
      methods = arguments[0];
      name    = undefined;
    }
    options = options || {};
    
    this.__inc__ = [];
    this.__dep__ = [];
    this.__fns__ = {};
    this.__tgt__ = options._target;
    this.__anc__ = null;
    this.__mct__ = {};
    
    this.setName(name);
    this.include(methods, {_resolve: false});
    
    if (JS.Module.__queue__)
      JS.Module.__queue__.push(this);
  },
  
  setName: function(name) {
    this.displayName = name || '';
    
    for (var field in this.__fns__)
      this.__name__(field);
    
    if (name && this.__meta__)
      this.__meta__.setName(name + '.');
  },
  
  __name__: function(name) {
    if (!this.displayName) return;
    
    var object = this.__fns__[name];
    if (!object) return;
    
    name = this.displayName.replace(JS.END_WITHOUT_DOT, '$1#') + name;
    if (typeof object.setName === 'function') return object.setName(name);
    if (typeof object === 'function') object.displayName = name;
  },
  
  define: function(name, callable, options) {
    var method  = JS.Method.create(this, name, callable),
        resolve = (options || {})._resolve;
    
    this.__fns__[name] = method;
    this.__name__(name);
    if (resolve !== false) this.resolve();
  },
  
  include: function(module, options) {
    if (!module) return this;
    
    var options = options || {},
        resolve = options._resolve !== false,
        extend  = module.extend,
        include = module.include,
        extended, field, value, mixins, i, n;
    
    if (module.__fns__ && module.__inc__) {
      this.__inc__.push(module);
      if ((module.__dep__ || {}).push) module.__dep__.push(this);
      
      if (extended = options._extended) {
        if (typeof module.extended === 'function')
          module.extended(extended);
      }
      else {
        if (typeof module.included === 'function')
          module.included(this);
      }
    }
    else {
      if (this.shouldIgnore('extend', extend)) {
        mixins = [].concat(extend);
        for (i = 0, n = mixins.length; i < n; i++)
          this.extend(mixins[i]);
      }
      if (this.shouldIgnore('include', include)) {
        mixins = [].concat(include);
        for (i = 0, n = mixins.length; i < n; i++)
          this.include(mixins[i], {_resolve: false});
      }
      for (field in module) {
        if (!module.hasOwnProperty(field)) continue;
        value = module[field];
        if (this.shouldIgnore(field, value)) continue;
        this.define(field, value, {_resolve: false});
      }
      if (module.hasOwnProperty('toString'))
        this.define('toString', module.toString, {_resolve: false});
    }
    
    if (resolve) this.resolve();
    return this;
  },
  
  alias: function(aliases) {
    for (var method in aliases) {
      if (!aliases.hasOwnProperty(method)) continue;
      this.define(method, this.instanceMethod(aliases[method]), {_resolve: false});
    }
    this.resolve();
  },
  
  resolve: function(host) {
    var host   = host || this,
        target = host.__tgt__,
        inc    = this.__inc__,
        fns    = this.__fns__,
        i, n, key, compiled;
    
    if (host === this) {
      this.__anc__ = null;
      this.__mct__ = {};
      i = this.__dep__.length;
      while (i--) this.__dep__[i].resolve();
    }
    
    if (!target) return;
    
    for (i = 0, n = inc.length; i < n; i++)
      inc[i].resolve(host);
    
    for (key in fns) {
      compiled = JS.Method.compile(fns[key], host);
      if (target[key] !== compiled) target[key] = compiled;
    }
    if (fns.hasOwnProperty('toString'))
      target.toString = JS.Method.compile(fns.toString, host);
  },
  
  shouldIgnore: function(field, value) {
    return (field === 'extend' || field === 'include') &&
           (typeof value !== 'function' ||
             (value.__fns__ && value.__inc__));
  },
  
  ancestors: function(list) {
    var cachable = !list,
        list     = list || [],
        inc      = this.__inc__;
        
    if (cachable && this.__anc__) return this.__anc__.slice();
    
    for (var i = 0, n = inc.length; i < n; i++)
      inc[i].ancestors(list);
    
    if (JS.indexOf(list, this) < 0)
      list.push(this);
    
    if (cachable) this.__anc__ = list.slice();
    return list;
  },
  
  lookup: function(name) {
    var cached = this.__mct__[name];
    if (cached && cached.slice) return cached.slice();
    
    var ancestors = this.ancestors(),
        methods   = [],
        fns;
    
    for (var i = 0, n = ancestors.length; i < n; i++) {
      fns = ancestors[i].__fns__;
      if (fns.hasOwnProperty(name)) methods.push(fns[name]);
    }
    this.__mct__[name] = methods.slice();
    return methods;
  },
  
  includes: function(module) {
    if (module === this) return true;
    
    var inc  = this.__inc__;
    
    for (var i = 0, n = inc.length; i < n; i++) {
      if (inc[i].includes(module))
        return true;
    }
    return false;
  },
  
  instanceMethod: function(name) {
    return this.lookup(name).pop();
  },
  
  instanceMethods: function(recursive, list) {
    var methods = list || [],
        fns     = this.__fns__,
        field;
    
    for (field in fns) {
      if (!JS.isType(this.__fns__[field], JS.Method)) continue;
      if (JS.indexOf(methods, field) >= 0) continue;
      methods.push(field);
    }
    
    if (recursive !== false) {
      var ancestors = this.ancestors(), i = ancestors.length;
      while (i--) ancestors[i].instanceMethods(false, methods);
    }
    return methods;
  },
  
  match: function(object) {
    return object && object.isA && object.isA(this);
  },
  
  toString: function() {
    return this.displayName;
  }
});


JS.Kernel = new JS.Module('Kernel', {
  __eigen__: function() {
    if (this.__meta__) return this.__meta__;
    var name = this.toString() + '.';
    this.__meta__ = new JS.Module(name, null, {_target: this});
    return this.__meta__.include(this.klass, {_resolve: false});
  },
  
  equals: function(other) {
    return this === other;
  },
  
  extend: function(module, options) {
    var resolve = (options || {})._resolve;
    this.__eigen__().include(module, {_extended: this, _resolve: resolve});
    return this;
  },
  
  hash: function() {
    return JS.Kernel.hashFor(this);
  },
  
  isA: function(module) {
    return (typeof module === 'function' && this instanceof module) ||
           this.__eigen__().includes(module);
  },
  
  method: function(name) {
    var cache = this.__mct__ = this.__mct__ || {},
        value = cache[name],
        field = this[name];
    
    if (typeof field !== 'function') return field;
    if (value && field === value._value) return value._bound;
    
    var bound = JS.bind(field, this);
    cache[name] = {_value: field, _bound: bound};
    return bound;
  },
  
  methods: function() {
    return this.__eigen__().instanceMethods();
  },
  
  tap: function(block, context) {
    block.call(context || null, this);
    return this;
  },
  
  toString: function() {
    if (this.displayName) return this.displayName;
    var name = this.klass.displayName || this.klass.toString();
    return '#<' + name + ':' + this.hash() + '>';
  }
});

(function() {
  var id = 1;
  
  JS.Kernel.hashFor = function(object) {
    if (object.__hash__ !== undefined) return object.__hash__;
    object.__hash__ = (new Date().getTime() + id).toString(16);
    id += 1;
    return object.__hash__;
  };
})();


JS.Class = JS.makeClass(JS.Module);

JS.extend(JS.Class.prototype, {
  initialize: function(name, parent, methods, options) {
    if (typeof name !== 'string') {
      options = arguments[2];
      methods = arguments[1];
      parent  = arguments[0];
      name    = undefined;
    }
    if (typeof parent !== 'function') {
      options = methods;
      methods = parent;
      parent  = Object;
    }
    JS.Module.prototype.initialize.call(this, name);
    options = options || {};
    
    var klass = JS.makeClass(parent);
    JS.extend(klass, this);
    
    klass.prototype.constructor =
    klass.prototype.klass = klass;
    
    klass.__eigen__().include(parent.__meta__, {_resolve: options._resolve});
    klass.setName(name);
    
    klass.__tgt__ = klass.prototype;
    
    var parentModule = (parent === Object)
                     ? {}
                     : (parent.__fns__ ? parent : new JS.Module(parent.prototype, {_resolve: false}));
    
    klass.include(JS.Kernel,    {_resolve: false})
         .include(parentModule, {_resolve: false})
         .include(methods,      {_resolve: false});
    
    if (options._resolve !== false) klass.resolve();
    
    if (typeof parent.inherited === 'function')
      parent.inherited(klass);
    
    return klass;
  }
});


(function() {
  var methodsFromPrototype = function(klass) {
    var methods = {},
        proto   = klass.prototype;
    
    for (var field in proto) {
      if (!proto.hasOwnProperty(field)) continue;
      methods[field] = JS.Method.create(klass, field, proto[field]);
    }
    return methods;
  };
  
  var classify = function(name, parentName) {
    var klass  = JS[name],
        parent = JS[parentName];
    
    klass.__inc__ = [];
    klass.__dep__ = [];
    klass.__fns__ = methodsFromPrototype(klass);
    klass.__tgt__ = klass.prototype;
    
    klass.prototype.constructor =
    klass.prototype.klass = klass;
    
    JS.extend(klass, JS.Class.prototype);
    klass.include(parent || JS.Kernel);
    klass.setName(name);
    
    klass.constructor = klass.klass = JS.Class;
  };
  
  classify('Method');
  classify('Module');
  classify('Class', 'Module');
  
  var eigen = JS.Kernel.instanceMethod('__eigen__');
  
  eigen.call(JS.Method);
  eigen.call(JS.Module);
  eigen.call(JS.Class).include(JS.Module.__meta__);
})();

JS.NotImplementedError = new JS.Class('NotImplementedError', Error);


JS.Method.keyword('callSuper', function(method, env, receiver, args) {
  var methods    = env.lookup(method.name),
      stackIndex = methods.length - 1,
      params     = JS.array(args);
  
  return function() {
    var i = arguments.length;
    while (i--) params[i] = arguments[i];
    
    stackIndex -= 1;
    var returnValue = methods[stackIndex].apply(receiver, params);
    stackIndex += 1;
    
    return returnValue;
  };
});

JS.Method.keyword('blockGiven', function(method, env, receiver, args) {
  var block = Array.prototype.slice.call(args, method.arity),
      hasBlock = (typeof block[0] === 'function');
  
  return function() { return hasBlock };
});

JS.Method.keyword('yieldWith', function(method, env, receiver, args) {
  var block = Array.prototype.slice.call(args, method.arity);
  
  return function() {
    if (typeof block[0] !== 'function') return;
    return block[0].apply(block[1] || null, arguments);
  };
});


JS.Interface = new JS.Class('Interface', {
  initialize: function(methods) {
    this.test = function(object, returnName) {
      var n = methods.length;
      while (n--) {
        if (typeof object[methods[n]] !== 'function')
          return returnName ? methods[n] : false;
      }
      return true;
    };
  },
  
  extend: {
    ensure: function() {
      var args = JS.array(arguments), object = args.shift(), face, result;
      while (face = args.shift()) {
        result = face.test(object, true);
        if (result !== true) throw new Error('object does not implement ' + result + '()');
      }
    }
  }
});


JS.Singleton = new JS.Class('Singleton', {
  initialize: function(name, parent, methods) {
    return new (new JS.Class(name, parent, methods));
  }
});
