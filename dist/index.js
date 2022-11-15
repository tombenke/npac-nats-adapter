#!/usr/bin/env node

/*jshint node: true */
'use strict';

var _nats_messenger = require('./nats_messenger/nats_messenger');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-core/register');
require('babel-polyfill');
//import { connect, StringCodec, headers } from 'nats'


/**
 * The startup function of the nats adapter
 *
 * This function should be registered with the startup phase, then npac will call when the project is starting.
 *
 * @arg {Object} container  - The actual state of the container this adapter will be added
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the nats adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
var startup = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(container, next) {
        var config, messenger;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // Merges the defaults with the config coming from the outer world
                        config = _lodash2.default.merge({}, _config2.default, { nats: container.config.nats || {} });

                        container.logger.info('nats: Start up');
                        messenger = new _nats_messenger.NatsMessenger(config.nats.uri, container.logger);
                        _context.next = 5;
                        return messenger.start();

                    case 5:

                        next(null, {
                            config: config,
                            nats: {
                                messenger: messenger,

                                flush: messenger.flush.bind(messenger),
                                publish: messenger.publish.bind(messenger),
                                subscribe: messenger.subscribe.bind(messenger),
                                request: messenger.request.bind(messenger),
                                response: messenger.response.bind(messenger)
                            }
                        });

                    case 6:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function startup(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * The shutdown function of the nats adapter
 *
 * This function should be registered with the shutdown phase, then npac will call when graceful shutdown happens.
 *
 * @arg {Object} container  - The actual state of the container this adapter is running
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the nats adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
var shutdown = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(container, next) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        container.logger.info('nats: Shutting down');

                        // Drain and close the NATS connection
                        _context2.next = 3;
                        return container.nats.messenger.close();

                    case 3:
                        next(null, null);

                    case 4:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function shutdown(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
}();

module.exports = {
    defaults: _config2.default,
    startup: startup,
    shutdown: shutdown
};