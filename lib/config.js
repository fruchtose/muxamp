var fs = require('fs'),
	nconf = require('nconf');

var defaults = {
	development: {
		port: process.env['app_port'] || 3000,
		db: {
			read: true,
			write: true
		},
		log: {
			format: 'dev'
		}
	},
	test: {
		port: process.env['app_port'] || 3000,
		db: {
			read: true,
			write: true
		},
		log: {
			format: 'short'
		}
	},
	production: {
		port: process.env['app_port'] || 3000,
		db: {
			read: true,
			write: true
		},
		log: {
			format: 'default'
		}
	}
};

nconf.env()
	.argv()
	.file({
		file: 'config.json',
		dir: __dirname + '../'
	});

var environment = nconf.get('NODE_ENV');
nconf.defaults(defaults[environment]);

module.exports = nconf;