"use strict";

var _expect = _interopRequireDefault(require("expect"));
var _sinon = _interopRequireDefault(require("sinon"));
var _nats_messenger = require("./nats_messenger");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
describe('NatsMessenger', () => {
  let sandbox = _sinon.default;
  beforeEach(done => {
    done();
  });
  afterEach(done => {
    sandbox.restore();
    done();
  });
  const testConnectOpts = {
    servers: ['nats://localhost:4222'],
    debug: true
  };
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
  it('#constructor', async () => {
    const messenger = new _nats_messenger.NatsMessenger(testConnectOpts, console);
    (0, _expect.default)(messenger).not.toEqual(null);
  });
  it('#start, stop', async () => {
    const messenger = new _nats_messenger.NatsMessenger(testConnectOpts, console);
    await messenger.start();
    await messenger.close();
  });
  it('#publish, #subscribe', async () => {
    // Create and start NATS Messenger
    const messenger = new _nats_messenger.NatsMessenger(testConnectOpts, console);
    await messenger.start();

    // Setup a subscriber to receive and check the test message
    const subRes = new Promise((resolve, reject) => {
      const sub = messenger.subscribe(topic, (err, payload, headers) => {
        console.log(`test: subscribe.callback: payload: ${payload}, headers: ${JSON.stringify(headers)}`);
        const receivedPayload = JSON.parse(payload);
        (0, _expect.default)(err).toEqual(null);
        (0, _expect.default)(testPayload).toEqual(receivedPayload);
        (0, _expect.default)(testHeaders).toEqual(headers);
        resolve(null);
      });
      console.log(`test: subscribed to ${sub}`);
    });

    // Publish a test message
    console.log(`test: publish...`);
    messenger.publish(topic, JSON.stringify(testPayload), testHeaders);

    // Wait for the subscrition callback
    await subRes;

    // Drain and shut down the NATS Messenger
    await messenger.close();
  });
  it('#request, #response', async function () {
    // Create and start NATS Messenger
    const messenger = new _nats_messenger.NatsMessenger(testConnectOpts, console);
    await messenger.start();

    // Setup the responder to receive and check the test message and reply to the request
    console.log(`test: Setup response`);
    messenger.response(topic, (err, payload, headers) => {
      console.log(`response callback is called with ${payload} headers: ${JSON.stringify(headers)} and respond with ${payload}`);
      const receivedPayload = JSON.parse(payload);
      (0, _expect.default)(err).toEqual(null);
      (0, _expect.default)(testPayload).toEqual(receivedPayload);
      (0, _expect.default)(testHeaders).toEqual(headers);
      return {
        payload: payload,
        headers: headers
      };
    });
    console.log(`Send request`);
    const reqRes = new Promise((resolve, reject) => {
      messenger.request(topic, JSON.stringify(testPayload), 2000, testHeaders, (err, payload, headers) => {
        console.log(`test.request.callback: err: ${err}, payload: ${payload} headers: ${JSON.stringify(headers)}`);
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
    await reqRes;
    await messenger.close();
  });
});