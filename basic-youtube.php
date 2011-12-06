<script src="js/swfobject.js" type="text/javascript"></script>
<script src="js/jquery-1.7.1.min.js" type="text/javascript"></script>
<script src="js/jquery.ytchromeless.js" type="text/javascript"></script>
<html>
    <head>
        <title>YouTube Chromeless Video Player jQuery Plugin</title>
        <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
        <script src="js/swfobject.js" type="text/javascript"></script>
        <script src="js/jquery-1.7.1.min.js" type="text/javascript"></script>
        <script src="js/jQuery.tubeplayer.js" type="text/javascript"></script>
        <style type="text/css">
            .video-player { margin: 20px; width: 640px; }
            .video-controls { 
                background: #dedede; 
                height: 30px;
                margin: -4px 0 0;
                position: relative;
                width: 640px;
            }
            .status { height: 20px; left: 30px; position: absolute; top: 5px; width: 455px; }
            .bar { background: #a4a4a4; height: 10px; position: relative; top: 5px; }
            .loaded { background: #bbb; height: 10px; left: 0; position: absolute; top: 0; }
            .indicator { background: #212121; display: block; height: 10px; left: 0; position: absolute; top: 0; width: 20px; }
            .play-pause, .volume { 
                background: url(images/btn-controls.png) no-repeat ;
                display: block;
                height: 20px;
                overflow: hidden;
                position: absolute;
                text-indent: -9999px;
                top: 5px;
                width: 20px;
            }
            .play-pause { left: 5px; }
            .playing { background-position: 0 -20px; }
            .volume { background-position: 0 -60px; right: 130px; }
            .muted { background-position: 0 -40px; }
            .view-youtube { 
                color: #000;
                display: block; 
                float: right; 
                font-size: 9px; 
                line-height: 30px;
                padding: 0 5px 0 0;
                text-decoration: none;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <h1>YouTube Chromeless Video Player jQuery Plugin</h1>
        <div id="video">Video 1</div>
        <div class="video-link-1" href="http://www.youtube.com/watch?v=sxUjB3Q04rQ">Bolt Arms - Around the World</div>

        <a class="video-link" href="http://www.youtube.com/watch?v=vtw1U9VxoGE">PUMA's Sprint Your Halls Off- Week 1: GOOGLE</a>

    </body>
    <script type="text/javascript">
        $('#video').click(function() {
            $(document).ready(function() {
                $('div.video-link-1').tubeplayer();
                $('div.video-link-1').tubeplayer('play', 'sxUjB3Q04rQ');
            });
        });
            
    </script>
</html>
