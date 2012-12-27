var testutils = require('../lib/testutils'),
	router    = require('../lib/router').getRouter();

describe('URL router', function() {
	describe('error handling', function() {
		it('should return an error for an empty string', function(done) {
			testutils.expectErrorMessage(router.get(''), done);
		});
		it('should return an error for unexpected input', function(done) {
			testutils.expectErrorMessage(router.get(5.2345), done);
		});
		it('should return an error for a URL not covered by Muxamp', function(done) {
			testutils.expectErrorMessage(router.get('https://github.com/visionmedia/should.js'), done);
		});
		it('should not be able to fetch a YouTube user\s profile', function(done) {
			testutils.expectErrorMessage(router.get('http://www.youtube.com/user/officialpsy'), done);
		});
		it('should not be able to fetch a SoundCloud user profile', function(done) {
			testutils.expectErrorMessage(router.get('https://soundcloud.com/foofighters'), done);
		});
		it('should not be able to fetch a SoundCloud set', function(done) {
			testutils.expectErrorMessage(router.get('https://soundcloud.com/foofighters/sets/wasting-light'), done);
		});
	});

	var checkPSY = function(results) {
		results.should.have.property('tracks');
		results.tracks.should.have.length(1);
		var media = results.tracks[0];
		media.should.have.property('author');
		media.author.should.eql('officialpsy');
		return results;
	};
	var expectPSY = function(deferred, done) {
		testutils.expectSuccess(deferred, checkPSY, done);
	};
	var gangnamStyle = 'http://www.youtube.com/watch?v=9bZkp7q19f0';

	describe('exclusion handling', function() {
		it('should not interfere when non-applicable sites are excluded', function(done) {
			expectPSY(router.get(gangnamStyle, ['sct']), done);
		});
		it('should interfere when applicable sites are excluded', function(done) {
			testutils.expectErrorMessage(router.get(gangnamStyle, ['ytv']), done);
		});
	});

	describe('YouTube access', function() {
		it('should be able to dance to PSY', function(done) {
			expectPSY(router.get(gangnamStyle), done);
		});
		it('should be able to dance to shared PSY', function(done) {
			expectPSY(router.get('http://youtu.be/9bZkp7q19f0'), done);
		});
		it('should be able to dance to PSY in a related video', function(done) {
			expectPSY(router.get('http://www.youtube.com/watch?feature=fvwpb&v=9bZkp7q19f0&NR=1'), done);
		});
		it('should be able to dance to PSY using a short URL', function(done) {
			expectPSY(router.get('youtube.com/v/9bZkp7q19f0'), done);
		});
		it('should be able to dance to PSY using a googleapis URL', function(done) {
			expectPSY(router.get('http://youtube.googleapis.com/v/9bZkp7q19f0'), done);
		});
	});

	describe('SoundCloud access', function() {
		var checkLevelsRemix = function(results) {
			results.should.have.property('tracks');
			results.tracks.should.have.length(1);
			var media = results.tracks[0];
			media.should.have.property('author');
			media.author.should.eql('@@ (AT-AT)');
			return results;
		};
		var expectLevels = function(deferred, done) {
			return testutils.expectSuccess(deferred, checkLevelsRemix, done);
		}
		it('should be able to fetch the best remix of Levels', function(done) {
			expectLevels(router.get('https://soundcloud.com/djatat/avicii-levels-remix-full'), done);
		});
		it('should be able to fetch the best remix of Levels from the API', function(done) {
			expectLevels(router.get('http://api.soundcloud.com/tracks/46010803'), done);
		});
		it('should be able to fetch the best remix of Levels from an embedded player', function(done) {
			expectLevels(router.get('http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F46010803'), done);
		});
		it('should be able to fetch the best remix of Levels from an embedded Flash player', function(done) {
			expectLevels(router.get('http://p1.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F46010803&remote_addr=10.20.3.72&referer='), done);
		});
		it('should be able to fetch the best remix of Levels from a redirected embedded Flash player', function(done) {
			expectLevels(router.get('http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F46010803&remote_addr=10.20.3.72&referer='), done);
		});
		it('should be able to fetch a track from a download link ', function(done) {
			var expectDownload = function(results) {
				results.should.have.property('tracks');
				results.tracks.should.have.length(1);
				var media = results.tracks[0];
				media.should.have.property('author');
				media.author.should.eql('Cyril Hahn');
			};
			// From https://soundcloud.com/cyrilhahn/destinys-child-say-my-name
			testutils.expectSuccess(router.get('http://api.soundcloud.com/tracks/49816643/download'), expectDownload, done);
		});
	});
});