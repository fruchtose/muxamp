var testutils = require('../lib/testutils'),
    router    = require('../lib/router').getRouter();

describe('URL router', function() {
    var expectAuthor = function(promise, authorName, done) {
        var tracks = promise.get('tracks'), media = tracks.get(0), author = media.get('author');
        Q.all([
            promise.should.be.fulfilled,
            promise.should.eventually.have.property('tracks'),
            tracks.should.eventually.have.length(1),
            media.should.eventually.have.property('author'),
            author.should.eventually.eql(authorName),
        ]).should.notify(done);
    };
    describe('error handling', function() {
        it('should return an error for an empty string', function(done) {
            router.get('').should.be.rejected.and.notify(done);
        });
        it('should return an error for unexpected input', function(done) {
            router.get(5.2345).should.be.rejected.and.notify(done);
        });
        it('should return an error for a URL not covered by Muxamp', function(done) {
            router.get('https://github.com/visionmedia/should.js').should.be.rejected.and.notify(done);
        });
        it('should not be able to fetch a YouTube user\s profile', function(done) {
            router.get('http://www.youtube.com/user/officialpsy').should.be.rejected.and.notify(done);
        });
        it('should not be able to fetch a SoundCloud user profile', function(done) {
            router.get('https://soundcloud.com/foofighters').should.be.rejected.and.notify(done);
        });
        it('should not be able to fetch a SoundCloud set', function(done) {
            router.get('https://soundcloud.com/foofighters/sets/wasting-light').should.be.rejected.and.notify(done);
        });
        // Search query: romney
        it('should return an error for unstreamable media', function(done) {
            router.get('http://www.youtube.com/watch?v=yTCRwi71_ns').should.be.rejected.and.notify(done);
        });
    });

    var expectPSY = function(promise, done) {
        return expectAuthor(promise, 'officialpsy', done);
    };
    var gangnamStyle = 'http://www.youtube.com/watch?v=9bZkp7q19f0';

    describe('exclusion handling', function() {
        it('should not interfere when non-applicable sites are excluded', function(done) {
            expectPSY(router.get(gangnamStyle, ['sct']), done);
        });
        it('should interfere when applicable sites are excluded', function(done) {
            router.get(gangnamStyle, ['ytv']).should.be.rejected.and.notify(done);
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
        var expectLevels = function(promise, done) {
            expectAuthor(promise, '@@ (AT-AT)', done);
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
            // From https://soundcloud.com/cyrilhahn/destinys-child-say-my-name
            expectAuthor(router.get('http://api.soundcloud.com/tracks/49816643/download'), 'Cyril Hahn', done);
        });
    });

    describe('Jamendo access', function() {
        var expectGWB = function(promise, done) {
            expectAuthor(promise, 'Great White Buffalo', done);
        };
        it('should be able to fetch a track from Great White Buffalo', function(done) {
            expectGWB(router.get('http://www.jamendo.com/en/track/1031200/likely-story'), done);
        });
        it('should be able to fetch a track from Great White Buffalo with some URL params gone', function(done) {
            expectGWB(router.get('http://www.jamendo.com/track/1031200'), done);
        });
    });
});