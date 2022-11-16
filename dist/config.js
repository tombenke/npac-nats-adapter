'use strict';

/**
 * The default configuration for the nats adapter
 */
module.exports = {
    nats: {
        // Sets the client name.
        // When set, the server monitoring pages will display this name when referring to this client.
        debug: process.env.NATS_DEBUG || false,
        name: process.env.NATS_NAME,
        user: process.env.NATS_USER,
        pass: process.env.NATS_PASS,
        servers: process.env.NATS_SERVERS || ['nats://localhost:4222']
    }
};