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
            #wrapper {
                top: 0;
                width: 75%;
            }
            #controls {
                background-color: #fff;
                display: inline-block;
                position: fixed;
                top: 0;
                z-index: 10;
            }
            #content {
                top: 40px;
                position: relative;
            }
            #adder {
                z-index: -1;
            }
            table tbody tr.playing td {font-weight: bold;}
            table tbody tr.playing td a {font-weight: normal;}
        </style>
    </head>
    <body>
        <div id="wrapper">
            <div id="controls">
                <a href onclick="return false;" id="previous">Previous</a>
                <a href onclick="return false;" id ="play">Play</a>
                <a href onclick="return false;" id="next">Next</a>
                <a href onclick="return false;" id ="stop">Stop</a>
                <a href onclick="return false;" id="shuffle">Shuffle</a>
            </div>
            <div id="content">
                <div id="adder">
                    <input type="text" id="adder-link" />
                    <a href onclick="return false;" id="adder-button">Add Media Source</a>
                </div>
                <div id="playlist">
                    <table id="list">
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </body>
</html>
