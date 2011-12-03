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

var timebar, timebarLastUpdated = new Date(), timebarNowUpdated, timeElapsed;
var updateTimebar = function(percentage) {
    if (percentage >= 0 && percentage <= 100) {
        timebarNowUpdated = new Date();
        if (timebarNowUpdated - timebarLastUpdated < 333) {
            return;
        }
        timebar.width(percentage.toFixed(2) + "%");
        timebarLastUpdated = new Date();
    }   
}

$(function() {
    timebar = $('#timebar-inner');
    timeElapsed = $('#time-elapsed');
});

$(document).ready(function() {
    var timebarOuter = $("#timebar-outer");
    timebarOuter.click(function(e) {
        var fraction = (e.pageX - this.offsetLeft) / timebarOuter.width();
       playlist.seek(fraction.toFixed(4)); 
    });
});

var secondsToString = function(duration) {
        var str = "";
        var secondsLeft = duration;
        var hours = Math.floor(secondsLeft / 3600);
        if (hours >= 1) {
            secondsLeft -= hours * 3600;
        }
        var minutes = Math.floor(secondsLeft / 60);
        if (minutes >= 1) {
            secondsLeft -= (minutes * 60);
        }
        var seconds = Math.floor(secondsLeft);
        str = (hours >= 1) ? (hours.toString() + ":") : "";
        if (minutes < 10 && hours >= 1) {
            str += "0";
        }
        str += minutes.toString() + ":";
        if (seconds < 10) {
            str += "0";
        }
        str += seconds.toString();
        return str;
    }