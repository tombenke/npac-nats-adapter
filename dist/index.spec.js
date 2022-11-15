'use strict';

var _chai = require('chai');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _npac = require('npac');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _index = require('./index');

var nats = _interopRequireWildcard(_index);

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('nats', function () {
    var sandbox = _sinon2.default;

    beforeEach(function (done) {
        (0, _npac.removeSignalHandlers)();
        done();
    });

    afterEach(function (done) {
        (0, _npac.removeSignalHandlers)();
        sandbox.restore();
        done();
    });

    var config = function config(clientId) {
        return _.merge({}, _config2.default, {
            logger: {
                level: 'debug'
            },
            nats: {}
            /* Add command specific config parameters */
        });
    };

    var testPayload = { note: 'text...', number: 42, floatValue: 42.24 };
    var topic = 'test-topic';
    var testHeaders = {
        'content-type': 'application/json',
        'message-type': 'TestMsgType',
        'content-encoding': 'utf8'
    };

    it('#startup, #shutdown', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var adapters = [(0, _npac.mergeConfig)(config('test-client-ss')), _npac.addLogger, nats.startup];

        var testNats = function testNats(container, next) {
            container.logger.info('Run job to test nats');
            next(null, null);
        };

        var terminators = [nats.shutdown];

        (0, _npac.npacStart)(adapters, [testNats], terminators, function (err, res) {
            if (err) {
                throw err;
            } else {
                process.kill(process.pid, 'SIGTERM');
            }
        });
    });

    it('#publish, #subscribe', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var adapters = [(0, _npac.mergeConfig)(config('test-client-pub-sub')), _npac.addLogger, nats.startup];

        var testNats = function testNats(container, next) {
            container.logger.info('Run job to test nats');
            container.nats.subscribe(topic, function (err, payload, headers) {
                var receivedPayload = JSON.parse(payload);
                (0, _chai.expect)(err).to.be.null;
                (0, _chai.expect)(testPayload).to.eql(receivedPayload);
                (0, _chai.expect)(testHeaders).to.eql(headers);
                next(null, null);
            });
            container.nats.publish(topic, JSON.stringify(testPayload), testHeaders);
        };

        var terminators = [nats.shutdown];

        (0, _npac.npacStart)(adapters, [testNats], terminators, function (err, res) {
            if (err) {
                throw err;
            } else {
                process.kill(process.pid, 'SIGTERM');
            }
        });
    });

    it('#request, #response', function (done) {
        (0, _npac.catchExitSignals)(sandbox, done);

        var adapters = [(0, _npac.mergeConfig)(config('test-client-req-res')), _npac.addLogger, nats.startup];

        var testNats = function testNats(container, next) {
            container.logger.info('test: Run job to test nats');
            var resSub = container.nats.response(topic, function (err, requestPayload, requestHeaders) {
                container.logger.info('respCb received err: ' + err + ', request: ' + requestPayload + ' headers: ' + JSON.stringify(requestHeaders));
                var receivedPayload = JSON.parse(requestPayload);
                (0, _chai.expect)(err).to.be.null;
                (0, _chai.expect)(receivedPayload).to.eql(testPayload);
                (0, _chai.expect)(requestHeaders).to.eql(testHeaders);
                return { payload: requestPayload, headers: requestHeaders };
            });

            container.nats.request(topic, JSON.stringify(testPayload), 1000, testHeaders, function (err, responsePayload, responseHeaders) {
                var receivedPayload = JSON.parse(responsePayload);
                container.logger.info('reqCb received err: ' + err + ', payload: ' + JSON.stringify(receivedPayload) + ', headers: ' + JSON.stringify(responseHeaders));
                (0, _chai.expect)(receivedPayload).to.eql(testPayload);
                (0, _chai.expect)(err).to.eql(null);
                resSub.unsubscribe();
                next(null, null);
            });
        };

        var terminators = [nats.shutdown];

        (0, _npac.npacStart)(adapters, [testNats], terminators, function (err, res) {
            if (err) {
                throw err;
            } else {
                process.kill(process.pid, 'SIGTERM');
            }
        });
    });
});