require('babel-core/register')
require('babel-polyfill')
import { connect, StringCodec, headers } from 'nats'

const objToHdrs = (msgHeadersObj) => {
    const hdrs = headers()
    if (msgHeadersObj) {
        for (const property in msgHeadersObj) {
            hdrs.append(property, msgHeadersObj[property])
        }
    }
    return hdrs
}

const hdrsToObj = (hdrs) => {
    const obj = {}
    if (hdrs) {
        for (const [key] of hdrs) {
            obj[key] = hdrs.get(key)
        }
    }
    return obj
}

/**
 * Class representing a NATS connection and implements the Messenger interface
 */
export class NatsMessenger {
    /**
     * Create a NatsMessenger instance
     *
     * @param {Config} config - The connect configuration of the NATS server
     * @param {Object} logger - The central logger of the application
     */
    constructor(config, logger) {
        this.config = config
        this.logger = logger
        this.natsConnection = null
    }

    /**
     * Start the NATS adapter
     *
     * Create a connection to the NATS server using the configuration parameters
     *
     * @function
     */
    async start() {
        this.logger.debug(`NatsMessenger.start: Connect to NATS with opts: '${JSON.stringify(this.config)}'`)
        this.natsConnection = await connect(this.config)
    }

    /**
     * Shut down the NATS adapter
     *
     * Drain the connection to the NATS server and close it.
     *
     * @function
     */
    async close() {
        // Close NATS
        this.logger.debug('NatsMessenger.close: Drain and close NATS')
        try {
            await this.natsConnection.drain()
            await this.natsConnection.close()

            // Check if the close was OK
            const err = await this.natsConnection.closed()
            if (err) {
                this.logger.error(`NatsMessenger.close: error in NATS closing:`, err)
            } else {
                this.logger.debug('NatsMessenger.close: NATS successfully closed')
            }
        } catch (err) {
            this.logger.error(`NatsMessenger.close: error connecting to NATS: ${err}`)
        }
    }

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
    publish(topic, payload, msgHeaders) {
        this.logger.debug(
            `NatsMessenger.publish: topic: '${topic}' payload: '${payload}' headers: ${JSON.stringify(msgHeaders)}`
        )
        const sc = StringCodec()
        const hdrs = objToHdrs(msgHeaders)

        this.natsConnection.publish(topic, sc.encode(payload), { headers: hdrs })
    }

    /**
     * Subscribe to the `topic` subject, and calls the `callback` function with the inbound messages
     * so the messages will be processed asychronously.
     *
     * @arg {String} topic      - The subject that the subscriber will observe.
     * @arg {Function} callback - A function, that the subscriber will call, with the following parameters:
     *                            `err`, `receivedPayload`, `receivedHeaders`.
     */

    subscribe(topic, callback) {
        this.logger.debug(`NatsMessenger.subscribe: subscribe to topic: '${topic}'`)
        return this.natsConnection.subscribe(topic, {
            callback: (err, msg) => {
                const sc = StringCodec()
                const receivedHeaders = hdrsToObj(msg.headers)
                const receivedPayload = sc.decode(msg.data)
                this.logger.debug(
                    `NatsMessenger.subscribe: callback received err: ${err}, msg: ${receivedPayload}, headers: ${JSON.stringify(
                        receivedHeaders
                    )}`
                )
                callback(err, receivedPayload, receivedHeaders)
            }
        })
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
    request(topic, payload, timeout, msgHeaders, reqCb) {
        this.logger.debug(
            `NatsMessenger.request.publish: topic: '${topic}', payload: '${payload}', timeout: ${timeout}, headers: ${JSON.stringify(
                msgHeaders
            )}`
        )
        const sc = StringCodec()
        const hdrs = objToHdrs(msgHeaders)

        return this.natsConnection
            .request(topic, sc.encode(payload), {
                timeout: timeout,
                headers: hdrs
            })
            .then((msg) => {
                const data = sc.decode(msg.data)
                const msgHeaders = hdrsToObj(msg.headers)
                this.logger.debug(
                    `NatsMessenger.request.reqCb: msg.data: ${data}, headers: ${JSON.stringify(msgHeaders)}`
                )
                reqCb(null, data, msgHeaders)
            })
            .catch((err) => {
                this.logger.error(`NatsMessenger.request.reqCb: err: ${err}`)
                reqCb(err, null, null)
            })
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
    response(topic, respCb) {
        this.logger.debug(`NatsMessenger.response: assign to topic: '${topic}' callback: ${respCb}`)
        return this.natsConnection.subscribe(topic, {
            callback: async (err, msg) => {
                const sc = StringCodec()
                const requestPayload = sc.decode(msg.data)
                this.logger.debug(
                    `NatsMessenger.response.callback: received err: ${err}, msg: '${requestPayload}', headers: ${JSON.stringify(
                        hdrsToObj(msg.headers)
                    )}`
                )
                this.logger.debug(
                    `NatsMessenger.response.respCb: call with err: ${err}, payload: '${requestPayload}', headers: ${JSON.stringify(
                        hdrsToObj(msg.headers)
                    )}`
                )
                const { payload = '', headers = {} } = respCb(err, requestPayload, hdrsToObj(msg.headers))
                this.logger.debug(
                    `NatsMessenger.response.respCb: respond with: payload: '${payload}', headers: ${JSON.stringify(
                        headers
                    )}`
                )
                const hdrs = objToHdrs(headers)
                await msg.respond(sc.encode(payload), { headers: hdrs })
            }
        })
    }

    /**
     * Drain the connection to NATS
     *
     * Draining provides for a graceful way to unsubscribe or close a connection
     * without losing messages that have already been dispatched to the client.
     *
     * In general, you can drain a subscription or all subscriptions in a connection.
     * When you drain a subscription, the client sends an unsubscribe protocol message to the server followed by a flush.
     * The subscription handler is only removed after the server responds.
     * Thus, all pending messages for the subscription have been processed.
     *
     * Draining a connection, drains all subscriptions.
     * However, when you drain the connection it becomes impossible to make new subscriptions or send new requests.
     * After the last subscription is drained, it also becomes impossible to publish a message.
     * These restrictions do not exist when just draining a subscription.
     *
     * @function
     */
    async drain() {
        this.logger.debug(`NatsMessenger.drain:`)
        await this.natsConnection.drain()
    }

    /**
     * Flushes the pending messages with NATS
     *
     * Flush sends a PING to the server.
     * When the server responds with PONG you are guaranteed that all pending data was sent and received by the server.
     *
     * @function
     */
    async flush() {
        this.logger.debug(`NatsMessenger.flush:`)
        await this.natsConnection.flush()
    }
}
