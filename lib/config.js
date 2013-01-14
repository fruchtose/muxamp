var nconf = require('nconf')

var defaults = {
	db: {
		read: true,
		write: true
	}
};

nconf.env()
	 .argv()
	 .defaults(defaults);

module.exports = nconf;