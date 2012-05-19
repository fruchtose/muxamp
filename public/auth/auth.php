<?php
require_once '../lib/auth/openid.php';

print_r($_GET);
echo 'Lol?<br\>';
$openid = new SimpleOpenID;
$identity = $_GET['openid_identity'];
$openid->SetIdentity($identity);
$ok = $openid->ValidateWithServer();
echo $ok;
?>
