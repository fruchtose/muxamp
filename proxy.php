<?php

require_once 'lib/simple_html_dom.php';

$url = $_GET['url'];

$html = new simple_html_dom();

$file = $html->load_file($url);

$sources = array();

// Retrieve the parts we care about
$iframes = $html->find('iframe');
foreach ($iframes as $iframe) {
    $sources[] = $iframe->src;
}

$embeds = $html->find("embed");
foreach ($embeds as $embed) {
    $sources[] = $embed->src;
}


echo json_encode(array("results" => $sources));
?>
