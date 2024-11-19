"use strict";

var _expect = _interopRequireDefault(require("expect"));
var _sinon = _interopRequireDefault(require("sinon"));
var _npac = require("npac");
var _config = _interopRequireDefault(require("./config"));
var nats = _interopRequireWildcard(require("./index"));
var _ = _interopRequireWildcard(require("lodash"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
describe('nats', () => {
  let sandbox = _sinon.default;
  beforeEach(done => {
    (0, _npac.removeSignalHandlers)();
    done();
  });
  afterEach(done => {
    (0, _npac.removeSignalHandlers)();
    sandbox.restore();
    done();
  });
  const config = clientId => _.merge({}, _config.default, {
    logger: {
      level: 'debug'
    },
    nats: {}
    /* Add command specific config parameters */
  });
  const testPayload = {
    note: 'text...',
    number: 42,
    floatValue: 42.24
  };
  const topic = 'test-topic';
  const testHeaders = {
    'content-type': 'application/json',
    'message-type': 'TestMsgType',
    'content-encoding': 'utf8'
  };
  it('#startup, #shutdown', done => {
    (0, _npac.catchExitSignals)(sandbox, done);
    const adapters = [(0, _npac.mergeConfig)(config('test-client-ss')), _npac.addLogger, nats.startup];
    const testNats = (container, next) => {
      container.logger.info(`Run job to test nats`);
      next(null, null);
    };
    const terminators = [nats.shutdown];
    (0, _npac.npacStart)(adapters, [testNats], terminators, (err, res) => {
      if (err) {
        throw err;
      } else {
        process.kill(process.pid, 'SIGTERM');
      }
    });
  });
  it('#publish, #subscribe', done => {
    (0, _npac.catchExitSignals)(sandbox, done);
    const adapters = [(0, _npac.mergeConfig)(config('test-client-pub-sub')), _npac.addLogger, nats.startup];
    const testNats = (container, next) => {
      container.logger.info(`Run job to test nats`);
      container.nats.subscribe(topic, (err, payload, headers) => {
        const receivedPayload = JSON.parse(payload);
        (0, _expect.default)(err).toEqual(null);
        (0, _expect.default)(testPayload).toEqual(receivedPayload);
        (0, _expect.default)(testHeaders).toEqual(headers);
        next(null, null);
      });
      container.nats.publish(topic, JSON.stringify(testPayload), testHeaders);
    };
    const terminators = [nats.shutdown];
    (0, _npac.npacStart)(adapters, [testNats], terminators, (err, res) => {
      if (err) {
        throw err;
      } else {
        process.kill(process.pid, 'SIGTERM');
      }
    });
  });
  it('#request, #response', done => {
    (0, _npac.catchExitSignals)(sandbox, done);
    const adapters = [(0, _npac.mergeConfig)(config('test-client-req-res')), _npac.addLogger, nats.startup];
    const testNats = (container, next) => {
      container.logger.info(`test: Run job to test nats`);
      const resSub = container.nats.response(topic, (err, requestPayload, requestHeaders) => {
        container.logger.info(`respCb received err: ${err}, request: ${requestPayload} headers: ${JSON.stringify(requestHeaders)}`);
        const receivedPayload = JSON.parse(requestPayload);
        (0, _expect.default)(err).toEqual(null);
        (0, _expect.default)(receivedPayload).toEqual(testPayload);
        (0, _expect.default)(requestHeaders).toEqual(testHeaders);
        return {
          payload: requestPayload,
          headers: requestHeaders
        };
      });
      container.nats.request(topic, JSON.stringify(testPayload), 1000, testHeaders, (err, responsePayload, responseHeaders) => {
        const receivedPayload = JSON.parse(responsePayload);
        container.logger.info(`reqCb received err: ${err}, payload: ${JSON.stringify(receivedPayload)}, headers: ${JSON.stringify(responseHeaders)}`);
        (0, _expect.default)(receivedPayload).toEqual(testPayload);
        (0, _expect.default)(err).toEqual(null);
        resSub.unsubscribe();
        next(null, null);
      });
    };
    const terminators = [nats.shutdown];
    (0, _npac.npacStart)(adapters, [testNats], terminators, (err, res) => {
      if (err) {
        throw err;
      } else {
        process.kill(process.pid, 'SIGTERM');
      }
    });
  });
});