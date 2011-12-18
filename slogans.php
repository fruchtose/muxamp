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

function get_random_db_slogan()
{
    $slogan = false;
    $con = mysql_connect('localhost', 'fruchtos_accessr', 'UOtS{{-{w5i8');
    if ($con)
    {
        if (mysql_select_db('fruchtos_playlist'))
        {
            $size_results = mysql_query("SELECT COUNT(id) AS count FROM slogans LIMIT 1;");
            if ($row = mysql_fetch_assoc($size_results))
            {
                $size = $row['count'];

                $random_num = rand(0, $size - 1);
                $result = mysql_query("SELECT slogan FROM slogans WHERE id='$random_num' LIMIT 1;");
                if ($row = mysql_fetch_assoc($result))
                {
                    $slogan = $row['slogan'];
                }
            }
        }
        mysql_close();
    }
    return $slogan;
}

?>
