$("#search-results tbody tr").livequery(function() {
    var row = $(this);
    row.on('dblclick', function() {
        var resultIndex = $(this).index();
        var searchResult = searchResultsView.results[resultIndex];
        var mediaObject = getMediaObject(searchResult);
        playlist.addTracks(mediaObject, playlist.currentTrack, playlist.currentTrack);
        playlist.nextTrack(true);
    });
    row.find('.search-add-result').on('click', function(){
        var resultIndex = row.index();
        var searchResult = searchResultsView.results[resultIndex];
        var mediaObject = getMediaObject(searchResult);
        playlist.addTracks(mediaObject);
    });
    row.find('.search-play-result').on('click', function() {
        var resultIndex = row.index();
        var searchResult = searchResultsView.results[resultIndex];
        var mediaObject = getMediaObject(searchResult);
        playlist.addTracks(mediaObject, playlist.currentTrack, playlist.currentTrack);
        playlist.nextTrack(true);
    });
}, function() {
    var row = $(this);
    row.off('dblclick');
    row.find('.search-add-result').off('click');
    row.find('.search-play-result').off('click');
});

$("#play-all").click(function() {
	var tracks = [];
	$.each(searchResultsView.results, function() {
		tracks.push(getMediaObject(this));
	});
	if (tracks.length > 0) {
		playlist.addTracks(tracks);
		playlist.play();
	}
});

$("#load-more-search-results").click(function() {
	if ($(searchResultsView.selector).size() > 0) {
		searchResultsPage++;
		var value = $('#search-query').val();
	    var site = $("#search-site").val();
	    if (value) {
	        searchForTracks(value, searchResultsPage, site);
	    }
    }
});

$("#clear").click(function() {
	playlist.clear();
});

$('#previous').click(function() {
    playlist.previousTrack();
});

$('#play').click(function() {
    if (playlist.isPlaying() || playlist.isPaused()) {
        playlist.togglePause();
    }
    else {
        playlist.play();
    }
});

$('#next').click(function() {
    playlist.nextTrack();
});

$('#stop').click(function() {
    playlist.stop();
});

$('#shuffle').click(function() {
    playlist.shuffle();
});

var alertError = function(title, body) {
	var header = '<h4 class="alert-heading">' + title + '</h4>'
	var body = '<span class="body">' + body + '</span>';
	var close = '<a class="close" data-dismiss="alert" href="#">&times;</a>';
	var alert = '<div class="alert alert-error">' + close + header + body + '</div>'; 
	var container = $('#alerts');
	container.append(alert);
}

var siteCodeFromSiteName = function(site) {
    var result = "";
    switch(site) {
        case "YouTube":
            result = "ytv";
            break;
        case "SoundCloud (Tracks)":
            result = "sct";
            break;
    }
    return result;
}

var searchResultsPage = 0;

var searchForTracks = function(query, page, site) {
    var searchURL =  window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'search/' +site + '/'+ page + '/' + encodeURIComponent(query);
    $.ajax({
        url: searchURL,
        dataType: 'json',
        success: function(searchResults) {
            searchResultsView.setSearchResults(searchResults);
            $("#search-nav").tab('show');
        }
    });
}

$('#search-site-dropdown a').click(function() {
	searchResultsPage = 0;
    var site = $(this).html();
    var oldSiteName = $("#search-site").val();
    var newSiteName = siteCodeFromSiteName(site);
    $("#search-site").val(newSiteName);
    $("#site-selector").html(site + '&nbsp;<span class="caret"></span>');
    var query = $('#search-query').val();
    if (query && newSiteName != oldSiteName) {
        searchForTracks(query, searchResultsPage, newSiteName);
    }
});

$('#search-form').submit(function(e){
    e.preventDefault();
    searchResultsPage = 0;
    var value = $('#search-query').val();
    var site = $("#search-site").val();
    if (value) {
        searchForTracks(value, searchResultsPage, site);
    }
    return false;
});

$(document).ready(function() {
    var volumeOuter = $("#volume-outer");
    volumeOuter.slider({
        orientation: "horizontal",
        range: "min",
        min: 0,
        max: 100,
        value: 50,
        slide: function(event, ui) {
            playlist.setVolume(ui.value);
        }
    });
});

$("#volume-symbol").click(function() {
    playlist.toggleMute();
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
    var timebarPrecisionFactor = timebarOuter.width();
    timebarOuter.slider({
        range: "min",
        value: 0,
        min: 0,
        max: timebarOuter.width() * timebarPrecisionFactor,
        slide: function(event, ui) {
            var fraction = ui.value/ timebarOuter.slider("option", "max");
            playlist.seek(fraction.toFixed(4));
        }
    });
});

var clearVideo = function() {
    $('#video').tubeplayer('destruct');
    $("#video").replaceWith('<div id="video"></id>');
}

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

var getAttribute = function(name, value) {
	return name + '="' + value + '"';
};