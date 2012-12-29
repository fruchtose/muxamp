var Q 		  = require('q'),
	Browser   = require('zombie'),
	testutils = require('../lib/testutils')
	muxamp 	  = require('../lib/server').getApplication();

describe('Frontend search', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/', setup;
	var browser, window;
	setup = {
		before: function() { browser = new Browser(); window = browser.window; },
		after: function() { browser.close(); }
	};
	testutils.server.testWithServer(3000, function() {
		it('should have the expected UI', function(done) {
			testutils.expectSuccess(browser.visit(baseUrl), function() {
				window.$('#search-query').size().should.eql(1);
				window.$('#search-submit').size().should.eql(1);
				window.$('#site-selector').size().should.eql(1);
				window.$('#search-site-dropdown').find('li').size().should.eql(3); // 3 options
			}, done);
		});
		it('should be able to contact the server', function(done) {
			var testCase = function() {
				var deferred = Q.defer();
				browser.visit(baseUrl).then(function() {
					browser
						.fill('#search-query', 'rebecca black')
						.pressButton('#search-submit', function() {
							deferred.resolve(browser);
						});
					
				}, function(error) {
					throw error;
				});
				return deferred.promise;
			};
			testutils.expectSuccess(testCase(), function(browser) {
				window.$('#search-results tbody tr').size().should.eql(25);
				window.$('#search-results tbody tr td.title-cell').each(function() {
					window.$(this).text().length.should.be.above(0);
				});
			}, done);
		});
	}, setup);
});
describe('Adding tracks from search', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/', setup;
	var browser, window;
	setup = {
		before: function() { browser = new Browser(); window = browser.window; },
		after: function() { browser.close(); }
	};
	testutils.server.testWithServer(3000, function() {
		it('should give the browser a playlist ID', function(done) {
			var search = function() {
				var deferred = Q.defer();
				browser.visit(baseUrl).then(function() {
					browser
						.fill('#search-query', 'MGMT')
						.pressButton('#search-submit', function() {
							deferred.resolve(browser);
						});
					
				}, function(error) {
					throw error;
				});
				return deferred.promise;
			};
			var addFirstTrack = function(browser) {
				var deferred = Q.defer();
				window.Playlist.on('id', function() {
					deferred.resolve(browser);
				})
				window.$('#search-results tr:first-child .search-add-result').click();
				return deferred.promise;
			}
			testutils.expectSuccess(browser.visit(baseUrl).then(search).then(addFirstTrack), function(browser) {
				window.Playlist.size().should.eql(1);
				window.Playlist.id.should.be.ok;
				window.Playlist.id.should.be.above(0);
			}, done);
		});
	}, setup);
});