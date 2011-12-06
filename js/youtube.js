var loadYouTube = function(youtubeTrack) {
    //Check to see if YouTube player is already loaded
    if ($('#' + youtubeAtts.id).length == 0) {
        body.open('east');
        swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&version=3&playerapiid=player1", "video", "400", "335", "9", null, null, youtubeParams, youtubeAtts);
    }
}

var closeYouTube = function() {
    //Check to see if YouTube player is loaded
    if ($('#' + youtubeAtts.id).length) {
        $('#' + youtubeAtts.id).replaceWith('<div id="video"></div>');
        body.close('east');
    }
}