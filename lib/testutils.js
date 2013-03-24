var http    = require('http'),
    should  = require('chai').should(),
    _       = require('underscore'),
    Q       = require('q'),
    config  = require('./config'),
    muxamp  = require('../lib/server').getApplication();

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

module.exports = {
    expectError: expectError,
    expectErrorMessage: expectErrorMessage,
    expectSuccess: expectSuccess,
    hooks: {
        server: {
            before: function(context) {
                return function(done) {
                    serverTestSetup(context, done);
                };
            },
            after: function(context) {
                return function(done) {
                    serverTestTeardown(context, done);
                };
            }
        }
    }
};