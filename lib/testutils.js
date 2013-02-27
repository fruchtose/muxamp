var should  = require('chai').should(),
	_ 	    = require('underscore'),
	Q		= require('q'),
	Browser = require('zombie'),
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
	var app,
		beforeCallback = options.before || function() {},
		afterCallback = options.afterCallback || function() {};
	before(function(done) {
		(app = muxamp.listen(port)).on('listening', function() {
			beforeCallback();
			done();
		});
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

var UIContext = function(hostname, port) {
	this.baseUrl = 'http://' + hostname + ':' + port + '/';
	this.browser = new Browser();
	this.url = this.baseUrl;
};

UIContext.prototype = {
	goToPlaylist: function(id, options) {
		var self = this, checkId;
		checkId = function() {
			this.browser.window.Playlist.id.should.eql(id);
			return self;
		};
		return this.browser.visit(this.baseUrl + id, options)
			.then(function() {
				return checkId();
			}, thrower);
	}
};

var uiblocks = {
	getContext: function(hostname, port) {
		return new UIContext(hostname, port);
	}
};

module.exports = {
	expectError: expectError,
	expectErrorMessage: expectErrorMessage,
	expectSuccess: expectSuccess,
	server: {
		testWithServer: runTestWithServer
	},
	uiblocks: uiblocks,
	thrower: thrower
};