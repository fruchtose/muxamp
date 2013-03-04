var Q 		  = require('q'),
	testutils = require('../lib/testutils'),
	hooks	  = testutils.browser,
	Browser   = require('zombie'),
	muxamp 	  = require('../lib/server').getApplication();

describe('Frontend search', function() {
	var baseUrl = 'http://localhost:3000/';
	var context = {};
	before(hooks.before(context));

	beforeEach(hooks.beforeEach(context));
	afterEach(hooks.afterEach(context));

	it('should have the expected UI', function(done) {
		Q.nfcall(context.page.open, baseUrl).then(function() {
			return Q.nfcall(context.page.evaluate, function() {
				$('#search-query').size().should.eql(1);
				$('#search-submit').size().should.eql(1);
				$('#site-selector').size().should.eql(1);
				$('#search-site-dropdown').find('li').size().should.eql(3);
			}, function(err, result) {
				if (err) {
					throw err;
				}
				done();
			});
		}).done();
	});
	/*it('should be able to contact the server', function(done) {
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
	});*/

	after(hooks.after(context));
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
				return browser.visit(baseUrl).then(function() {
					var b = browser.fill('#search-query', 'MGMT');
					return Q.ninvoke(b, 'pressButton', '#search-submit');
				}, function(err) {
					throw err;
				});
			};
			var addFirstTrack = function(browser) {
				var deferred = Q.defer();
				window.Playlist.once('id', function() {
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