var Q 		  = require('q'),
	Browser   = require('zombie'),
	testutils = require('../lib/testutils')
	muxamp 	  = require('../lib/server').getApplication();

describe('Frontend search', function() {
	var port = 3000, testEnv = this;
	before(function(done) {
		(testEnv.app = muxamp.listen(port)).on('listening', function() {
			testEnv.browser = new Browser();
			done();
		});
		testEnv.baseUrl = 'http://localhost:' + port + '/';
	});
	after(function(done) {
		testEnv.app.on('close', done);
		testEnv.app.close();
	});

	it('should have the expected UI', function(done) {
		testutils.expectSuccess(testEnv.browser.visit(testEnv.baseUrl), function() {
			var window = testEnv.browser.window;
			window.$('#search-query').size().should.eql(1);
			window.$('#search-submit').size().should.eql(1);
			window.$('#site-selector').size().should.eql(1);
			window.$('#search-site-dropdown').find('li').size().should.eql(3); // 3 options
		}, done);
	});
	it('should be able to contact the server', function(done) {
		var testCase = function() {
			var deferred = Q.defer();
			testEnv.browser.visit(testEnv.baseUrl).then(function() {
			testEnv.browser
				.fill('#search-query', 'rebecca black')
				.pressButton('#search-submit', function() {
					deferred.resolve(testEnv.browser);
				});
			
			}, function(error) {
				throw error;
			});
			return deferred.promise;
		};
		testutils.expectSuccess(testCase(), function(browser) {
			browser.window.$('#search-results tbody tr').size().should.eql(25);
		}, done);
	});
});