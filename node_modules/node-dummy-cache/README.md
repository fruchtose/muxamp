node-dummy-cache
================

A simple in memory cache to use with nodejs.

[![Build Status](https://secure.travis-ci.org/pescuma/node-dummy-cache.png)](http://travis-ci.org/pescuma/node-dummy-cache)


## Installation

	npm install node-dummy-cache


## Usage

### Simple key/value

```javascript
var cache = require('node-dummy-cache');

var users = cache.create(cache.ONE_HOUR);

users.put(1, { name : 'A' });

var user = users.get(1);
```

### Fetch when needed

```javascript
var cache = require('node-dummy-cache');

var users = cache.create(cache.ONE_HOUR, function (id, callback) {
	// Do complex stuff here
	callback(undefined, user);
});

users.get(1, function(err, user) {
	// You got it
});
```

### Function style

Before:

```javascript
function dummy(a, b, c, callback) {
	// Do complex stuff here
	callback(undefined, 'A', 'B');
};

dummy(1, 2, 3, function(err, data1, data2) {
	// You got it
});
```

Adding cache:

```javascript
var cache = require('node-dummy-cache');

var dummy = cache.create(cache.ONE_HOUR, function (a, b, c, callback) {
	// Do complex stuff here
	callback(undefined, 'A', 'B');
});

dummy(1, 2, 3, function(err, data, data2) {
	// You got it
});
```

### Mixed

```javascript
var cache = require('node-dummy-cache');

var users = cache.create(cache.ONE_HOUR, function (id, callback) {
	// Do complex stuff here
	callback(undefined, user);
});

users.get(1, function(err, user) {
	// You got it
});

users(1, function(err, user) {
	// You got it
});

var user = users.get(1); // Returns only if cached

var user = users(1); // Returns only if cached
```


### Complex

```javascript
var cache = require('node-dummy-cache');

var users = cache.create(cache.ONE_HOUR, function (id1, id2, callback) {
	// Do complex stuff here
	callback(undefined, user, date);
});

users.get(1, 2, function(err, user, date) {
	// You got it
});

var user = users.get(1, 2); // Returns the user only if cached

users.put(1, 2, user); // Adds the user, but no date

```

	
## API

All arguments passed to the get / put must be JSON serializable.

### cache.create(maxAliveTimeMS: number, maxNotAccessedTimeMs: number, fetcher: function)

Creates a new cache. 

Params:
- maxAliveTimeMS : Max time a value will stay in cache starting with its creation
- maxNotAccessedTimeMs : Max time a value will stay in cache after its last access
- fetcher : callback to fetch the data

### cache.create(maxAliveTimeMS: number, fetcher: function)

Creates a new cache. 

Params:
- maxAliveTimeMS : Max time a value will stay in cache starting with its creation
- fetcher : callback to fetch the data

### cache.create(maxAliveTimeMS: number, maxNotAccessedTimeMs: number)

Creates a new cache. All values must be added to cache using put.

Params:
- maxAliveTimeMS : Max time a value will stay in cache starting with its creation
- maxNotAccessedTimeMs : Max time a value will stay in cache after its last access

### cache.create(fetcher: function)

Creates a new cache. Values never expires.

Params:
- fetcher : callback to fetch the data

### cache.create(maxAliveTimeMS: number)

Creates a new cache. All values must be added to cache using put.

Params:
- maxAliveTimeMS : Max time a value will stay in cache starting with its creation

### cache.create()

Creates a new cache. Values never expires. All values must be added to cache using put.
