function SearchProvider(name) {
    this.name = name ? name : "default";
    this.ajaxManager = $.manageAjax.create('search_' + this.name, {
        abortOld: true
    });
    this.result = '';
    
    this.search = function(queryString, offset) {
        if (!offset) {
            offset = 1;
        }
        var searchProvider = this;
        this.searchYouTube(queryString, offset);
        var interval = window.setInterval(function() {
            searchProvider.ajaxManager.clearTimeouts();
            if (!searchProvider.ajaxManager.size()) {
                window.clearInterval(interval);
                $('#search-results-list').html(searchProvider.result);
            }
        }, 100);
    };
    
    this.searchYouTube = function(queryString, offset) { 
        var searchProvider = this;
        var url = 'https://gdata.youtube.com/feeds/api/videos?q=' + queryString + '&v=2&start-index=' + offset + '&alt=jsonc';
        var options = {
            dataType: 'jsonp',
            success: function(response) {
                var htmlList = [];
                if (response.data) {
                    for (i in response.data.items) {
                            htmlList.push('<li>', response.data.items[i].title, '</li>');
                        }
                }
                searchProvider.result = htmlList.join('');
            },
            timeout: 10000,
            url: url
        };
        this.ajaxManager.add(options);
    };
}
var searchProvider = new SearchProvider();