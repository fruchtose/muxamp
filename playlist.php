<?php require_once 'slogans.php'; ?>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Unified Playlist</title>
        <script src="js/swfobject.js" type="text/javascript"></script>
        <script src="js/jquery-1.7.1.min.js" type="text/javascript"></script>
        <script src="js/jquery.ajaxmanager.js" type="text/javascript"></script>
        <script src="js/jquery-ui-1.8.16.custom.min.js" type="text/javascript"></script>
        <script src="js/jquery.layout-latest.min.js" type="text/javascript"></script>
        <script src="js/jQuery.tubeplayer.js" type="text/javascript"></script>
        <script src="js/jquery.blockUI.js" type="text/javascript"></script>
        <script src="js/jquery.draginside.js" type="text/javascript"></script>
        <script src="js/soundmanager2-nodebug-jsmin.js" type="text/javascript"></script>
        <script src="js/jsclass.js" type="text/javascript"></script>
        <script src="js/config.js" type="text/javascript"></script>
        <script src="js/player.js" type="text/javascript"></script>
        <script src="js/playlist.js" type="text/javascript"></script>
        <script src="js/router.js" type="text/javascript"></script>
        <script src="js/ui.js" type="text/javascript"></script>
        <script src="js/input.js" type="text/javascript"></script>
        <style type="text/css">
            html {font-family: Verdana, Tahoma, Helvetica, Arial;
                  font-size: 13px;
            }
            body {
                margin-left: 0;
                overflow: auto;
                overflow-y: hidden;
                -ms-overflow-y: hidden;
            }
            img {
                float: left;
            }
            li {
                margin: 0px;
                white-space: pre-line;
            }
            ol, ul {
                list-style: none;
                margin: 0px;
                padding: 0px;
            }
            a {
                color: #666622;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            .left {
                position: absolute;
                left: 0px;
                text-align: left;
            }
            .right {
                position: absolute;
                right: 0px;
                text-align: right;
            }
            #wrapper {
                top: 0;
            }
            #player-header {
                border-bottom: solid #aaa 1px;
                padding-left: 52px;
            }
            #player-header, #footer-content, #video {
                background-color: #EEE;
                color: #2E2E2E;
            }
            #player-header a, #footer a, #video a {
                color: #775739;
                font-weight: bold;
            }
            .rows {
                float: left;
            }
            .player-row {
                height: 30px;
                line-height: 30px;
            }
            #playlist-info {
                float: left;
                width: 210px;
            }
            #track-count-wrapper {
                float: left;
                margin-right: 1em;
            }
            #playlist-duration-wrapper {
                float: left;
            }
            #adder {
                float: left;
                z-index: 10;
            }
            #adder-link {
                border: solid #888 1px;
                float: left;
                display: block;
                margin-left: 0;
                margin-right: 0;
                margin-top: 5px;
            }
            #adder-button-container  {
                float: left;
                display: block;
            }
            #adder-button-container img {
                margin-top: 5px;
                vertical-align: middle;
                z-index: 14;
            }
            #adder-button {
                margin-left: -133px;
                z-index: 15;
            }
            #adder-button:active {
                color: #99795b;
            }
            #controls {
                float: left;
                z-index: 12;
            }
            #controls a {
                background-image: url("img/controls.png");
                float: left;
                display: block;
                height: 20px;
                margin-left: 0;
                margin-right: 0;
                margin-top: 6px;
                padding-left: 0;
                padding-right: 0;
                width: 40px;
            }
            #previous {
                background-position: 0px 0px;
            }
            #previous:active {
                background-position: 0px 20px;
            }
            #play {
                background-position: -40px 0px;
            }
            #play:active {
                background-position: -40px 20px;
            }
            #play.playstate {
                background-position: -80px 0px;
            }
            #play.playstate:active {
                background-position: -80px 20px;
            }
            #stop {
                background-position: -120px 0px;
            }
            #stop:active {
                background-position: -120px 20px;
            }
            #next {
                background-position: -160px 0px;
            }
            #next:active {
                background-position: -160px 20px;
            }
            #shuffle {
                background-position: -200px 0px;
            }
            #shuffle:active {
                background-position: -200px 20px;
            }
            #timebar {
                float: left;
                z-index: 11;
            }
            #time-elapsed {
                float: left;
                height: 50px;
                margin-left: 6px;
                margin-right: 13px;
            }
            #timebar-outer {
                -webkit-border-radius: 4px;
                -moz-border-radius: 4px;
                border-radius: 4px;
                background-color: #fff;
                border: solid #aaa 1px;
                float: left;
                height: 20px;
                margin-top: 4px;
                overflow: hidden;
                width: 346px;
            }
            #timebar-inner {
                background-color: #3d3;
                height: 20px;
                min-width: 0;
                width: 0;
            }
            #volume {
                float: left;
                margin-left: 2em;
            }
            #volume-outer {
                -webkit-border-radius: 4px;
                -moz-border-radius: 4px;
                border-radius: 4px;
                border: solid #aaa 1px;
                -khtml-user-select: none;
                -moz-user-select: none;
                background-color: #d33;
                float: left;
                height: 50px;
                margin-top: 5px;
                overflow: hidden;
                user-select: none;
                width: 20px;
            }
            #volume-inner {
                background-color: #fff;
                bottom: 0;
                height: 50%;
                min-height: 0;
                width: 20px;
            }
            #volume-amount {
                float: left;
                line-height: 60px;
                margin-left: 1em;
                vertical-align: middle;
            }
            #main {
                min-width: 400px;
                overflow: auto;
            }
            #tracks li {
                padding-bottom: 0.25em;
                padding-right: 1em;
                padding-top: 0.25em;
            }
            #tracks li .desc {
                padding-left: 52px;
                vertical-align: middle;
            }
            #tracks li div.left {
                float: left;
                width: 48px;
                text-align: center;
                vertical-align: middle;
                z-index: 9;
            }
            #tracks li div.right {
                padding-right: 1em;
                width: 171px;
                z-index: 9;
            }
            #tracks a {
                font-weight: bold;
                padding-right: 0;
            }
            #tracks .desc a {
                padding-right: 0.5em;
            }
            #tracks .right a {
                padding-left: 1em;
            }
            #tracks li .remove {
                float: left;
                text-align: center;
                width: 22px;
            }
            #tracks li .link {
                float: left;
                height: 16px;
                margin: 0 auto;
                text-align: center;
                width: 26px;
            }
            #tracks li .link img {
                margin-left: 5px;
            }
            #tracks li.playing {
                border: solid #111 1px;
                background-color: #333;
                color: #ddd;
            }
            #tracks li.playing a {
                color: #eeeecc;
                text-decoration: none;
            }
            #tracks li.playing a:hover {text-decoration: underline; }
            #video {
                background-image: url("img/bg-right.png");
                height: 257px;
                position: absolute;
                right: 0px;
                text-align: right;
                width: 400px;
                z-index: 15;
            }
            #footer-content {
                -webkit-border-top-left-radius: 4px;
                -moz-border-radius-topleft: 4px;
                border-top-left-radius: 4px;
                border: solid #aaa 1px;
                border-bottom-width: 0;
                border-right-width: 0;
                line-height: 20px;
                min-height: 20px;
                padding: 5px;
                text-align: center;
            }
            span.slogan {
                font-style: italic;
                z-index: inherit; 
            }
        </style>
        <script type="text/javascript">

            var _gaq = _gaq || [];
            _gaq.push(['_setAccount', 'UA-27456281-1']);
            _gaq.push(['_trackPageview']);

            (function() {
                var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
            })();

        </script>
    </head>
    <body>
        <div id="wrapper">
            <div id="player-header">
                <div class="rows">
                    <div class="player-row">
                        <div id="playlist-info">
                            <div id="track-count-wrapper">
                                Tracks: <span id="track-count">0</span>
                            </div>
                            <div id="playlist-duration-wrapper">
                                Duration: <span id="playlist-duration">0:00</span>
                            </div>
                        </div>
                    </div>
                    <div class="player-row">
                        <div id ="controls">
                            <a href onclick="return false;" id="previous"></a>
                            <a href onclick="return false;" id="play"></a>
                            <a href onclick="return false;" id="stop"></a>
                            <a href onclick="return false;" id="next"></a>
                            <a href onclick="return false;" id="shuffle"></a>
                        </div>
                    </div>
                </div>
                <div class="rows">
                    <div class="player-row"></div>
                    <div class="player-row">
                        <div id="time-elapsed">0:00</div>
                    </div>
                </div>
                <div class="rows">
                    <div class="player-row">
                        <div id="adder">
                            <input type="text" id="adder-link" size="30"/>
                            <div id="adder-button-container">
                                <img src="img/addmediasource.png" />
                                <a href onclick="return false;" id="adder-button">Add Media Source</a>
                            </div>
                        </div>
                    </div>
                    <div class="player-row">
                        <div id="timebar">
                            <div id="timebar-outer">
                                <div id="timebar-inner"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="volume">
                    <div id="volume-outer">
                        <div id="volume-inner"></div>
                    </div>
                    <div id="volume-amount">50% Volume</div>
                </div>
            </div>
            <div id="main">
                <ol id="tracks">
                </ol>
            </div>
            <div id="right-side">
                <div id="video-container">
                    <div id="video"></div>
                </div>
                <div id="footer">
                    <div id="footer-content"><b>Unified Playlist</b> powered by <a href="http://www.soundcloud.com">SoundCloud</a> and <a href="http://www.youtube.com">YouTube</a>. App by <a href="mailto:rfruchtose@gmail.com">Robert Fruchtman</a>.
                        <?php
                        $slogan = get_random_db_slogan();

                        if ($slogan !== false)
                            echo "<span class=\"slogan\">$slogan</span>";
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
