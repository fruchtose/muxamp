var request   = require('request'),
    should    = require('chai').should(),
    muxamp    = require('../lib/server').getApplication(),
    testutils = require('../lib/testutils'),
    playlist  = require('../lib/playlist');

describe('POST', function() {
    var baseUrl = 'http://localhost:' + 3000 + '/playlists/save';
    function getParameters(body) {
        return {
            url: baseUrl,
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json', 
                'Content-Length': body.length
            }
        };
    }
    context = {};
    before(testutils.hooks.server.before(context));

    describe('playlist saving endpoint', function() {
        describe('should be okay', function() {
            it('when no tracks are passed in the request body', function(done) {
                request.post({url: baseUrl}, function(err, response, body) {
                    response.statusCode.should.eql(205);
                    done();
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
        });
    });

    after(testutils.hooks.server.after(context));
});