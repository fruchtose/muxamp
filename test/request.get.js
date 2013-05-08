var request   = require('request'),
    should    = require('chai').should(),
    _         = require('underscore'),
    muxamp    = require('../lib/server').getApplication(),
    testutils = require('../lib/testutils'),
    playlist  = require('../lib/playlist');

describe('GET', function() {
    var baseUrl = 'http://localhost:' + 3000 + '/';
    context = {};
    before(testutils.hooks.server.before(context));

    describe('user endpoint', function() {
        before(testutils.db.cleanAndPopulate(10));
        
        describe('should return an error', function() {
            it('for an invalid playlist number', function(done) {
                request({url: baseUrl + '0'}, function(err, response, body) {
                    response.statusCode.should.eql(404);
                    done();
                });
            });
        });
        describe('should return HTML', function() {
            it('without a playlist number', function(done) {
                request({url: baseUrl}, function(err, response, body) {
                    response.statusCode.should.eql(200);
                    done();
                });
            });
            it('for a valid playlist number', function(done) {
                var number = _.random(1, 10);
                request({url: baseUrl + number.toString()}, function(err, response, body) {
                    response.statusCode.should.eql(200);
                    done();
                });
            });
        });
    });
    describe('search endpoint', function() {
        describe('error handling', function() {
            describe('should return an error', function(done) {
                it('when no parameters are passed in the request', function(done) {
                    request({url: baseUrl + 'search'}, function(err, response, body) {
                        response.statusCode.should.eql(404);
                        done();
                    });
                });
                it('when no query is passed in the request', function(done) {
                    request({url: baseUrl + 'search/ytv/0/'}, function(err, response, body) {
                        response.statusCode.should.eql(400);
                        JSON.parse(body).should.have.property('error');
                        done();
                    });
                });
                it('when an invalid page number is passed in the request', function(done) {
                    request({url: baseUrl + 'search/ytv/-1/deadmau5'}, function(err, response, body) {
                        response.statusCode.should.eql(404);
                        done();
                    });
                });
                it('when an invalid search code is passed in the request', function(done) {
                    request({url: baseUrl + 'search/---/0/deadmau5'}, function(err, response, body) {
                        response.statusCode.should.eql(400);
                        JSON.parse(body).should.have.property('error');
                        done();
                    });
                });
            });
        });
        it('should return search results as JSON', function(done) {
            request({url: baseUrl + 'search/ytv/0/deadmau5'}, function(err, response, body) {
                response.statusCode.should.eql(200);
                should.not.exist(err);
                JSON.parse(body).length.should.be.above(0);
                done();
            });
        });
    });
    describe('playlist endpoint', function() {
        before(testutils.db.cleanAndPopulate(10));

        describe('error handling', function() {
            it('should return no ID for a playlist with an impossible ID', function(done) {
                request({url: baseUrl + 'playlists/0'}, function(err, response, body) {
                    response.statusCode.should.eql(404);
                    should.not.exist(err);
                    var data = JSON.parse(body);
                    data.should.have.property('id');
                    data['id'].should.eql(false);
                    data.should.have.property('tracks');
                    data['tracks'].should.have.length(0);
                    done();
                });
            });
            it('should return no ID for a nonexistent playlist', function(done) {
                request({url: baseUrl + 'playlists/9999999999999999999'}, function(err, response, body) {
                    response.statusCode.should.eql(404);
                    should.not.exist(err);
                    var data = JSON.parse(body);
                    data.should.have.property('id');
                    data['id'].should.eql(false);
                    data.should.have.property('tracks');
                    data['tracks'].should.have.length(0);
                    done();
                });
            });
        });
        it('should return playlists as JSON', function(done) {
            var lastPlaylist = 0;
            playlist.count().then(function(count) {
                should.exist(count);
                count.should.be.above(0);
                lastPlaylist = count;
                return playlist.getPlaylist(lastPlaylist);
            }).done(function(tracks) {
                request({url: baseUrl + 'playlists/' + lastPlaylist}, function(err, response, body) {
                    response.statusCode.should.eql(200);
                    should.not.exist(err);
                    var data = JSON.parse(body);
                    data.should.have.property('id');
                    data['id'].should.eql(lastPlaylist);
                    data.should.have.property('tracks');
                    data['tracks'].should.have.length(tracks.length);
                    done();
                });
            });
        });
    });

    after(testutils.hooks.server.after(context));
});