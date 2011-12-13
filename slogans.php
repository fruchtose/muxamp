<?php

function get_random_slogan()
{
    $handle = fopen('txt/listoslogans.text', 'r');
    $lines = array();
    if ($handle)
    {
        while (!feof($handle))
        {
            $buffer = trim(fgets($handle, 127));
            $lines[] = $buffer;
        }
    }
    if (count($lines))
    {
        $random = rand(0, count($lines) - 1);
        return htmlspecialchars($lines[$random]);
    }
    else return false;
}
?>
