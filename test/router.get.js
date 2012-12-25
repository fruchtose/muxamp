var router = require('../lib/router').getRouter();

describe('Error handling', function() {
	it('should return an error for an empty string', function(done) {
		router.get('').fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should return an error for unexpected input', function(done) {
		router.get(5.2345).fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should return an error for a URL not covered by Muxamp', function(done) {
		router.get('https://github.com/visionmedia/should.js').fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should not be able to fetch a YouTube user\s profile', function(done) {
		router.get('http://www.youtube.com/user/officialpsy').fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should not be able to fetch a SoundCloud user profile', function(done) {
		router.get('https://soundcloud.com/foofighters').fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should not be able to fetch a SoundCloud set', function(done) {
		router.get('https://soundcloud.com/foofighters/sets/wasting-light').fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
});

describe('YouTube access', function() {
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

describe('SoundCloud access', function() {
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