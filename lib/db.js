var _                = require('underscore'),
    connectionPooler = require('generic-pool'),
    mysql            = require('mysql'),
    Q                = require('q'),
    config           = require('./config');

var DEFAULT_NAME = 'mysql';
var pools = {};

var createPool = function(name, options) {
    return connectionPooler.Pool({
        name: name,
        create: function(callback) {
            var host = config.get('muxamp:db:host'),
                database = config.get('muxamp:db:name'),
                user = config.get('muxamp:db:user'),
                password = config.get('muxamp:db:password');
            if (!(host && database && user && password)) {
                var status = 'Host: ' + host + ', DB: ' + database + ', user: ' + user + ', password: ' + password
                throw new Error('Database configuration not fully specified. ' + status);
            }
            var params = _.extend({}, options, {
                host: host,
                database: database,
                user: user,
                password: password
            });
            var connection = mysql.createConnection(params);
            connection.connect(function(err) {
                callback(err, connection);
            });
        },
        destroy: function(connection) {
            connection.end();
        },
        max: 5
    });
};

var getConnectionPool = function(name, options) {
    if (_.isObject(name) && !options) {
        options = name;
        name = null;
    }
    name || (name == DEFAULT_NAME);
    options || (options = {});
    if (!pools[name]) {
        pools[name] = createPool(name, options);
    }
    return pools[name];
};

var isSetup = function(options) {
    dfd = Q.defer();
    if (!verify('read')) {
        dfd.reject();
        return dfd.promise;
    }
    var dbname = config.get('muxamp:db:name');
        query = "SELECT COUNT(*) AS count " +
                "FROM information_schema.tables " +
                "WHERE table_schema = ? " +
                "AND table_name IN ('Playlists', 'KnownMedia');"
    pool = getConnectionPool(options);
    pool.acquire(function(acquireError, connection) {
        if (acquireError) {
            console.log('Schema check connection acquisition', acquireError);
            dfd.reject();
            pool.release(connection);
        }
        connection.query(query, dbname, function(queryError, rows) {
            if (queryError) {
                console.log('Schema check query error', queryError);
                dfd.reject();
            } else if (rows.length && rows[0] && rows[0]['count']) {
                dfd.resolve(parseInt(rows[0]['count']) == 2);
            } else {
                dfd.reject();
            }
            pool.release(connection);
        });
    });
    return dfd.promise;
};

var verify = function(action) {
    return !!config.get('muxamp:db:' + (action || '').toString());
};

module.exports = {
    canRead: function() {
        return verify('read');
    },
    canWrite: function() {
        return verify('write');
    },
    getConnectionPool: getConnectionPool,
    isSetup: isSetup,
    verify: verify
};