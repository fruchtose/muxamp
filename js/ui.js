var body;
var bodyLayoutOptions = {
        center: {
            paneSelector: "#main"
            
        },
        north: {
            paneSelector: "#player-wrapper",
            size: 40
        },
        south: {
            paneSelector: "#footer",
            size: 20
        }
    };

$(document).ready(function() {
    body = $('body').layout(bodyLayoutOptions);
});



$('#previous').live('click', function() {
    playlist.previousTrack();
});

$('#play').live('click', function() {
    if (playlist.isPlaying()) {
        playlist.togglePause();
    }
    else {
        playlist.play();
    }
});

$('#next').live('click', function() {
    playlist.nextTrack();
});

$('#stop').live('click', function() {
    playlist.stop();
});

$('#shuffle').live('click', function() {
    playlist.shuffle();
});

$('#adder-button').live('click', function(){
    var value = $('#adder-link').val();
    router.addTracks(value);
    $('#adder-link').val("");
});