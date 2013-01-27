var nconf = require('nconf')

var defaults = {
	app_port: 3000,
	muxamp: {
		db: {
			read: true,
			write: true
		},
	}
};

nconf.env()
	 .argv()
	 .defaults(defaults);

module.exports = nconf;