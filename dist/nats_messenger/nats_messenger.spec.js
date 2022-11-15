'use strict';

var _chai = require('chai');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _nats_messenger = require('./nats_messenger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('NatsMessenger', function () {
    var sandbox = _sinon2.default;

    beforeEach(function (done) {
        done();
    });

    afterEach(function (done) {
        sandbox.restore();
        done();
    });

    var testPayload = { note: 'text...', number: 42, floatValue: 42.24 };
    var topic = 'test-topic';
    var testHeaders = {
        'content-type': 'application/json',
        'message-type': 'TestMsgType',
        'content-encoding': 'utf8'
    };

    it('#constructor', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var messenger;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        messenger = new _nats_messenger.NatsMessenger('nats://localhost:4222', console);

                        (0, _chai.expect)(messenger).to.not.eql(null);

                    case 2:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    })));

    it('#start, stop', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var messenger;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        messenger = new _nats_messenger.NatsMessenger('nats://localhost:4222', console);
                        _context2.next = 3;
                        return messenger.start();

                    case 3:
                        _context2.next = 5;
                        return messenger.close();

                    case 5:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    })));

    it('#publish, #subscribe', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var messenger, subRes;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        // Create and start NATS Messenger
                        messenger = new _nats_messenger.NatsMessenger('nats://localhost:4222', console);
                        _context3.next = 3;
                        return messenger.start();

                    case 3:

                        // Setup a subscriber to receive and check the test message
                        subRes = new Promise(function (resolve, reject) {
                            var sub = messenger.subscribe(topic, function (err, payload, headers) {
                                console.log('test: subscribe.callback: payload: ' + payload + ', headers: ' + JSON.stringify(headers));
                                var receivedPayload = JSON.parse(payload);
                                (0, _chai.expect)(err).to.be.null;
                                (0, _chai.expect)(testPayload).to.eql(receivedPayload);
                                (0, _chai.expect)(testHeaders).to.eql(headers);
                                resolve(null);
                            });
                            console.log('test: subscribed to ' + sub);
                        });

                        // Publish a test message

                        console.log('test: publish...');
                        messenger.publish(topic, JSON.stringify(testPayload), testHeaders);

                        // Wait for the subscrition callback
                        _context3.next = 8;
                        return subRes;

                    case 8:
                        _context3.next = 10;
                        return messenger.close();

                    case 10:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, undefined);
    })));

    it('#request, #response', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var messenger, reqRes;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        // Create and start NATS Messenger
                        messenger = new _nats_messenger.NatsMessenger('localhost:4222', console);
                        _context4.next = 3;
                        return messenger.start();

                    case 3:

                        // Setup the responder to receive and check the test message and reply to the request
                        console.log('test: Setup response');
                        messenger.response(topic, function (err, payload, headers) {
                            console.log('response callback is called with ' + payload + ' headers: ' + JSON.stringify(headers) + ' and respond with ' + payload);
                            var receivedPayload = JSON.parse(payload);
                            (0, _chai.expect)(err).to.be.null;
                            (0, _chai.expect)(testPayload).to.eql(receivedPayload);
                            (0, _chai.expect)(testHeaders).to.eql(headers);
                            return { payload: payload, headers: headers };
                        });

                        console.log('Send request');
                        reqRes = new Promise(function (resolve, reject) {
                            messenger.request(topic, JSON.stringify(testPayload), 2000, testHeaders, function (err, payload, headers) {
                                console.log('test.request.callback: err: ' + err + ', payload: ' + payload + ' headers: ' + JSON.stringify(headers));
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(null);
                                }
                            });
                        });
                        _context4.next = 9;
                        return reqRes;

                    case 9:
                        _context4.next = 11;
                        return messenger.close();

                    case 11:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    })));
});