"use strict";

var _chai = require("chai");
var _config = _interopRequireDefault(require("./config"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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
    (0, _chai.expect)(defaults).to.eql(expected);
    done();
  });
});