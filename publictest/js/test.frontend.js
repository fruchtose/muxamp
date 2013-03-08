describe('Opening Muxamp', function() {
	it('should load SoundCloud', function(done) {
		soundManager.should.not.be.null;
		soundManager.onready(function() {
            assert.ok(true, "SoundManager 2 loaded.");
            done();
        });
	});
	it('should initialize the playlist', function() {
		Playlist.should.not.be.null;
	});
	it('should initialize the router', function() {
		Router.should.not.be.null;
	});
});

describe('Routing', function() {
	var checkFetch = function(id, data) {
		data.should.be.an('object');
		data.id.should.eql(id);
		data.tracks.should.be.an('array');
		data.tracks.length.should.be.above(0);
	};
	var asyncFetchVerifier = function(id, done) {
		return function(data) {
			checkFetch(id, data);
			done();
		};
	};
	it('should be able to fetch a playlist', function(done) {
		Router.load(150).then(asyncFetchVerifier(150, done));
	});
	it('should be able to fetch playlists in sequence', function(done) {
		Router.load(151).then(function(data) {
			checkFetch(151, data);
		}).then(function() {
			return Router.load(153);
		}).then(asyncFetchVerifier(153, done));
	})
});