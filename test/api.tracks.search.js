var _          = require('underscore'),
    Q          = require('q'),
    apis       = require('../lib/apis'),
    Jamendo    = apis.Jamendo.Tracks,
    SoundCloud = apis.SoundCloud.Tracks,
    YouTube    = apis.YouTube.Tracks,
    testutils  = require('../lib/testutils');

var verifySearch = function(search, trackType, done) {
    var comingTracks = search.get('tracks');
    var trackLength = comingTracks.get('length');
    Q.all([
        search.should.be.fulfilled,
        search.should.eventually.have.property('tracks'),
        trackLength.should.eventually.be.above(0),
        comingTracks.then(function(tracks) {
            _.each(tracks, function(track) {
                track.should.have.property('type').eql(trackType);
            });
        })
    ]).should.notify(done);
};

var verifyMultipageSearch = function(api, query, perPage, trackType, done) {
    var page1 = api.search({query: query, page: 0, perPage: perPage}),
        page2 = api.search({query: query, page: 1, perPage: perPage});
    Q.all([page1, page2]).spread(function(page1Results, page2Results) {
        var page1Tracks = page1Results.tracks,
            page2Tracks = page2Results.tracks;
        page1Tracks.length.should.be.above(0);
        page2Tracks.length.should.be.above(0);
        _.each(page1Tracks, function(track, i) {
            track.should.not.eql(page2Tracks[i]);
        });
        return Q.all([
            page1.should.be.fulfilled,
            page2.should.be.fulfilled
        ]);
    }).then(function() {
        return [].slice.call(arguments);
    }).should.notify(done);
};

describe('Jamendo API track search', function() {
    before(testutils.db.clean());

    describe('error handling', function() {
        it('should stop a search without arguments', function(done) {
            Jamendo.search().should.be.rejected.and.notify(done);
        });
        it('should stop a search with empty parameters', function(done) {
            Jamendo.search({query: '', page: '', perPage: ''}).should.be.rejected.and.notify(done);
        });
        it('should stop a search with an empty query', function(done) {
            Jamendo.search({query: '', page: 0, perPage: 25}).should.be.rejected.and.notify(done);
        });
    });
    describe('functionality', function() {
        it('should have tracks for rock', function(done) {
            var search = Jamendo.search({query: 'rock', page: 0, perPage: 25});
            verifySearch(search, 'audio', done);
        });
        it('should have multiple pages of tracks for rock', function(done) {
            verifyMultipageSearch(Jamendo, 'rock', 25, 'audio', done);
        });
        it('should not have results for a nonsensical query', function(done) {
            var search = Jamendo.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25});
            Q.all([
                search.should.be.fulfilled,
                search.should.eventually.have.property('tracks'),
                search.get('tracks').should.eventually.have.length(0)
            ]).should.notify(done);
        });
    });
});

describe('SoundCloud API track search', function() {
    before(testutils.db.clean());

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
        it('should have tracks for deadmau5', function(done) {
            var search = SoundCloud.search({query: 'deadmau5', page: 0, perPage: 25});
            verifySearch(search, 'audio', done);
        });
        it('should have multiple pages of tracks for deadmau5', function(done) {
            verifyMultipageSearch(SoundCloud, 'deadmau5', 25, 'audio', done);
        });
        it('should not have results for a nonsensical query', function(done) {
            var search = SoundCloud.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25});
            Q.all([
                search.should.be.fulfilled,
                search.should.eventually.have.property('tracks'),
                search.get('tracks').should.eventually.have.length(0)
            ]).should.notify(done);
        });
    });
});

describe('YouTube API video search', function() {
    before(testutils.db.clean());
    
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
        it('should have tracks for kate bush', function(done) {
            var search = YouTube.search({query: 'kate bush', page: 0, perPage: 25});
            verifySearch(search, 'video', done);
        });
        it('should have multiple pages of tracks for kate bush', function(done) {
            verifyMultipageSearch(YouTube, 'kate bush', 25, 'video', done);
        });
        it('should not have results for a nonsensical query', function(done) {
            var search = YouTube.search({query: '12341234adfadfasdf2344134', page: 1, perPage: 25});
            Q.all([
                search.should.be.fulfilled,
                search.should.eventually.have.property('tracks'),
                search.get('tracks').should.eventually.have.length(0)
            ]).should.notify(done);
        });
    });
});