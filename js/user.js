function OpenID () {
    this.openLoginWindow = function() {
        var closeHandler = function(){
            alert("Hi");
        };
        var extensions = {
            'openid.ns.ax' : 'http://openid.net/srv/ax/1.0', 
            'openid.ax.mode' : 'fetch_request', 
            'openid.ax.type.email' : 'http://axschema.org/contact/email', 
            'openid.ax.type.first' : 'http://axschema.org/namePerson/first', 
            'openid.ax.type.last' : 'http://axschema.org/namePerson/last',
            'openid.ax.required' : 'email,first,last'
        };
        var googleOpener = popupManager.createPopupOpener(
        {
            'realm' : 'http://fruchtose.com',
            'opEndpoint' : 'https://www.google.com/accounts/o8/ud',
            'returnToUrl' : 'http://fruchtose.com/secretloltest/auth/auth.php',
            'onCloseHandler' : closeHandler,
            'shouldEncodeUrls' : true,
            'extensions' : extensions
        });
        googleOpener.popup(450, 500);
    };
}
var user;