var Q 		  = require('q'),
	Browser   = require('zombie'),
	testutils = require('../lib/testutils')
	muxamp 	  = require('../lib/server').getApplication();

describe('Browser playlist interaction', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/', setup;
	var browser, window;
	setup = {
		before: function() { browser = new Browser(); window = browser.window; },
		after: function() { browser.close(); }
	};
	testutils.server.testWithServer(3000, function() {
		it('should have the expected UI', function(done) {
			browser.visit(baseUrl).then(function() {
				window.$('#controls a').size().should.eql(5); //Back, play, stop, next, shuffle
			}).should.be.fulfilled.and.notify(done);
		});
		it('should be able to navigate to a playlist', function(done) {
			browser.visit(baseUrl + 156).then(function() {
				window.Playlist.id.should.eql(156);
			}).should.be.fulfilled.and.notify(done);
		});
	}, setup);
});

/*describe('Browser playlist interaction', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/', setup;
	var browser, window;
	setup = {
		before: function() { browser = new Browser(); window = browser.window; },
		after: function() { browser.close(); }
	};
	testutils.server.testWithServer(3000, function() {
		it('should be able to play a YouTube video', function(done) {
			var visit = browser.visit(baseUrl + 57);
			Q.all([
				visit.should.be.fulfilled,
				visit.then(function() {
					var deferred = Q.defer();
					window.Playlist.once('play', function() {
						window.setTimeout(function() {
							window.Playlist.isPlaying().should.be.ok;
							deferred.resolve();
						}, 10000);
					});
					window.Playlist.play();
					return deferred.promise;
				}).should.be.fulfilled
			]).should.notify(done);
			/*var load = Q.when(browser.visit(baseUrl + 57), function() {
				window.Playlist.once('play', function() {
					window.setTimeout(function() {
						console.log(window.Playlist.isPlaying());
						window.Playlist.isPlaying().should.be.ok;
					}, 600);
				});
				window.Playlist.play();
				return browser;
			}, testutils.thrower);
			testutils.expectSuccess(load, function(browser) {
				window.Playlist.id.should.eql(57);
			}, done);*/
/*		});
	}, setup);
});*/