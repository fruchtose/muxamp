<?php require_once 'slogans.php'; ?>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Robert's Unnamed Playlist App</title>
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
            li {
                margin: 0px;
                white-space: pre-line;
            }
            ol, ul {
                list-style: none;
                margin: 0px;
                padding: 0px;
            }
            .right {
                position: absolute;
                right: 0px;
                text-align: right;
            }
            #wrapper {
                top: 0;
            }
            #rows {
                float: left;
            }
            .player-row {
                height: 30px;
                line-height: 30px;
            }
            #playlist-info {
                float: left;
                min-width: 200px;
                width: 266px;
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
                width: 350px;
                z-index: 10;
            }
            #controls {
                float: left;
                min-width: 225px;
                z-index: 12;
            }
            #timebar {
                float: left;
                z-index: 11;
            }
            #time-elapsed {
                float: left;
                height: 50px;
            }
            #timebar-outer {
                border: 1px solid #333;
                float: left;
                height: 20px;
                margin-left: 1em;
                margin-top: 4px;
                overflow: hidden;
                width: 350px;
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
                -khtml-user-select: none;
                -moz-user-select: none;
                background-color: #d33;
                border: 1px solid #333;
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
            #tracks li .desc {
                padding-right: 171px;
            }
            #tracks li div.right {
                width: 171px;
                z-index: 9;
            }
            #tracks a {
                font-weight: bold;
                padding-right: 0;
                text-decoration: none;
            }
            #tracks .desc a {
                padding-left: 0.5em;
                padding-right: 0.5em;
            }
            #tracks .right a {
                padding-left: 1em;
            }
            #tracks li.playing {
                background-color: #333;
                color: #ddd;
            }
            #tracks li.playing a {
                color: #eeeecc;
                text-decoration: none;
            }
            #tracks li.playing a:hover {text-decoration: underline; }
            #footer {
                line-height: 20px;
                min-height: 20px;
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
                <div id="rows">
                    <div id="player-row-1" class="player-row">
                        <div id="playlist-info">
                            <div id="track-count-wrapper">
                                Tracks: <span id="track-count">0</span>
                            </div>
                            <div id="playlist-duration-wrapper">
                                Duration: <span id="playlist-duration">0:00</span>
                            </div>
                        </div>
                        <div id="adder">
                            <input type="text" id="adder-link" size="30"/>
                            <a href onclick="return false;" id="adder-button">Add Media Source</a>
                        </div>
                    </div>
                    <div id="player-row-2" class="player-row">
                        <div id ="controls">
                            <a href onclick="return false;" id="previous">Previous</a>
                            <a href onclick="return false;" id="play">Play</a>
                            <a href onclick="return false;" id="next">Next</a>
                            <a href onclick="return false;" id="stop">Stop</a>
                            <a href onclick="return false;" id="shuffle">Shuffle</a>
                        </div>
                        <div id="timebar">
                            <div id="time-elapsed">0:00</div>
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
                <div id="video"></div>
            </div>
            <div id="footer">Powered by <a href="http://www.soundcloud.com">SoundCloud</a> and <a href="http://www.youtube.com">YouTube</a>. App by <a href="mailto:rfruchtose@gmail.com">Robert Fruchtman</a>.
                <?php
                $slogan = get_random_db_slogan();

                if ($slogan !== false)
                    echo "<span class=\"slogan\">$slogan</span>";
                ?>
            </div>
        </div>
    </body>
</html>
