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
			testutils.expectSuccess(browser.visit(baseUrl), function() {
				window.$('#controls a').size().should.eql(5); //Back, play, stop, next, shuffle
			}, done);
		});
		it('should be able to navigate to a playlist', function(done) {
			testutils.expectSuccess(browser.visit(baseUrl + 156), function(browser) {
				window.Playlist.id.should.eql(156);
			}, done);
		});
	}, setup);
});

describe('Browser playlist interaction', function() {
	var baseUrl = 'http://localhost:' + 3000 + '/', setup;
	var browser, window;
	setup = {
		before: function() { browser = new Browser(); window = browser.window; },
		after: function() { browser.close(); }
	};
	testutils.server.testWithServer(3000, function() {
		it('should be able to play a YouTube video', function(done) {
			var load = Q.when(browser.visit(baseUrl + 57), function() {
				window.Playlist.once('play', function() {
					window.setTimeout(function() {
						window.Playlist.isPlaying().should.be.ok;
					}, 600);
				});
				window.Playlist.play();
				return browser;
			}, testutils.thrower);
			testutils.expectSuccess(load, function(browser) {
				window.Playlist.id.should.eql(57);
			}, done);
		});
	}, setup);
});