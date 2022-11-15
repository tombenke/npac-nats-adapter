npac-nats-adapter
=================

[![Quality Check](https://github.com/tombenke/npac-nats-adapter/actions/workflows/quality_check.yml/badge.svg)](https://github.com/tombenke/npac-nats-adapter/actions/workflows/quality_check.yml)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)
[![npm version][npm-badge]][npm-url]

## About

This is an npac adapter with NATS API. This adapter provides direct nats-level functions.

The adapter can be accessed via the `nats` name, and provides the following properties:

```JavaScript
    nats: {
         publish: // The nats.publish() function
         subscribe: // The nats.subscribe() function
         request: // A NATS-level RPC-like request function
         response: // A NATS-level RPC-like response function
    }
```

See the [unit tests](src/index.spec.js) as an example for the usage of these functions.

## Installation

Run the install command:

    npm install --save npac-nats-adapter

## Configuration

This module uses the `config.nats` property to gain its configuration parameters.

The default parameters can be found in [`src/config.js`](src/config.js):

```JavaScript
{
    nats: {
        ur: process.env.NATS_URI || "nats://demo.nats.io:4222"
    }
}
```

## Get Help

To learn more about the tool visit the [homepage](http://tombenke.github.io/npac-nats-adapter/api/).

## References

- [NATS.js - A NATS client for Node.Js](https://github.com/nats-io/nats.js#readme)
- [npac](http://tombenke.github.io/npac).

---

[npm-badge]: https://badge.fury.io/js/npac-nats-adapter.svg
[npm-url]: https://badge.fury.io/js/npac-nats-adapter

