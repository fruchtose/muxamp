function checkBrowser() {return false;}
mocha.setup({
    ignoreLeaks: true,
    timeout: 20000
});
mocha.ui('bdd'); 
mocha.reporter('html');
var expect = chai.expect;
var should = chai.should();
var assert = chai.assert;
$(document).ready(function() {
    if (window.location.search  != '?test') {
        return;
    }
    $('#video-container').css('top', '120px');
    $('#tab-list').append('<li id="test-tab"><a href="#mocha" data-toggle="tab">Tests</a></li>');
    $('.tab-content').find('.active').removeClass('active');
    $('.tab-content').append('<div class="tab-pane active" id="mocha"></div>');
    $('#test-tab a').tab('show');
    if (window.mochaPhantomJS) { 
        mochaPhantomJS.run(); 
    } else { 
        mocha.run(); 
    }
});