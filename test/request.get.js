var request = require('request'),
	should  = require('should'),
	muxamp 	= require('../lib/server').getApplication(),
	baseUrl = 'http://localhost:';

describe('GET', function() {
	var testEnv = this, port = 3000;
	baseUrl += port + '/';
	before(function(done) {
		(testEnv.app = muxamp.listen(port)).on('listening', done);
	});
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
	after(function(done) {
		testEnv.app.on('close', done);
		testEnv.app.close();
	});
});