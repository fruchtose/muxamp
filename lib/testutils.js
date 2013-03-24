var http    = require('http'),
    should  = require('chai').should(),
    _       = require('underscore'),
    Q       = require('q'),
    config  = require('./config'),
    muxamp  = require('../lib/server').getApplication();

var thrower = function(err) {
    throw err;
};

var expectError = function(deferred, callback, done) {
    return deferred.then(function(results) {
        should.not.exist(results);
        _.isFunction(done) && done();
    }).fail(function(error) {
        callback(error);
        _.isFunction(done) && done();
    }).done();
};

var expectSuccess = function(deferred, callback, done) {
    return deferred.then(function(results) {
        callback(results);
        _.isFunction(done) && done();
    }).fail(function(error) {
        throw error;
        _.isFunction(done) && done();
    }).done();
};

var expectErrorMessage = function(deferred, done) {
    var readError = function(data) {
        data.should.have.property('error');
        data.error.should.be.a('string');
        data.error.length.should.be.above(0);
    };
    expectError(deferred, readError, done);
}

var runTestWithServer = function(port, callback, options) {
    callback || (callback = function() {});
    options || (options = {});
    var beforeCallback = options.before || function() {},
        afterCallback = options.afterCallback || function() {};
    var app = http.createServer(muxamp);
    before(function(done) {
        app.on('listening', function() {
            beforeCallback();
            done();
        });
        app.listen(port);
    });
    callback();
    after(function(done) {
        app.on('close', function () {
            afterCallback();
            done();
        });
        app.close();
    });
};

var serverTestSetup = function(context, done) {
    context.app = http.createServer(muxamp);
    context.app.on('listening', function() {
        done();
    });
    context.app.listen(config.get('muxamp:port'));
};

var serverTestTeardown = function(context, done) {
    context.app.on('close', function() {
        done();
    });
    context.app.close();
};

var browserTestSetup = function(context, done) {
    Q.nfcall(phantom.create).then(function(ph) {
        return context.phantom = ph;
    }).then(function(ph) {
        return Q.nfcall(ph.createPage);
    }).then(function(page) {
        return context.page = page;
        return Q.nfcall(context.page.set, 'settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.60 Safari/537.17');
    }).then(function() {
        return Q.nfcall(context.page.set, 'viewportSize', {width: 1080, height: 675});
    }).then(function() {
        done();
    }).done();
};

var browserTestTeardown = function(context, done) {
    context.phantom.exit();
    done();
};


module.exports = {
    browser: {
        before: function(context) {
            return function(done) {
                serverTestSetup(context, done);
            };
        },
        beforeEach: function(context) {
            return function(done) {
                browserTestSetup(context, done);
            };
        },
        after: function(context) {
            return function(done) {
                serverTestTeardown(context, done);
            };
        },
        afterEach: function(context) {
            return function(done) {
                browserTestTeardown(context, done);
            };
        },
    },
    expectError: expectError,
    expectErrorMessage: expectErrorMessage,
    expectSuccess: expectSuccess,
    server: {
        testWithServer: runTestWithServer
    },
    thrower: thrower
};