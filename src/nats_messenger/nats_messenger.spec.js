import { expect } from 'chai'
import sinon from 'sinon'

import { NatsMessenger } from './nats_messenger'

describe('NatsMessenger', () => {
    let sandbox = sinon

    beforeEach((done) => {
        done()
    })

    afterEach((done) => {
        sandbox.restore()
        done()
    })

    const testPayload = { note: 'text...', number: 42, floatValue: 42.24 }
    const topic = 'test-topic'
    const testHeaders = {
        'content-type': 'application/json',
        'message-type': 'TestMsgType',
        'content-encoding': 'utf8'
    }

    it('#constructor', async () => {
        const messenger = new NatsMessenger('nats://localhost:4222', console)
        expect(messenger).to.not.eql(null)
    })

    it('#start, stop', async () => {
        const messenger = new NatsMessenger('nats://localhost:4222', console)
        await messenger.start()
        await messenger.close()
    })

    it('#publish, #subscribe', async () => {
        // Create and start NATS Messenger
        const messenger = new NatsMessenger('nats://localhost:4222', console)
        await messenger.start()

        // Setup a subscriber to receive and check the test message
        const subRes = new Promise((resolve, reject) => {
            const sub = messenger.subscribe(topic, (err, payload, headers) => {
                console.log(`test: subscribe.callback: payload: ${payload}, headers: ${JSON.stringify(headers)}`)
                const receivedPayload = JSON.parse(payload)
                expect(testPayload).to.eql(receivedPayload)
                resolve(null)
            })
            console.log(`test: subscribed to ${sub}`)
        })

        // Publish a test message
        console.log(`test: publish...`)
        messenger.publish(topic, JSON.stringify(testPayload), testHeaders)

        // Wait for the subscrition callback
        await subRes

        // Drain and shut down the NATS Messenger
        await messenger.close()
    })

    it('#request, #response', async function () {
        // Create and start NATS Messenger
        const messenger = new NatsMessenger('localhost:4222', console)
        await messenger.start()

        // Setup the responder to receive and check the test message and reply to the request
        console.log(`test: Setup response`)
        messenger.response(topic, (err, payload, headers) => {
            console.log(`response callback is called with ${payload} and respond with ${payload}`)
            const receivedPayload = JSON.parse(payload)
            expect(testPayload).to.eql(receivedPayload)
            return payload
        })

        console.log(`Send request`)
        let req = null
        const reqRes = new Promise((resolve, reject) => {
            req = messenger
                .request(topic, JSON.stringify(testPayload), 2000, testHeaders, (err, payload, headers) => {
                    console.log(`err: ${err}, payload: ${payload} headers: ${headers}`)
                    if (err) {
                        reject(err)
                    } else {
                        resolve(null)
                    }
                })
                .then((res) => {
                    console.log(`req resolved: ${res}`)
                })
                .catch((err) => {
                    console.log(`req error: ${err}`)
                })
        })

        console.log(reqRes, req)
        reqRes
            .then(async (res) => {
                console.log(`res: ${res}`)
                // Close NATS
                await messenger.close()
            })
            .catch((err) => {
                console.log(`err: ${err}`)
            })
    })

    //it('#request, #response (native)', async function () {
    //    const testPayload = { note: 'text...', number: 42, floatValue: 42.42 }
    //    const topic = 'test-topic'
    //    const testHeaders = {
    //        'content-type': 'application/json',
    //        'message-type': 'TestMsgType',
    //        'content-encoding': 'utf8'
    //    }

    //    const natsConnection = await connect({ servers: 'localhost:4222' })

    //    const request = (topic, payload, timeout, h, reqCb) => {
    //        const sc = StringCodec()
    //        const hdrs = headers()
    //        hdrs.append('content-type', 'application/json')
    //        natsConnection
    //            .request(topic, sc.encode(payload), {
    //                timeout: timeout,
    //                headers: hdrs
    //            })
    //            .then((msg) => {
    //                console.debug(`NatsMessenger.request.reqCb: msg: ${msg}`)
    //                reqCb(null, sc.decode(msg.data), msg.headers)
    //            })
    //            .catch((err) => {
    //                console.logger.error(`NatsMessenger.request.reqCb: err: ${err}`)
    //                reqCb(err, null, null)
    //            })
    //    }

    //    const response = (topic, respCb) => {
    //        console.debug(`NatsMessenger.response: assign to topic: '${topic}' callback: ${respCb}`)
    //        return natsConnection.subscribe(topic, {
    //            callback: async (err, msg) => {
    //                const sc = StringCodec()
    //                const requestPayload = sc.decode(msg.data)
    //                console.debug(
    //                    `NatsMessenger.response.callback: received err: ${err}, msg: '${requestPayload}', headers: ${msg.headers.headers}`
    //                )
    //                console.debug(
    //                    `NatsMessenger.response.respCb: call with err: ${err}, payload: '${requestPayload}', headers: ${msg.headers.headers}`
    //                )
    //                const responsePayload = respCb(err, requestPayload, msg.headers.headers)
    //                console.debug(
    //                    `NatsMessenger.response.respCb: respond with: payload: '${responsePayload}', headers: ${msg.headers.headers}`
    //                )
    //                await msg.respond(sc.encode(responsePayload), msg.headers.headers)
    //            }
    //        })
    //    }

    //    console.log(`test: Setup response`)
    //    const sub = response(topic, (err, payload, headers) => {
    //        console.log(`response callback is called with ${payload} and respond with ${payload}`)
    //        const receivedPayload = JSON.parse(payload)
    //        expect(testPayload).to.eql(receivedPayload)
    //        return payload
    //    })

    //    console.log(`Send request`)
    //    const reqRes = new Promise((resolve, reject) => {
    //        request(topic, JSON.stringify(testPayload), 2000, testHeaders, (err, payload, headers) => {
    //            console.log(`test: Request received response with err: ${err}, payload: ${payload} headers: ${headers}`)
    //            if (err) {
    //                reject(err)
    //            } else {
    //                resolve(null)
    //            }
    //        })
    //    })

    //    await reqRes

    //    // Close NATS
    //    await natsConnection.drain()
    //    await natsConnection.close()
    //})
})
