"use strict";

var _expect = _interopRequireDefault(require("expect"));
var _config = _interopRequireDefault(require("./config"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
////import { expect } from 'chai'

before(done => {
  done();
});
after(done => {
  done();
});
describe('nats.config', () => {
  it('#defaults', done => {
    const expected = {
      nats: {
        debug: false,
        name: undefined,
        user: undefined,
        pass: undefined,
        servers: ['nats://localhost:4222']
      }
    };
    const defaults = _config.default;
    (0, _expect.default)(defaults).toEqual(expected);
    done();
  });
});