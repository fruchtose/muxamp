var request   = require('request'),
	should    = require('should'),
	muxamp 	  = require('../lib/server').getApplication(),
	testutils = require('../lib/testutils');

describe('GET', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/';
	testutils.server.testWithServer(3000, function() {
		describe('search endpoint', function() {
			it('should return search results as JSON', function(done) {
				request({url: baseUrl + 'search/ytv/0/deadmau5'}, function(err, response, body) {
					response.statusCode.should.eql(200);
					should.not.exist(err);
					JSON.parse(body).should.have.length(25);
					done();
				});
			});
		});
	});
});