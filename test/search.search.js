var search = require('../lib/search').search,
	_	   = require('underscore')._;

describe('Error catching', function() {
	it('should stop a search without arguments', function(done) {
		search().fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should stop a search with an empty query', function(done) {
		search('', 'ytv', 0).fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should stop a search without a site code', function(done) {
		search('rolling stones', '', 0).fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should stop a search with a nonexistent site code', function(done) {
		search('rolling stones', 'lol', 0).fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
	it('should return no results for a URL not covered by Muxamp', function(done) {
		search('https://github.com/visionmedia/should.js').fail(function(results) {
			results.should.have.property('error');
			results.error.should.be.a('string');
			results.error.length.should.be.above(0);
			done();
		}).done();
	});
});

describe('URL search', function() {
	var checkPSY, checkLevelsRemix;
	checkPSY = function(results) {
		results.should.have.property('tracks');
		results.tracks.should.have.length(1);
		var media = results.tracks[0];
		media.should.have.property('author');
		media.author.should.eql('officialpsy');
		return results;
	};
	checkLevelsRemix = function(results) {
		results.should.have.property('tracks');
		results.tracks.should.have.length(1);
		var media = results.tracks[0];
		media.should.have.property('author');
		media.author.should.eql('@@ (AT-AT)');
		return results;
	};

	it('should be able to search for a YouTube video', function(done) {
		search('http://www.youtube.com/watch?v=9bZkp7q19f0').then(function(results) {
			checkPSY(results);
			done();
		}).done();
	});
	it('should be able to search for a SoundCloud track', function(done) {
		search('http://soundcloud.com/djatat/avicii-levels-remix-full').then(function(results) {
			checkLevelsRemix(results);
			done();
		}).done();
	});
});

describe('SoundCloud search', function() {
	var page0;
	it('should have tracks for deadmau5', function(done) {
		search('deadmau5', 'sct', 0).then(function(data) {
			data.should.have.property('tracks');
			// deadmau5 is popular, we should have results
			var tracks = page0 = data.tracks;
			tracks.should.have.length(25);
			_.each(tracks, function(track) {
				track.should.have.property('type').eql('audio');
			});
			done();
		}).done();
	});
	it('should have multiple pages of tracks for deadmau5', function(done) {
		search('deadmau5', 'sct', 1).then(function(data) {
			data.should.have.property('tracks');
			// deadmau5 is popular, we should have results
			var tracks = data.tracks;
			tracks.should.have.length(25);
			_.each(tracks, function(track, index) {
				page0[index].should.not.eql(track);
				track.should.have.property('type').eql('audio');
			});
			done();
		}).done();
	});
	it('should not have results for a nonsensical query', function(done) {
		search('12341234adfadfasdf2344134', 'sct', 0).then(function(data) {
			data.should.have.property('tracks');
			data.tracks.should.have.length(0);
			done();
		}).done();
	});
});

describe('YouTube search', function() {
	var page0;
	it('should have videos for Katy Perry', function(done) {
		search('katy perry', 'ytv', 0).then(function(data) {
			data.should.have.property('tracks');
			// Katy Perry is popular, we should have results
			var tracks = page0 = data.tracks;
			tracks.should.have.length(25);
			_.each(tracks, function(track) {
				track.should.have.property('type').eql('video');
			});
			done();
		}).done();
	});
	it('should have multiple pages of videos for Katy Perry', function(done) {
		search('katy perry', 'ytv', 1).then(function(data) {
			data.should.have.property('tracks');
			// Katy Perry is popular, we should have results
			var tracks = data.tracks;
			tracks.should.have.length(25);
			_.each(tracks, function(track, index) {
				page0[index].should.not.eql(track);
				track.should.have.property('type').eql('video');
			});
			done();
		}).done();
	});
	it('should not have results for a nonsensical query', function(done) {
		search('12341234adfadfasdf2344134', 'ytv', 0).then(function(data) {
			data.should.have.property('tracks');
			data.tracks.should.have.length(0);
			done();
		}).done();
	});
});