var SearchResultTableView = Backbone.View.extend({
	id: 'search-results'
	tagName: 'tbody'
});

var SearchResultView = Backbone.View.extend({
	tagName: "tr",
	className: ""
	el: '#search-results tbody tr'
});