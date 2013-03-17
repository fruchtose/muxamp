var _         = require('underscore'),
    search    = require('../lib/search').search,
    testutils = require('../lib/testutils');

describe('Error handling', function() {
    it('should stop a search without arguments', function(done) {
        testutils.expectErrorMessage(search(), done);
    });
    it('should stop a search with an empty query', function(done) {
        testutils.expectErrorMessage(search('', 0, 25), done);
    });
    it('should stop a search without a site code', function(done) {
        testutils.expectErrorMessage(search('rolling stones', '', 25), done);
    });
    it('should stop a search with a nonexistent site code', function(done) {
        testutils.expectErrorMessage(search('rolling stones', 'lol', 0), done);
    });
    it('should stop a search for a string that is not a URL', function(done) {
        testutils.expectErrorMessage(search('sup brah'), done);
    });
    it('should stop a search for a URL not covered by Muxamp', function(done) {
        testutils.expectErrorMessage(search('https://github.com/visionmedia/should.js'), done);
    });
});

describe('URL search', function() {
    var checkPSY, checkLevelsRemix;
    checkPSY = function(results) {
        results.should.have.property('tracks');
        should.exist(results.tracks);
        should.exist(results.tracks.length);
        results.tracks.should.have.length(1);
        var media = results.tracks[0];
        media.should.have.property('author');
        media.author.should.eql('officialpsy');
        return results;
    };
    checkLevelsRemix = function(results) {
        results.should.have.property('tracks');
        should.exist(results.tracks);
        should.exist(results.tracks.length);
        results.tracks.should.have.length(1);
        var media = results.tracks[0];
        media.should.have.property('author');
        media.author.should.eql('@@ (AT-AT)');
        return results;
    };

    it('should be able to search for a YouTube video', function(done) {
        testutils.expectSuccess(search('http://www.youtube.com/watch?v=9bZkp7q19f0'), checkPSY, done);
    });
    it('should be able to search for a SoundCloud track', function(done) {
        testutils.expectSuccess(search('http://soundcloud.com/djatat/avicii-levels-remix-full'), checkLevelsRemix, done);
    });
});

describe('SoundCloud search', function() {
    var page0 = [];
    it('should have results for deadmau5', function(done) {
        testutils.expectSuccess(search('katy perry', 'sct', 0), function(data) {
            data.should.have.property('tracks');
            // deadmau5 is popular, we should have results
            var tracks = page0 = data.tracks;
            should.exist(tracks);
            should.exist(tracks.length);
            tracks.length.should.be.above(0);
            _.each(tracks, function(track) {
                track.should.have.property('type').eql('audio');
            });
        }, done);
    });
    it('should have multiple pages of results for deadmau5', function(done) {
        testutils.expectSuccess(search('katy perry', 'sct', 1), function(data) {
            data.should.have.property('tracks');
            // deadmau5 is popular, we should have results
            var tracks = data.tracks;
            should.exist(tracks);
            should.exist(tracks.length);
            tracks.length.should.be.above(0);
            _.each(tracks, function(track, index) {
                track.should.not.eql(page0[index]);
                track.should.have.property('type').eql('audio');
            });
        }, done);
    });
    it('should not have results for a nonsensical query', function(done) {
        testutils.expectSuccess(search('12341234adfadfasdf2344134', 'sct', 0), function(data) {
            data.should.have.property('tracks');
            data.tracks.should.have.length(0);
        }, done);
    });
});

describe('YouTube search', function() {
    var page0 = [];
    it('should have videos for kate bush', function(done) {
        testutils.expectSuccess(search('kate bush', 'ytv', 0), function(data) {
            data.should.have.property('tracks');
            // Katy Perry is popular, we should have results
            var tracks = page0 = data.tracks;
            should.exist(tracks);
            should.exist(tracks.length);
            tracks.length.should.be.above(0);
            _.each(tracks, function(track) {
                track.should.have.property('type').eql('video');
            });
        }, done);
    });
    it('should have multiple pages of videos for kate bush', function(done) {
        testutils.expectSuccess(search('kate bush', 'ytv', 1), function(data) {
            data.should.have.property('tracks');
            // Katy Perry is popular, we should have results
            var tracks = data.tracks;
            should.exist(tracks);
            should.exist(tracks.length);
            tracks.length.should.be.above(0);
            _.each(tracks, function(track, index) {
                track.should.not.eql(page0[index]);
                track.should.have.property('type').eql('video');
            });
        }, done);
    });
    it('should not have results for a nonsensical query', function(done) {
        testutils.expectSuccess(search('12341234adfadfasdf2344134', 'ytv', 0), function(data) {
            data.should.have.property('tracks');
            data.tracks.should.have.length(0);
        }, done);
    });
});