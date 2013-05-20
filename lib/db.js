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

var executeQuery = function(options) {
    var pool = options.pool || getConnectionPool(),
        queryOpt = options.query,
        permissions = options.permissions || [],
        connection;

    _.isArray(permissions) || (permissions = [permissions]);

    // Determines if any of the permissions requested have not been granted
    var rejected =  _(permissions).find(function(permission) {
        return verify(permission) ? false : permission;
    });

    var promise = rejected ? Q.reject('Database permission ' + rejected + ' was not granted.') : Q.resolve();
    
    return promise.then(function() {
        return Q.ninvoke(pool, 'acquire');
    }).then(function(conn) {
        connection = conn;
        var query;
        if (_.isFunction(queryOpt)) {
            query = [queryOpt(conn)];
        } else if (_.isArray(queryOpt)) {
            query = queryOpt;
        } else {
            query = [queryOpt];
        }
        return Q.npost(conn, 'query', query);
    }).then(function(output) {
        return _.first(output);
    }).finally(function() {
        connection && pool.release(connection);
    });
};

var isSetup = function(options) {
    var query = "SELECT COUNT(*) AS count " +
                "FROM information_schema.tables " +
                "WHERE table_schema = ? " +
                "AND table_name IN ('Playlists', 'KnownMedia');";
    var dbname = config.get('muxamp:db:name');
    return executeQuery({
        permissions: 'read',
        pool: getConnectionPool(options),
        query: [query, dbname]
    }).then(function(data) {
        var row = data[0];
        return row && parseInt(row['count']) == 2;
    });
};

function verify(action) {
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
    verify: verify,
    executeQuery: executeQuery
};