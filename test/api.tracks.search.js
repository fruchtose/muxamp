var apis = require('../lib/apis'),
	SoundCloud = apis.SoundCloud.Tracks,
	YouTube = apis.YouTube.Tracks,
	_	   = require('underscore')._;

describe('SoundCloud API track search', function() {
	describe('error handling', function() {
		it('should stop a search without arguments', function(done) {
			SoundCloud.search().fail(function(results) {
				results.should.have.property('error');
				results.error.should.be.a('string');
				results.error.length.should.be.above(0);
				done();
			}).done();
		});
		it('should stop a search with empty parameters', function(done) {
			SoundCloud.search({query: '', page: '', perPage: ''}).fail(function(results) {
				results.should.have.property('error');
				results.error.should.be.a('string');
				results.error.length.should.be.above(0);
				done();
			}).done();
		});
		it('should stop a search with an empty query', function(done) {
			SoundCloud.search({query: '', page: 0, perPage: 25}).fail(function(results) {
				results.should.have.property('error');
				results.error.should.be.a('string');
				results.error.length.should.be.above(0);
				done();
			}).done();
		});
	});
	describe('functionality', function() {
		var page0;
		it('should have tracks for deadmau5', function(done) {
			SoundCloud.search({query: 'deadmau5', page: 0, perPage: 25}).then(function(data) {
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
			SoundCloud.search({query: 'deadmau5', page: 1, perPage: 25}).then(function(data) {
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
			SoundCloud.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25}).then(function(data) {
				data.should.have.property('tracks');
				data.tracks.should.have.length(0);
				done();
			}).done();
		});
	});
});

describe('YouTube API video search', function() {
	describe('error handling', function() {
		it('should stop a search without arguments', function(done) {
			YouTube.search().fail(function(results) {
				results.should.have.property('error');
				results.error.should.be.a('string');
				results.error.length.should.be.above(0);
				done();
			}).done();
		});
		it('should stop a search with empty parameters', function(done) {
			YouTube.search({query: '', page: '', perPage: ''}).fail(function(results) {
				results.should.have.property('error');
				results.error.should.be.a('string');
				results.error.length.should.be.above(0);
				done();
			}).done();
		});
		it('should stop a search with an empty query', function(done) {
			YouTube.search({query: '', page: 0, perPage: 25}).fail(function(results) {
				results.should.have.property('error');
				results.error.should.be.a('string');
				results.error.length.should.be.above(0);
				done();
			}).done();
		});
	});
	describe('functionality', function() {
		var page0;
		it('should have videos for Katy Perry', function(done) {
			YouTube.search({query: 'katy perry', page: 0, perPage: 25}).then(function(data) {
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
			YouTube.search({query: 'katy perry', page: 1, perPage: 25}).then(function(data) {
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
			YouTube.search({query: '12341234adfadfasdf2344134', page: 0, perPage: 25}).then(function(data) {
				data.should.have.property('tracks');
				data.tracks.should.have.length(0);
				done();
			}).done();
		});
	});
});