"use strict";

var _chai = require("chai");
var _sinon = _interopRequireDefault(require("sinon"));
var _npac = require("npac");
var _config = _interopRequireDefault(require("./config"));
var nats = _interopRequireWildcard(require("./index"));
var _ = _interopRequireWildcard(require("lodash"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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
        (0, _chai.expect)(err).to.be.null;
        (0, _chai.expect)(testPayload).to.eql(receivedPayload);
        (0, _chai.expect)(testHeaders).to.eql(headers);
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
        (0, _chai.expect)(err).to.be.null;
        (0, _chai.expect)(receivedPayload).to.eql(testPayload);
        (0, _chai.expect)(requestHeaders).to.eql(testHeaders);
        return {
          payload: requestPayload,
          headers: requestHeaders
        };
      });
      container.nats.request(topic, JSON.stringify(testPayload), 1000, testHeaders, (err, responsePayload, responseHeaders) => {
        const receivedPayload = JSON.parse(responsePayload);
        container.logger.info(`reqCb received err: ${err}, payload: ${JSON.stringify(receivedPayload)}, headers: ${JSON.stringify(responseHeaders)}`);
        (0, _chai.expect)(receivedPayload).to.eql(testPayload);
        (0, _chai.expect)(err).to.eql(null);
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