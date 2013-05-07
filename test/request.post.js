var request   = require('request'),
    should    = require('chai').should(),
    muxamp    = require('../lib/server').getApplication(),
    testutils = require('../lib/testutils'),
    playlist  = require('../lib/playlist');

describe('POST', function() {
    var baseUrl = 'http://localhost:' + 3000 + '/playlists/save';
    function getParameters(body) {
        var str = JSON.stringify(body);
        return {
            url: baseUrl,
            body: str,
            headers: {
                'Content-Type': 'application/json', 
                'Content-Length': str.length
            }
        };
    }
    context = {};
    before(testutils.hooks.server.before(context));

    describe('playlist saving endpoint', function() {
        describe('should be okay', function() {
            it('when no tracks are passed in the request body', function(done) {
                request.post(getParameters({}), function(err, response, body) {
                    response.statusCode.should.eql(205);
                    done();
                });
            });
            describe('when the request body contains', function() {
                beforeEach(testutils.db.cleanAndPopulate(10));
                it('one track', function(done) {
                    var tracks = [{siteCode: 'ytv', siteMediaID: 'sOnqjkJTMaA'}];
                    request.post(getParameters(tracks), function(err, response, body) {
                        response.statusCode.should.eql(200);
                        done();
                    });
                });
            });
        });
        describe('should return an error message', function() {
            it('when something other than array is passed in the request body', function(done) {
                var options = getParameters({problemo: true});
                request.post(options, function(err, response, body) {
                    response.statusCode.should.eql(400);
                    done();
                });
            });
            it('when the request body contains an array of something other than tracks', function(done) {
                var options = getParameters([1, "a"]);
                request.post(options, function(err, response, body) {
                    response.statusCode.should.eql(400);
                    done();
                });
            });
        });
    });

    after(testutils.hooks.server.after(context));
});