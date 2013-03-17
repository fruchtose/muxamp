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

var environment = process.env['NODE_ENV'];
nconf.env()
	.argv()
	.file({
		file: environment + '.json',
		dir: __dirname + '../config/'
	});

nconf.defaults({muxamp: defaults[environment]});

module.exports = nconf;