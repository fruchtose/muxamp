<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title></title>
        <script src="js/jquery-1.7.1.min.js" type="text/javascript"></script>
        <script src="js/jquery-ui-1.8.16.custom.min.js" type="text/javascript"></script>
        <script src="js/jquery.layout-latest.min.js" type="text/javascript"></script>
        <script src="js/soundmanager2-nodebug-jsmin.js" type="text/javascript"></script>
        <script src="js/jsclass.js" type="text/javascript"></script>
        <script src="js/config.js" type="text/javascript"></script>
        <script src="js/player.js" type="text/javascript"></script>
        <script src="js/playlist.js" type="text/javascript"></script>
        <script src="js/router.js" type="text/javascript"></script>
        <script src="js/ui.js" type="text/javascript"></script>
        <style type="text/css">
            html {font-family: Verdana, Tahoma, Helvetica, Arial;
                  font-size: 13px;
            }
            body {
                margin-left: 0;
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
            .player-row {
                height: 30px;
                line-height: 30px;
            }
            #controls {
                float: left;
                min-width: 225px;
                padding-right: 400px;
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
                min-width: 0px;
                width: 0;
            }
            #playlist-info {
                float: left;
                min-width: 200px;
                padding-right: 300px;
            }
            #track-count-wrapper {
                float: left;
                margin-right: 1em;
            }
            #playlist-duration-wrapper {
                float: left;
            }
            #adder {
                width: 300px;
                z-index: 10;
            }
            #main {
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
                padding-left: 1em;
                padding-right: 0;
                text-decoration: none;
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
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div id="wrapper">
            <div id="player-header">
                <div id="player-row-1" class="player-row">
                    <div id="playlist-info">
                        <div id="track-count-wrapper">
                            Tracks: <span id="track-count">0</span>
                        </div>
                        <div id="playlist-duration-wrapper">
                            Duration: <span id="playlist-duration">0:00</span>
                        </div>
                    </div>
                    <div id="adder" class="right">
                        <input type="text" id="adder-link" />
                        <a href onclick="return false;" id="adder-button">Add Media Source</a>
                    </div>
                </div>
                <div id="player-row-2" class="player-row">
                    <div id ="controls">
                        <a href onclick="return false;" id="previous">Previous</a>
                        <a href onclick="return false;" id ="play">Play</a>
                        <a href onclick="return false;" id="next">Next</a>
                        <a href onclick="return false;" id ="stop">Stop</a>
                        <a href onclick="return false;" id="shuffle">Shuffle</a>
                    </div>
                    <div id="timebar" class="right">
                        <div id="time-elapsed">0:00</div>
                        <div id="timebar-outer">
                            <div id="timebar-inner"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="main">
                <ol id="tracks">
                </ol>
            </div>
            <div id="right-side">

            </div>
            <div id="footer">Site by <a href="mailto:rfruchtose@gmail.com">Robert Fruchtman</a></div>
        </div>
    </body>
</html>
