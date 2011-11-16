$('#adder-button').live('click', function(){
    var value = $('#adder-link').val();
    router.addTracks(value);
});

$('#play').live('click', function() {
    if (playlist.isPlaying()) {
            
    }
    else {
        playlist.play();
    }
});

$('#stop').live('click', function() {
    playlist.stop();
});