var router = require('../lib/router').getRouter(),
	_ = require('underscore')._;

_.str = require('underscore.string');

describe('YouTube', function() {
	var checkPSY = function(results) {
		results.should.have.property('tracks');
		results.tracks.should.have.length(1);
		var media = results.tracks[0];
		media.should.have.property('author');
		media.author.should.eql('officialpsy');
		return results;
	};
	it('should be able to dance to PSY', function(done) {
		router.get('http://www.youtube.com/watch?v=9bZkp7q19f0').then(function(results) {
			checkPSY(results);
			done();
		}).done();
	});
	it('should be able to dance to shared PSY', function(done) {
		router.get('http://youtu.be/9bZkp7q19f0').then(function(results) {
			checkPSY(results);
			done();
		}).done();
	});
	it('should be able to dance to PSY in a related video', function(done) {
		router.get('http://www.youtube.com/watch?feature=fvwpb&v=9bZkp7q19f0&NR=1').then(function(results) {
			checkPSY(results);
			done();
		}).done();
	});
	it('should be able to dance to PSY using a short URL', function(done) {
		router.get('youtube.com/v/9bZkp7q19f0').then(function(results) {
			checkPSY(results);
			done();
		}).done();
	});
	it('should be able to dance to PSY using a googleapis URL', function(done) {
		router.get('http://youtube.googleapis.com/v/9bZkp7q19f0').then(function(results) {
			checkPSY(results);
			done();
		}).done();
	});
});

describe('SoundCloud', function() {
	var checkLevelsRemix = function(results) {
		results.should.have.property('tracks');
		results.tracks.should.have.length(1);
		var media = results.tracks[0];
		media.should.have.property('author');
		media.author.should.eql('@@ (AT-AT)');
		return results;
	};
	it('should be able to fetch the best remix of Levels', function(done) {
		router.get('https://soundcloud.com/djatat/avicii-levels-remix-full').then(function(results) {
			checkLevelsRemix(results);
			done();
		}).done();
	});
	it('should be able to fetch the best remix of Levels from the API', function(done) {
		router.get('http://api.soundcloud.com/tracks/46010803').then(function(results) {
			checkLevelsRemix(results);
			done();
		}).done();
	});
	it('should be able to fetch the best remix of Levels from an embedded player', function(done) {
		router.get('http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F46010803').then(function(results) {
			checkLevelsRemix(results);
			done();
		}).done();
	});
	it('should be able to fetch the best remix of Levels from an embedded Flash player', function(done) {
		router.get('http://p1.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F46010803&remote_addr=10.20.3.72&referer=').then(function(results) {
			checkLevelsRemix(results);
			done();
		}).done();
	});
	it('should be able to fetch the best remix of Levels from a redirected embedded Flash player', function(done) {
		router.get('http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F46010803&remote_addr=10.20.3.72&referer=').then(function(results) {
			checkLevelsRemix(results);
			done();
		}).done();
	});
});