$('#adder-button').live('click', function(){
    var value = $('#adder-link').val();
    router.addTracks(value);
    $('#adder-link').val("");
});

$('#play').live('click', function() {
    if (!playlist.isEmpty()) {
        if (playlist.isPlaying()) {
            if (playlist.isPaused()) {
                playlist.togglePause();
                $('#play').text('Pause');
            }
            else {
                playlist.togglePause();
                $('#play').text('Play');
            }
        }
        else {
            playlist.play();
            $('#play').text('Pause');
        }
    }
/*
    if (playlist.isPlaying()) {
        playlist.togglePause();
        $('#play').text('Play');
    }
    else {
        playlist.togglePause();
        $('#play').text('Pause');
    }*/
});

$('#stop').live('click', function() {
    playlist.stop();
    $('#play').text('Play');
});