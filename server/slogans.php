<?php

function get_random_db_slogan()
{
    $slogan = false;
    $con = mysql_connect('localhost', 'fruchtos_accessr', 'UOtS{{-{w5i8');
    if ($con)
    {
        if (mysql_select_db('fruchtos_playlist'))
        {
            $result = mysql_query("SELECT slogan FROM slogans WHERE id >= (SELECT COUNT(id)* RAND() FROM slogans) LIMIT 1;");
            if ($row = mysql_fetch_assoc($result))
            {
                $slogan = $row['slogan'];
            }
        }
        mysql_close();
    }
    return $slogan;
}

?>
