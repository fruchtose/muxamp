# Muxamp: A streaming media playlist for YouTube and SoundCloud

Muxamp is a web app that lets you play streaming media from YouTube and SoundCloud in your browser and save your platlists for later use.

Muxamp runs on [Node.js](https://github.com/joyent/node). The client uses [Backbone](https://github.com/documentcloud/backbone) and [jQuery](https://github.com/jquery/jquery) to provide an interactive experience. Persistence is accomplished using [MySQL](http://www.mysql.com/) (chosen out of pure laziness).

## Features

 * Rich client-side playlist interaction: play, stop, pause, shuffle, and rearrange tracks
 * Serves playlists and search data through a RESTful API
 * Asynchronous server-side media and database queries through promises
 * Highly extensible client-side and server-side architecture

## Browser Support

Muxamp supports recent versions of Chrome and Firefox. Internet Explorer probably won't work or has CSS problems I have not fixed. Older browsers are explicitly blocked in production mode.

## Installation and Support

### Requirements

 * Node.js `>= 0.6.11` (older versions may work, or may not)
 * MySQL `>= 5.0` using InnoDB engine

### Installation

 1. `npm install`

 2. `make install`
    * If your database (specified in configuration) already has the tables that Muxamp needs to create, run `make install force=true` to overwrite these tables.

### Configuration

Muxamp reads its user configuration through `nconf`, capable of taking in environment variables or an optional JSON config file located in `./config/<environment>.json`. `environment` can be `development`, `test`, or `production`. You may also create a JSON file at `./config/all.json` for configuration in any environment. All of these files are optional and are included in `.gitignore` by default.

#### Configuration structure

All namespaces are separated by colons (`:`). For instance the database host is set in `muxamp:db:host`.

 * `muxamp`
    * `db`
        * `read`: Is DB reading enabled (`true` by default, set to `false` for maintenance mode)
        * `false`: Is DB writing enabled (`true` by default, set to `false` for maintenance mode)
        * `host`: MySQL database host
        * `database`: MySQL database name
        * `user`: MySQL database user
        * `password`: MySQL database password
        * `allowDirectSave`: Normally, tracks can only be saved in a playlist if there is a record of it in the `KnownMedia` table. If `allowDirectSave` is enabled, tracks can be verified at the point of saving the playlist, without going through search first. This is disabled by default, as verifying a track requires a call to the required API, followed by a DB write to record the verification. DB writes are batched per playlist. Turn this option on only if you want to enable playlist saving without going through a search interface.
    * `log`: The logging level Muxamp uses (see `express` for logging level formats)
    * `port`: The port from which Muxamp serves (defaults to `process.env['app_port']`, then `3000`)
    * `apis`
        * `jamendo`
            * `clientId`: Client ID registered with [Jamendo](https://devportal.jamendo.com/) to use their API
        * `soundcloud`
            * `clientId`: Client ID registered with [SoundCloud](http://developers.soundcloud.com/) to use their API

## Testing

Unit and integration tests can be found in `./tests` and are run using [`mocha`](https://github.com/visionmedia/mocha). To run these tests, execute `make test`.

Acceptance tests for the browser are found in `./publictest`. To run these tests, run `NODE_ENV=test npm start`, then open your browser and visit `http://localhost/<Muxamp port>?test` (e.g. `http://localhost:3000?test`). A better way of running acceptance tests is currently being explored through PhantomJS.

## Server Libraries Used

* [`underscore`](https://github.com/documentcloud/underscore): JavaScript APIs
* [`underscore.string`](https://github.com/epeli/underscore.string): String processing API
* [`express`](https://github.com/visionmedia/express): HTTP server
* [`nconf`](https://github.com/flatiron/nconf): Application configuration
* [`ejs`](https://github.com/visionmedia/ejs): View templating
* [`ejs-locals`](https://github.com/RandomEtc/ejs-locals): Additional templating features
* [`Q`](https://github.com/kriskowal/q): JavaScript promises library
* [`request`](https://github.com/mikeal/request): HTTP requests for Node.js
* [`generic-pool`](https://github.com/coopernurse/node-pool): MySQL connection pooling
* [`mysql`](https://github.com/felixge/node-mysql): MySQL connections for Node.js
* [`node-dummy-cache`](https://github.com/pescuma/node-dummy-cache): Dumb in-memory cache for playlist and search result data
* [`mocha`](https://github.com/visionmedia/mocha): Test runner
* [`chai`](https://github.com/chaijs/chai): Assertions library
* [`chai-as-promised`](https://github.com/domenic/chai-as-promised): Assertions for promises

## Example

Muxamp is currently running at [http://muxamp.com](http://muxamp.com).

## FAQ

### Your early code is terrible

Sorry. I wrote Muxamp to learn JavaScript and Node.js, and when I started I had little experience with promises, callbacks, etc.

### Why Backbone on the client side? Why not Meteor, Angular, or *<insert real-time JavaScript library here>*?

I wanted to learn Backbone, so I chose to use it for this project.

### Why does Muxamp store all the media it comes across in a database table called `KnownMedia`?

I want Muxamp to be as responsive as possible. Verifying each track at the time of playlist storage would make the server extremely unresponsive when saving a playlist, since the alternative (besides using a cache like Redis) would be to query YouTube, SoundCloud, etc. for every saved track! My solution is to verify each track when executing a search query, and then checking the database to see if it has a track when the playlist is saved.

### Why does Muxamp store playlists as strings? Why not in a many-many relationship with a Tracks table? Are you #%^@$!* nuts?

I know it's kind of hacky, but it allows for quick dedup lookup of existing playlists. Take the SHA256 hash of the playlist string, search for it in the Playlists table, and don't insert anything if you get a result. Plus, the SHA256 column can be indexed.

### Why not MongoDB?

I considered it, but I chose to go with a DBMS I already knew, since I have no experience to date with MongoDB.

### Are you accepting patch requests?

Absolutely!

## Future Plans

 * Support for more streaming media sources
 * Compatibility with older browsers
 * Consider revisions to database architecture