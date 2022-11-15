/**
 * The default configuration for the nats adapter
 */
module.exports = {
    nats: {
        uri: process.env.NATS_URI || 'nats://localhost:4222'
    }
}
