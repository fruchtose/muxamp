<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title></title>
        <script src="js/jquery-1.7.js" type="text/javascript"></script>
        <script src="js/soundmanager2.js" type="text/javascript"></script>
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
            #wrapper {
                top: 0;
                width: 75%;
            }
            #player-wrapper {
            }
            #player {
                background-color: #fff;
                display: block;
                float: left;
                height: 40px;
                line-height: 40px;
                margin: 0 auto;
                position: fixed;
                top: 0;
                vertical-align: baseline;
                width: 800px;
                z-index: 10;
            }
            #controls {
                float: left;
                display: inline-block;
            }
            #timebar {
                height: 10px;
                margin-left: 210px;
                position: relative;
                width: 200px;
            }
            #timebar-meter-unfilled {
                /*background-color: #000;*/
                height: 10px;
                margin-top: 15px;
                width: 100%;
            }
            #content {
                top: 40px;
                position: relative;
            }
            #adder {
                z-index: -1;
            }
            #tracks li .desc {
                padding-right: 171px;
            }
            #tracks li div.right {
                position: absolute;
                right: 0px;
                text-align: right;
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
        </style>
    </head>
    <body>
        <div id="wrapper">
            <div id="player-wrapper">
                <div id="player">
                    <div id ="controls">
                        <a href onclick="return false;" id="previous">Previous</a>
                        <a href onclick="return false;" id ="play">Play</a>
                        <a href onclick="return false;" id="next">Next</a>
                        <a href onclick="return false;" id ="stop">Stop</a>
                        <a href onclick="return false;" id="shuffle">Shuffle</a>
                    </div>
                    <div id="timebar">
                        <div id="timebar-meter-unfilled">
                            <div id="timebar-meter-filled">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="content">
                <div id="adder">
                    <input type="text" id="adder-link" />
                    <a href onclick="return false;" id="adder-button">Add Media Source</a>
                </div>
                <div id="playlist">
                    <ol id="tracks">
                    </ol>
                </div>
            </div>
        </div>
    </body>
</html>
