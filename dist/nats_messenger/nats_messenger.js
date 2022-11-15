'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NatsMessenger = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _nats = require('nats');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('babel-core/register');
require('babel-polyfill');


var objToHdrs = function objToHdrs(msgHeadersObj) {
    var hdrs = (0, _nats.headers)();
    if (msgHeadersObj) {
        for (var property in msgHeadersObj) {
            hdrs.append(property, msgHeadersObj[property]);
        }
    }
    return hdrs;
};

var hdrsToObj = function hdrsToObj(hdrs) {
    var obj = {};
    if (hdrs) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = hdrs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 1),
                    key = _step$value[0];

                obj[key] = hdrs.get(key);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return obj;
};

/**
 * Class representing a NATS connection and implements the Messenger interface
 */

var NatsMessenger = exports.NatsMessenger = function () {
    /**
     * Create a NatsMessenger instance
     *
     * @param {String} uri - The URI of the NATS server
     * @param {Object} logger - The central logger of the application
     */
    function NatsMessenger(uri, logger) {
        _classCallCheck(this, NatsMessenger);

        this.uri = uri;
        this.logger = logger;
        this.natsConnection = null;
    }

    /**
     * Start the NATS adapter
     *
     * Create a connection to the NATS server using the configuration parameters
     *
     * @function
     */


    _createClass(NatsMessenger, [{
        key: 'start',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                this.logger.debug('NatsMessenger.start: Connect to \'' + this.uri + '\'');
                                _context.next = 3;
                                return (0, _nats.connect)({ debug: true, servers: this.uri });

                            case 3:
                                this.natsConnection = _context.sent;

                            case 4:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function start() {
                return _ref.apply(this, arguments);
            }

            return start;
        }()

        /**
         * Shut down the NATS adapter
         *
         * Drain the connection to the NATS server and close it.
         *
         * @function
         */

    }, {
        key: 'close',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                var err;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                // Close NATS
                                this.logger.debug('NatsMessenger.close: Drain and close NATS');
                                _context2.prev = 1;
                                _context2.next = 4;
                                return this.natsConnection.drain();

                            case 4:
                                _context2.next = 6;
                                return this.natsConnection.close();

                            case 6:
                                _context2.next = 8;
                                return this.natsConnection.closed();

                            case 8:
                                err = _context2.sent;

                                if (err) {
                                    this.logger.error('NatsMessenger.close: error in NATS closing:', err);
                                } else {
                                    this.logger.debug('NatsMessenger.close: NATS successfully closed');
                                }
                                _context2.next = 15;
                                break;

                            case 12:
                                _context2.prev = 12;
                                _context2.t0 = _context2['catch'](1);

                                this.logger.error('NatsMessenger.close: error connecting to NATS: ' + _context2.t0);

                            case 15:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[1, 12]]);
            }));

            function close() {
                return _ref2.apply(this, arguments);
            }

            return close;
        }()

        /**
         * Publish payload and header to a topic
         *
         * @arg {String} topic       - The name of the topic (subject in NATS terminology) to that the message must be published.
         * @arg {String} payload     - The payload of the message.
         * @arg {Object} msgHeaders  - A flat object (key-value pairs) that represent the headers.
         *                             Keys are the header names, and the values are the header values.
         *
         * @function
         */

    }, {
        key: 'publish',
        value: function publish(topic, payload, msgHeaders) {
            this.logger.debug('NatsMessenger.publish: topic: \'' + topic + '\' payload: \'' + payload + '\' headers: ' + JSON.stringify(msgHeaders));
            var sc = (0, _nats.StringCodec)();
            var hdrs = objToHdrs(msgHeaders);

            this.natsConnection.publish(topic, sc.encode(payload), { headers: hdrs });
        }

        /**
         * Subscribe to the `topic` subject, and calls the `callback` function with the inbound messages
         * so the messages will be processed asychronously.
         *
         * @arg {String} topic      - The subject that the subscriber will observe.
         * @arg {Function} callback - A function, that the subscriber will call, with the following parameters:
         *                            `err`, `receivedPayload`, `receivedHeaders`.
         */

    }, {
        key: 'subscribe',
        value: function subscribe(topic, _callback) {
            var _this = this;

            this.logger.debug('NatsMessenger.subscribe: subscribe to topic: \'' + topic + '\'');
            return this.natsConnection.subscribe(topic, {
                callback: function callback(err, msg) {
                    var sc = (0, _nats.StringCodec)();
                    var receivedHeaders = hdrsToObj(msg.headers);
                    var receivedPayload = sc.decode(msg.data);
                    _this.logger.debug('NatsMessenger.subscribe: callback received err: ' + err + ', msg: ' + receivedPayload + ', headers: ' + JSON.stringify(receivedHeaders));
                    _callback(err, receivedPayload, receivedHeaders);
                }
            });
        }

        /**
         * Send `payload` as a request message through the `topic` subject and expects a response until `timeout`.
         * Calls the given callback with the response.
         *
         * @arg {String} topic - The subject to which the request will be sent.
         * @arg {String} payload - The content part of the message.
         * @arg {Number} timeout - Timeout in milliseconds, until the request waits for the response.
         * @arg {Object} headers - The key-value pairs of the request headers in the form of a plain old JavaScript object.
         *
         * @return {Object} - It holds two properties:
         *                      - `payload`: The payload of the response
         *                      - `headers`: The key-value pairs of the response headers
         *
         * @function
         */

    }, {
        key: 'request',
        value: function request(topic, payload, timeout, msgHeaders, reqCb) {
            var _this2 = this;

            this.logger.debug('NatsMessenger.request.publish: topic: \'' + topic + '\', payload: \'' + payload + '\', timeout: ' + timeout + ', headers: ' + JSON.stringify(msgHeaders));
            var sc = (0, _nats.StringCodec)();
            var hdrs = objToHdrs(msgHeaders);

            return this.natsConnection.request(topic, sc.encode(payload), {
                timeout: timeout,
                headers: hdrs
            }).then(function (msg) {
                _this2.logger.debug('NatsMessenger.request.reqCb: msg: ' + msg);
                reqCb(null, sc.decode(msg.data), hdrsToObj(msg.headers));
            }).catch(function (err) {
                _this2.logger.error('NatsMessenger.request.reqCb: err: ' + err);
                reqCb(err, null, null);
            });
        }

        /**
         * Setup response handler
         *
         * Subscribes to the `topic` subject, and waits for incoming request messages.
         * When message arrives, calls the `respCb` with the incoming message
         * and headers and publish its return value and headers to the response subject defined by the incoming message.
         *
         * @arg {String} topic      - The name of the subject to wait for the request messages
         * @arg {Function} respCb   - The response callback with arguments of `err`, `requestPayload` and `requestHeaders`.
         *
         * @return {Object} - The subscription object
         *
         * @function
         */

    }, {
        key: 'response',
        value: function response(topic, respCb) {
            var _this3 = this;

            this.logger.debug('NatsMessenger.response: assign to topic: \'' + topic + '\' callback: ' + respCb);
            return this.natsConnection.subscribe(topic, {
                callback: function () {
                    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(err, msg) {
                        var sc, requestPayload, _respCb, _respCb$payload, payload, _respCb$headers, headers, hdrs;

                        return regeneratorRuntime.wrap(function _callee3$(_context3) {
                            while (1) {
                                switch (_context3.prev = _context3.next) {
                                    case 0:
                                        sc = (0, _nats.StringCodec)();
                                        requestPayload = sc.decode(msg.data);

                                        _this3.logger.debug('NatsMessenger.response.callback: received err: ' + err + ', msg: \'' + requestPayload + '\', headers: ' + JSON.stringify(hdrsToObj(msg.headers)));
                                        _this3.logger.debug('NatsMessenger.response.respCb: call with err: ' + err + ', payload: \'' + requestPayload + '\', headers: ' + JSON.stringify(hdrsToObj(msg.headers)));
                                        _respCb = respCb(err, requestPayload, hdrsToObj(msg.headers)), _respCb$payload = _respCb.payload, payload = _respCb$payload === undefined ? '' : _respCb$payload, _respCb$headers = _respCb.headers, headers = _respCb$headers === undefined ? {} : _respCb$headers;

                                        _this3.logger.debug('NatsMessenger.response.respCb: respond with: payload: \'' + payload + '\', headers: ' + JSON.stringify(headers));
                                        hdrs = objToHdrs(headers);
                                        _context3.next = 9;
                                        return msg.respond(sc.encode(payload), { headers: hdrs });

                                    case 9:
                                    case 'end':
                                        return _context3.stop();
                                }
                            }
                        }, _callee3, _this3);
                    }));

                    function callback(_x, _x2) {
                        return _ref3.apply(this, arguments);
                    }

                    return callback;
                }()
            });
        }

        /**
         * Drain the connection to NATS
         *
         * @function
         */

    }, {
        key: 'drain',
        value: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                this.logger.debug('NatsMessenger.drain:');
                                _context4.next = 3;
                                return this.natsConnection.drain();

                            case 3:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function drain() {
                return _ref4.apply(this, arguments);
            }

            return drain;
        }()

        /**
         * Flushes the pending messages with NATS
         *
         * @function
         */

    }, {
        key: 'flush',
        value: function () {
            var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                this.logger.debug('NatsMessenger.flush:');
                                _context5.next = 3;
                                return this.natsConnection.flush();

                            case 3:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function flush() {
                return _ref5.apply(this, arguments);
            }

            return flush;
        }()
    }]);

    return NatsMessenger;
}();