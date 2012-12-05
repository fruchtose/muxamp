var MainView = Backbone.View.extend({
	initialize: function() {
		this.block = true;
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
		} else {
			if (this.block) {
				$.blockUI();
			} else {
				$.unblockUI();
			}
		}
		return this;
	},

	toggleBlock: function() {
		this.block = !this.block;
		return this.render();
	}
});

var SearchResultView = Backbone.View.extend({
	tagName: "tr",
	className: "",
	el: '#search-results tbody tr'
});