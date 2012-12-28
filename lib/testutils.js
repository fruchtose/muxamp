var should = require('should'),
	_ 	   = require('underscore')._;

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

module.exports = {
	expectError: expectError,
	expectErrorMessage: expectErrorMessage,
	expectSuccess: expectSuccess
};