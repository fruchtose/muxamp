var _	   	   = require('underscore')._,
	Q 		   = require('q'),
	apis 	   = require('../lib/apis'),
	SoundCloud = apis.SoundCloud.Tracks,
	YouTube    = apis.YouTube.Tracks,
	testutils  = require('../lib/testutils');

describe('SoundCloud API track search', function() {
	describe('error handling', function() {
		it('should stop a search without arguments', function(done) {
			SoundCloud.search().should.be.rejected.and.notify(done);
		});
		it('should stop a search with empty parameters', function(done) {
			SoundCloud.search({query: '', page: '', perPage: ''}).should.be.rejected.and.notify(done);
		});
		it('should stop a search with an empty query', function(done) {
			SoundCloud.search({query: '', page: 0, perPage: 25}).should.be.rejected.and.notify(done);
		});
	});
	describe('functionality', function() {
		var page0;
		it('should have tracks for deadmau5', function(done) {
			var search = SoundCloud.search({query: 'deadmau5', page: 0, perPage: 25});
			var comingTracks = search.get('tracks');
			Q.all([
				search.should.be.resolved,
				search.should.eventually.have.property('tracks'),
				comingTracks.should.eventually.have.length(25),
				comingTracks.then(function(tracks) {
					page0 = tracks;
					_.each(tracks, function(track) {
						track.should.have.property('type').eql('audio');
					});
				})
			]).should.notify(done);
		});
		it('should have multiple pages of tracks for deadmau5', function(done) {
			var search = SoundCloud.search({query: 'deadmau5', page: 1, perPage: 25});
			var comingTracks = search.get('tracks');
			Q.all([
				search.should.be.resolved,
				search.should.eventually.have.property('tracks'),
				comingTracks.should.eventually.have.length(25),
				comingTracks.then(function(tracks) {
					_.each(tracks, function(track, index) {
						page0[index].should.not.eql(track);
						track.should.have.property('type').eql('audio');
					});
				})
			]).should.notify(done);
		});
		it('should not have results for a nonsensical query', function(done) {
			var search = SoundCloud.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25});
			Q.all([
				search.should.be.resolved,
				search.should.eventually.have.property('tracks'),
				search.get('tracks').should.eventually.have.length(0)
			]).should.notify(done);
		});
	});
});

describe('YouTube API video search', function() {
	describe('error handling', function() {
		it('should stop a search without arguments', function(done) {
			YouTube.search().should.be.rejected.and.notify(done);
		});
		it('should stop a search with empty parameters', function(done) {
			YouTube.search({query: '', page: '', perPage: ''}).should.be.rejected.and.notify(done);
		});
		it('should stop a search with an empty query', function(done) {
			YouTube.search({query: '', page: 0, perPage: 25}).should.be.rejected.and.notify(done);
		});
	});
	describe('functionality', function() {
		var page0;
		it('should have tracks for katy perry', function(done) {
			var search = YouTube.search({query: 'katy perry', page: 0, perPage: 25});
			var comingTracks = search.get('tracks');
			Q.all([
				search.should.be.resolved,
				search.should.eventually.have.property('tracks'),
				comingTracks.should.eventually.have.length(25),
				comingTracks.then(function(tracks) {
					page0 = tracks;
					_.each(tracks, function(track) {
						track.should.have.property('type').eql('video');
					});
				})
			]).should.notify(done);
		});
		it('should have multiple pages of tracks for katy perry', function(done) {
			var search = YouTube.search({query: 'katy perry', page: 1, perPage: 25});
			var comingTracks = search.get('tracks');
			Q.all([
				search.should.be.resolved,
				search.should.eventually.have.property('tracks'),
				comingTracks.should.eventually.have.length(25),
				comingTracks.then(function(tracks) {
					_.each(tracks, function(track, index) {
						page0[index].should.not.eql(track);
						track.should.have.property('type').eql('video');
					});
				})
			]).should.notify(done);
		});
		it('should not have results for a nonsensical query', function(done) {
			var search = YouTube.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25});
			Q.all([
				search.should.be.resolved,
				search.should.eventually.have.property('tracks'),
				search.get('tracks').should.eventually.have.length(0)
			]).should.notify(done);
		});
	});
});