var fs = require('fs'),
    path = require('path'),
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

var environment = process.env['NODE_ENV'],
    configDir = path.join(__dirname + '/../config/'),
    environmentFile = configDir + environment + '.json',
    allFile = configDir + 'all.json';
    
nconf.env().argv();

if (fs.existsSync(environmentFile)){
    nconf.file(environmentFile);
}
if (fs.existsSync(allFile)) {
    nconf.file(allFile);
}

nconf.defaults({muxamp: defaults[environment]});

module.exports = nconf;