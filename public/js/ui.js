var alertError = function(title, body) {
	var header = '<h4 class="alert-heading">' + title + '</h4>'
	var body = '<span class="body">' + body + '</span>';
	var close = '<a class="close" data-dismiss="alert" href="#">&times;</a>';
	var alert = '<div class="alert alert-error">' + close + header + body + '</div>'; 
	var container = $('#alerts');
	container.append(alert);
}

$(document).ready(function() {
    var volumeOuter = $("#volume-outer");
    volumeOuter.slider({
        orientation: "horizontal",
        range: "min",
        min: 0,
        max: 100,
        value: 50,
        slide: function(event, ui) {
            Playlist.setVolume(ui.value);
        }
    });
});

$("#volume-symbol").click(function() {
    Playlist.toggleMute();
});

var secondsToString = function(duration) {
    var str = "";
    // The duration can be a decimal, but we want it to be an integer so the user 
    // doesn't end up seeing the a track is 4:20 when the track is actually 260.75 seconds long.
    // This would mean that adding this track to the playlist twice would cause the 
    // total duration to be 8:41 (260.75 + 260.75 = 521.5 seconds). To prevent this from happening, 
    // we round up. The track of 260.75 seconds is now reported to be 4:21, and 
    // the adding this track twice to the playlist would make the total duration 
    // to be 8:42, which the user would expect intuitively.
    var secondsLeft = Math.ceil(duration);
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
};

$("#about-button").click(function() {
    $("#about").modal({
        backdrop: true
    })
});