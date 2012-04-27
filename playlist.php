<?php require_once 'slogans.php'; ?>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Muxamp</title>
        <link rel="stylesheet" type="text/css" href="css/bootstrap.css" />
        <link rel="stylesheet" type="text/css" href="css/playlist.css" />
        <link rel="icon" type="image/png" href="img/favicon.ico" />
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
            <div id="main">
                <div id="playlist-view">
                    <ol id="tracks"></ol>
                </div>
            </div>
            <div id="right-side">
                <div id="video-container">
                    <div id="video"></div>
                </div>
                <div id="side-content">
                    <div class="rows">
                        <div id="timebar-row" class="player-row">
                            <div id="timebar">
                                <div id="timebar-outer">
                                    <div id="timebar-inner"></div>
                                </div>
                            </div>
                            <div id="time-elapsed">0:00</div>
                        </div>
                        <div class="player-row2">
                            <div id="playlist-info">
                                <div class="player-row">
                                    <div id="track-count-wrapper">
                                        Tracks: <span id="track-count">0</span>
                                    </div>
                                    <div id="playlist-duration-wrapper">
                                        Duration: <span id="playlist-duration">0:00</span>
                                    </div>
                                </div>
                                <div class="player-row">
                                    <div id="controls" class="btn-group">
                                        <a href onclick="return false;" id="previous" class="btn"><i class="icon-step-backward"></i></a>
                                        <a href onclick="return false;" id="play" class="btn"><i class="icon-play"></i></a>
                                        <a href onclick="return false;" id="stop" class="btn"><i class="icon-stop"></i></a>
                                        <a href onclick="return false;" id="next" class="btn"><i class="icon-step-forward"></i></a>
                                        <a href onclick="return false;" id="shuffle" class="btn"><i class="icon-random"></i></a>
                                    </div>
                                </div>
                            </div>
                            <div id="volume">
                                <div id="volume-outer">
                                    <div id="volume-inner"></div>
                                </div>
                                <div id="volume-amount"><i id="volume-symbol" class="icon-volume-up"></i><span id="volume-number">50</span></div>
                            </div>
                        </div>
                        <div class="player-row">
                            <form id="adder-form" class="form-inline" method="post">
                                <div id="adder" class="input-append">
                                    <input type="text" id="adder-link" />
                                    <input type="submit" class="btn" id="adder-button" type="button" value="Add Media Source" />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div id="footer">
                    <div id="footer-content"><a id="about-button" href onclick="return false;">About</a> <b>Muxamp</b>. <noscript>This playlist is written entirely in JavaScript, so if you don't enable it you won't see anything!</noscript>
                        <?php
                        $slogan = get_random_db_slogan();

                        if ($slogan !== false)
                            echo "<span class=\"slogan\">$slogan</span>";
                        ?>
                    </div>
                </div>
            </div>
        </div>
        <div id="about" class="modal hide">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3>About</h3>
            </div>
            <div class="modal-body">
                <p><b>Muxamp</b> is a unified playlist that lets you play media from SoundCloud and YouTube in the same playlist. The site is powered by <a href="http://www.reddit.com">Reddit</a>, <a href="http://www.soundcloud.com">SoundCloud</a> and <a href="http://www.youtube.com">YouTube</a>. Code is done by Robert Fruchtman.</p>
                
                <p>Muxamp wants to get out of your way. To use it, copy links into the the textbox next to the "Add Media Source" button. Here are the kinds of links you can add:</p>
                
                <ol>
                    <li>Reddit subreddits (to fetch media links from other sites)</li> 
                    <li>SoundCloud tracks</li>
                    <li>SoundCloud sets</li>
                    <li>YouTube videos</li>
                </ol>
                
                <p><b>Double-click</b> tracks to play. <b>Drag and drop</b> tracks to move them.</p>
                
                <p><b>Copy and paste</b> the URL to share your playlist. This site won't track you!</p>
            </div>
        </div>
        <script src="js/swfobject.js" type="text/javascript"></script>
        <script src="js/jquery-1.7.1.min.js" type="text/javascript"></script>
        <script src="js/jquery.ajaxmanager.js" type="text/javascript"></script>
        <script src="js/jquery.batchajax.js" type="text/javascript"></script>
        <script src="js/jquery-ui-1.8.16.custom.min.js" type="text/javascript"></script>
        <script src="js/jquery.layout-latest.min.js" type="text/javascript"></script>
        <script src="js/jQuery.tubeplayer.js" type="text/javascript"></script>
        <script src="js/jquery.blockUI.js" type="text/javascript"></script>
        <script src="js/bootstrap.min.js" type="text/javascript"></script>
        <script src="js/soundmanager2-nodebug-jsmin.js" type="text/javascript"></script>
        <script src="js/jsclass.js" type="text/javascript"></script>
        <script src="js/config.js" type="text/javascript"></script>
        <script src="js/player.js" type="text/javascript"></script>
        <script src="js/playlist.js" type="text/javascript"></script>
        <script src="js/router.js" type="text/javascript"></script>
        <script src="js/ui.js" type="text/javascript"></script>
        <script src="js/input.js" type="text/javascript"></script>
    </body>
</html>
