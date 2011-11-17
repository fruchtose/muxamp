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
    </head>
    <body>
        <div id ="player">
            <span id ="play">Play</span>
            <span id ="stop">Stop</span>
        </div>
        <div id="adder">
            <input type="text" id="adder-link" />
            <button type="button" id="adder-button">Add Track</button>
        </div>
        <div id="playlist">
            <table id="list">
                <tbody>
                <tr>
                    <td>Link</td><td></td>
                </tr>
                </tbody>
            </table>
        </div>
    </body>
</html>
