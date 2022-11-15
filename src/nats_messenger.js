require('babel-core/register')
require('babel-polyfill')
import { connect, StringCodec, headers } from 'nats'

const objToHdrs = (msgHeadersObj) => {
    const hdrs = headers()
    for (const property in msgHeadersObj) {
        hdrs.append(property, msgHeadersObj[property])
    }
    return hdrs
}

const hdrsToObj = (hdrs) => {
    const obj = {}
    for (const [key] of hdrs) {
        obj[key] = hdrs.get(key)
    }
    return obj
}

export class NatsMessenger {
    constructor(uri, logger) {
        this.uri = uri
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
        this.logger.debug(`NatsMessenger.start: Connect to '${this.uri}'`)
        this.natsConnection = await connect({ debug: true, servers: this.uri })
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
     *
     * @arg {String} topic       - The name of the topic (subject in NATS terminology) to that the message must be published.
     * @arg {String} payload     - The payload of the message.
     * @arg {Object} msgHeaders  - A flat object (key-value pairs) that represent the headers. Keys are the header names, and the values are the header values.
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

    request(topic, payload, timeout, msgHeaders, reqCb) {
        this.logger.debug(
            `NatsMessenger.request.publish: topic: '${topic}', payload: '${payload}', timeout: ${timeout}, headers: ${msgHeaders}`
        )
        const sc = StringCodec()
        const hdrs = headers() //objToHdrs(msgHeaders)
        hdrs.append('content-type', 'application/json')
        return this.natsConnection
            .request(topic, sc.encode(payload), {
                timeout: timeout,
                headers: hdrs
            })
            .then((msg) => {
                this.logger.debug(`NatsMessenger.request.reqCb: msg: ${msg}`)
                reqCb(null, sc.decode(msg.data), msg.headers)
            })
            .catch((err) => {
                this.logger.error(`NatsMessenger.request.reqCb: err: ${err}`)
                reqCb(err, null, null)
            })
    }

    response(topic, respCb) {
        this.logger.debug(`NatsMessenger.response: assign to topic: '${topic}' callback: ${respCb}`)
        return this.natsConnection.subscribe(topic, {
            callback: async (err, msg) => {
                const sc = StringCodec()
                const requestPayload = sc.decode(msg.data)
                this.logger.debug(
                    `NatsMessenger.response.callback: received err: ${err}, msg: '${requestPayload}', headers: ${msg.headers.headers}`
                )
                this.logger.debug(
                    `NatsMessenger.response.respCb: call with err: ${err}, payload: '${requestPayload}', headers: ${msg.headers.headers}`
                )
                const responsePayload = respCb(err, requestPayload, msg.headers.headers)
                this.logger.debug(
                    `NatsMessenger.response.respCb: respond with: payload: '${responsePayload}', headers: ${msg.headers.headers}`
                )
                await msg.respond(sc.encode(responsePayload), msg.headers.headers)
            }
        })
    }

    async drain() {
        this.logger.debug(`NatsMessenger.drain:`)
        await this.natsConnection.drain()
    }

    async flush() {
        this.logger.debug(`NatsMessenger.flush:`)
        await this.natsConnection.flush()
    }
}
