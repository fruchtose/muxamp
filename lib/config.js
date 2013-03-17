var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    nconf = require('nconf');

var defaults = {
    development: {
        port: process.env['app_port'] || process.env['VCAP_APP_PORT'] || 3000,
        db: {
            read: true,
            write: true
        },
        log: {
            format: 'dev'
        }
    },
    test: {
        port: process.env['app_port'] || process.env['VCAP_APP_PORT']  || 3000,
        db: {
            read: true,
            write: true
        },
        log: {
            format: 'short'
        }
    },
    production: {
        port: process.env['app_port'] || process.env['VCAP_APP_PORT']  || 3000,
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

var settings = {};
    
nconf.env().argv();

if (fs.existsSync(environmentFile)){
    nconf.file(environmentFile);
    settings = nconf.get('muxamp:db');
}
if (fs.existsSync(allFile)) {
    nconf.file(allFile);
    settings = _.extend({}, settings, nconf.get('muxamp:db'));
}

settings = _.extend({}, settings, (defaults[environment]['db'] || {}), nconf.get('muxamp:db'));

nconf.defaults({muxamp: defaults[environment]});
nconf.set('muxamp:db', settings);

switch (environment) {
    case 'development':
    case 'production':
    case 'test':
        break;
    default:
        console.log('WARNING:',
            'NODE_ENV does not match "development", "production", or "test".', 
            'Configuration problems may occur.');
}

module.exports = nconf;