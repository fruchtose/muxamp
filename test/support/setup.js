var chai           = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    Q              = require('q');

global.should = chai.should();
chai.use(chaiAsPromised);
global.Q = Q;