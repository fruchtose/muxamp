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
    
nconf.env().argv();

var environment = nconf.get('NODE_ENV');
switch (environment) {
    case 'development':
    case 'production':
    case 'test':
        break;
    default:
        throw new Error('NODE_ENV does not match "development", "production", or "test"');
}

var configDir = path.join(__dirname + '/../config/'),
    environmentFile = configDir + environment + '.json',
    allFile = configDir + 'all.json',
    fileRead = false;

_([allFile, environmentFile]).each(function(file) {
    if (!fs.existsSync(file)) {
        return;
    }
    if (fileRead) {
        nconf.merge(JSON.parse(fs.readFileSync(file, 'utf8')));
    } else {
        nconf.add('file', {file: file});
        fileRead = true;
    }
});
nconf.defaults({muxamp: defaults[environment]});

module.exports = nconf;