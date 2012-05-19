<?php
/*
require_once '../lib/auth/openid.php';

$googleURL = 'https://www.google.com/accounts/o8/id';
$provider = $_GET['openid_identifier'];
echo $provider;
if (strripos($url, '/', -1) !== 0)
{
    $url = substr($url, 0, strlen($url) - 1);
}

$return = dirname($_SERVER["SERVER_NAME"] . $_SERVER["REQUEST_URI"]) . '/auth.php';
if ('google' == strtolower($provider))
{
    $url = $googleURL;
    $openid = new SimpleOpenID;
    $openid->SetOpenIDServer($url);
    $openid->SetIdentity('http://specs.openid.net/auth/2.0/identifier_select');
    $openid->SetApprovedURL($return);
    $openid->SetTrustRoot('http://fruchtose.com');
    $openid->SetProtocol('http://specs.openid.net/auth/2.0');
    $openid->Redirect();
}*/

?>
<html>
    <head>
        <script type="text/javascript">
            window.location=    'https://www.google.com/accounts/o8/id' +
                                '?openid.ns=http://specs.openid.net/auth/2.0' +
                                '&openid.ns.pape=http://specs.openid.net/extensions/pape/1.0' +
                                '&openid.ns.max_auth_age=300' +
                                '&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select' +
                                '&openid.identity=http://specs.openid.net/auth/2.0/identifier_select' +
                                '&openid.return_to=http://fruchtose.com/secretloltest/auth/auth.php' +
                                '&openid.realm=http://fruchtose.com/' + 
                                '&openid.mode=checkid_setup' +
                                '&openid.ui.ns=http://specs.openid.net/extensions/ui/1.0' +
                                '&openid.ui.mode=popup' +
                                '&openid.ui.icon=true';
        </script>
    </head>
    <body>
        
    </body>
</html>

