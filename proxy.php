<?php

require_once 'lib/simple_html_dom.php';

$url = $_GET['url'];

$html = new simple_html_dom();

$file = $html->load_file($url);

$sources = array();

// Retrieve the parts we care about
$links = $html->find("a");
foreach($links as $link) {
    $sources[] = $link->href;
}

$iframes = $html->find("iframe");
foreach ($iframes as $iframe) {
    $sources[] = $iframe->src;
}

$embeds = $html->find("embed");
foreach ($embeds as $embed) {
    $sources[] = $embed->src;
}

$objects = $html->find("object");
foreach ($objects as $object) {
    $sources[] = $object->data;
}


echo json_encode(array("results" => $sources));
?>
