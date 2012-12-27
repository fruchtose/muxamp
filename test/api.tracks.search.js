var _	   	   = require('underscore')._,
	apis 	   = require('../lib/apis'),
	SoundCloud = apis.SoundCloud.Tracks,
	YouTube    = apis.YouTube.Tracks,
	testutils  = require('../lib/testutils');

describe('SoundCloud API track search', function() {
	describe('error handling', function() {
		it('should stop a search without arguments', function(done) {
			testutils.expectErrorMessage(SoundCloud.search(), done);
		});
		it('should stop a search with empty parameters', function(done) {
			testutils.expectErrorMessage(SoundCloud.search({query: '', page: '', perPage: ''}), done);
		});
		it('should stop a search with an empty query', function(done) {
			testutils.expectErrorMessage(SoundCloud.search({query: '', page: 0, perPage: 25}), done);
		});
	});
	describe('functionality', function() {
		var page0;
		it('should have tracks for deadmau5', function(done) {
			testutils.expectSuccess(SoundCloud.search({query: 'deadmau5', page: 0, perPage: 25}), 
				function (data) {
					data.should.have.property('tracks');
					// deadmau5 is popular, we should have results
					var tracks = page0 = data.tracks;
					tracks.should.have.length(25);
					_.each(tracks, function(track) {
						track.should.have.property('type').eql('audio');
					});
			}, done);
		});
		it('should have multiple pages of tracks for deadmau5', function(done) {
			testutils.expectSuccess(SoundCloud.search({query: 'deadmau5', page: 1, perPage: 25}), 
				function (data) {
					data.should.have.property('tracks');
					// deadmau5 is popular, we should have results
					var tracks = data.tracks;
					tracks.should.have.length(25);
					_.each(tracks, function(track, index) {
						page0[index].should.not.eql(track);
						track.should.have.property('type').eql('audio');
					});
			}, done);
		});
		it('should not have results for a nonsensical query', function(done) {
			testutils.expectSuccess(SoundCloud.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25}), 
				function (data) {
					data.should.have.property('tracks');
					data.tracks.should.have.length(0);
			}, done);
		});
	});
});

describe('YouTube API video search', function() {
	describe('error handling', function() {
		it('should stop a search without arguments', function(done) {
			testutils.expectErrorMessage(YouTube.search(), done);
		});
		it('should stop a search with empty parameters', function(done) {
			testutils.expectErrorMessage(YouTube.search({query: '', page: '', perPage: ''}), done);
		});
		it('should stop a search with an empty query', function(done) {
			testutils.expectErrorMessage(YouTube.search({query: '', page: 0, perPage: 25}), done);
		});
	});
	describe('functionality', function() {
		var page0;
		it('should have tracks for katy perry', function(done) {
			testutils.expectSuccess(YouTube.search({query: 'katy perry', page: 0, perPage: 25}), 
				function (data) {
					data.should.have.property('tracks');
					// katy perry is popular, we should have results
					var tracks = page0 = data.tracks;
					tracks.should.have.length(25);
					_.each(tracks, function(track) {
						track.should.have.property('type').eql('video');
					});
			}, done);
		});
		it('should have multiple pages of tracks for katy perry', function(done) {
			testutils.expectSuccess(YouTube.search({query: 'katy perry', page: 1, perPage: 25}), 
				function (data) {
					data.should.have.property('tracks');
					// katy perry is popular, we should have results
					var tracks = data.tracks;
					tracks.should.have.length(25);
					_.each(tracks, function(track, index) {
						page0[index].should.not.eql(track);
						track.should.have.property('type').eql('video');
					});
			}, done);
		});
		it('should not have results for a nonsensical query', function(done) {
			testutils.expectSuccess(YouTube.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25}), 
				function (data) {
					data.should.have.property('tracks');
					data.tracks.should.have.length(0);
			}, done);
		});
	});
});