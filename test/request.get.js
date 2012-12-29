var request   = require('request'),
	should    = require('should'),
	muxamp 	  = require('../lib/server').getApplication(),
	testutils = require('../lib/testutils');

describe('GET', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/';
	testutils.server.testWithServer(3000, function() {
		describe('search endpoint', function() {
			describe('error handling', function() {
				it('should return an error for no query', function(done) {
					request({url: baseUrl + 'search/ytv/0/'}, function(err, response, body) {
						response.statusCode.should.eql(200);
						JSON.parse(body).should.have.property('error');
						done();
					});
				});
			});
			it('should return search results as JSON', function(done) {
				request({url: baseUrl + 'search/ytv/0/deadmau5'}, function(err, response, body) {
					response.statusCode.should.eql(200);
					should.not.exist(err);
					JSON.parse(body).should.have.length(25);
					done();
				});
			});
		});
		describe('playlist endpoint', function() {
			it('should return search results as JSON', function(done) {
				request({url: baseUrl + 'playlists/57'}, function(err, response, body) {
					response.statusCode.should.eql(200);
					should.not.exist(err);
					var data = JSON.parse(body);
					data.should.have.property('id');
					data['id'].should.eql(57);
					data.should.have.property('tracks');
					data['tracks'].should.have.length(5);
					done();
				});
			});
		});
	});
});