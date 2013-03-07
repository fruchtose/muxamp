describe('Opening Muxamp', function() {
	it('should load SoundCloud', function(done) {
		soundManager.should.not.be.null;
		soundManager.onready(function() {
            assert.ok(true, "SoundManager 2 loaded.");
            done();
        });
	});
});