// With thanks to Christopher Coenraets
Backbone.View.prototype.close = function() {
	if (this.beforeClose) {
		this.beforeClose();
	}
	this.remove();
	this.unbind();
};

var MainView = Backbone.View.extend({
	initialize: function() {
		this.blockUI = false;
		this.subviews = [new SearchBarView(), new SearchResultsView()];
	},

	el: "body",
	render: function() {
		var rejected = false;
		if ($.browser.mobile === true) {
			$.blockUI({message: "Sorry, Muxamp currently does not support mobile browsers. :("});
			rejected = true;
		}
		else {
			$.reject({
				afterReject: function() {
					rejected = true;
				},
				browserInfo: {
					chrome: {
						text: 'Chrome 20'
					},
					firefox: {
						text: 'Firefox 13'
					},
					opera: {
						text: 'Opera 12'
					}
				},
				close: false,
				closeMessage: 'Muxamp will not function using your current browser.',
				display: ['firefox','chrome','opera'],
				header: 'You need a modern Internet browser to enjoy Muxamp.',
				imagePath: './img/',
				paragraph1: 'Get one of the browsers you see below.',
				reject: {
					chrome1: true,
					firefox1: true,
					firefox2: true,
					iphone: true,
					msie7: true,
					msie8: true,
					msie9: true,
					opera7: true,
					safari1: true,
					safari2: true,
					safari3: true
				}
				
			});
		}
		if (rejected) {
			$('#header, #wrapper, #footer, #about').html('');
		}
		_(this.subviews).each(function(subview) {
			subview.render();
		});
		return this;
	},

	toggleBlock: function() {
		this.blockUI = !this.blockUI;
		if (this.blockUI) {
			$.blockUI();
		} else {
			$.unblockUI();
		}
		return this;
	}
});

var TrackView;

(function() {
	var getAttribute = function(name, value) {
		return name + '="' + value + '"';
	};

	TrackView = Backbone.View.extend({
		initialize: function(options) {
			this.action1 = '';
			if (options.action1) {
				var action1 = options.action1;
				this.action1 = '<a class="btn action ' + action1.classes + '" href onclick="return false;"><i class="' + action1.icon + '"></i></a>';
			}
			this.action2 = '';
			if (options.action2) {
				var action2 = options.action2;
				this.action2 = '<a class="btn action ' + action2.classes + '" href onclick="return false;"><i class="' + action2.icon + '"></i></a>';
			}
			this.model = options.model || {};
		},
		render: function() {
			var actions = '<div class="actions">' + this.action1 + this.action2 + '</div>';
		    var actionsCell = '<td class="action-cell">' + actions + '</td>';
			var uploader = '<td class="uploader-cell" ' + getAttribute('title', this.model.get('uploader')) + '>' + this.model.get('uploader') + '</td>';
			var title = '<td class="title-cell" ' + getAttribute('title', this.model.get('mediaName')) + '>' + this.model.get('mediaName') + '</td>';
			var seconds = secondsToString(this.model.get('duration'));
			var duration = '<td class="duration-cell" ' + getAttribute('title', seconds) + '>' + seconds + '</td>';
			var link = '<td class="link-cell"><a href="' + this.model.get('permalink') + '"><img src="' + this.model.get('icon') + '" /></a></td>';
			var innerHtml = actionsCell + uploader + title + duration + link;
			this.$el.html(innerHtml);
			return this;
		},
		tagName: 'tr'
	});
})();

var SearchBarView = Backbone.View.extend({
	el: $("#search-form"),
	events: {
		"click #search-site-dropdown a": "selectSite",
		"submit": "search"
	},
	search: function(e) {
		e.preventDefault();
	    var query = $('#search-query').val();
	    var site = $("#search-site").val();
	    if (query) {
	        SearchResults.search(query, site);
	    }
	    return false;
	},
	selectSite: function(e) {
		var site = $(e.target).html();
	    var oldSiteCode = $("#search-site").val();
	    var siteCode = '';
	    switch(site) {
	        case "YouTube":
	            siteCode = "ytv";
	            break;
	        case "SoundCloud (Tracks)":
	            siteCode = "sct";
	            break;
	        case "URL":
	        	siteCode = "url";
	        	break;
	    }
	    $("#search-site").val(siteCode);
	    $("#site-selector").html(site + '&nbsp;<span class="caret"></span>');
	    var query = $('#search-query').val();
	    if (query && siteCode != oldSiteCode) {
	        SearchResults.search(query, siteCode);
	    }
	}
});

var a = 0;
var SearchResultsView = Backbone.View.extend({
	append: function(searchResults) {
		_.isArray(searchResults) || (searchResults = [searchResults]);
		var newRows = [];
		_(searchResults).each(function(searchResult) {
			var view = new TrackView({
				model: searchResult,
				action1: {
					classes: 'search-add-result',
					icon: 'icon-plus'
				},
				action2: {
					classes: 'search-play-result',
					icon: 'icon-play'
				}
			});
			view.render();
			newRows.push(view.$el);
		});
		var $table = $(this.table);
		$table.append.apply($table, newRows);
	},
	el: $('#search-results-pane'),
	events: {
		'click #play-all': 'play',
		'click #load-more-search-results': 'loadMore'
	},
	initialize: function() {
		this.table = "#search-results tbody";
		
		SearchResults.on('results:new', this.reset, this);
		SearchResults.on('results', this.append, this);
		SearchResults.on('results', this.show, this);
	},
	loadMore: function() {
		SearchResults.nextPage();
	},
	play: function() {
		var tracks = SearchResults.toArray();
		playlist.add(tracks);
		playlist.play();
	},
	reset: function() {
		$(this.table).html('');
	},
	show: function() {
		$("#search-nav").tab('show');
	}
});

/*var SearchResultView = Backbone.View.extend({
	className: "",
	el: '#search-results tbody tr',
	tagName: "tr",

});*/