var fs = require('fs'),
	nconf = require('nconf');

var configFileLocation = __dirname + '../config.json'

var defaults = {
	app_port: 3000,
	muxamp: {
		db: {
			read: true,
			write: true
		},
		log: {
			format: 'dev'
		}
	}
};

if (fs.existsSync(configFileLocation)) {
	nconf.add('muxamp:config', {type: file, configFileLocation});
}
nconf.env()
	.argv()
	.defaults(defaults);

module.exports = nconf;