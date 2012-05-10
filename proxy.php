<?php
$url = $_GET['url'];
if (filter_var($url, FILTER_VALIDATE_URL)) {
    echo file_get_contents($url);
}
else echo '<html></html>';
?>
