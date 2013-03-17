# Muxamp: A streaming media playlist for YouTube and SoundCloud

Muxamp is a web app that lets you play streaming media from YouTube and SoundCloud in your browser and save your platlists for later use.

Muxamp runs on Node.js. The client uses Backbone and jQuery to provide an interactive experience. Persistence is accomplished using MySQL (chosen out of pure laziness).

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

`npm install`

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
    * `log`: The logging level Muxamp uses (see `express` for logging level formats)
    * `port`: The port from which Muxamp serves (defaults to `process.env['app_port']`, then `3000`)

## Testing

Unit and integration tests can be found in `./tests` and are run using `mocha`. To run these tests, execute `make test`.

Acceptance tests for the browser are found in `./publictest`. To run these tests, run `NODE_ENV=test npm start`, then open your browser and visit `http://localhost/<Muxamp port>`. A better way of running acceptance tests is currently being explored through PhantomJS.

## Server Libraries Used

* `underscore`: JavaScript APIs
* `underscore.string`: String processing API
* `express`: HTTP server
* `nconf`: Application configuration
* `ejs`: View templating
* `ejs-locals`: Additional templating features
* `Q`: JavaScript promises library
* `request`: HTTP requests for Node.js
* `generic-pool`: MySQL connection pooling
* `mysql`: MySQL connections for Node.js
* `node-dummy-cache`: Dumb in-memory cache for playlist and search result data
* `mocha`: Test runner
* `chai`: Assertions library
* `chai-as-promised`: Assertions for promises