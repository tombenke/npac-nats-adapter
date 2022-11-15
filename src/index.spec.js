import { expect } from 'chai'
import sinon from 'sinon'
import { addLogger, mergeConfig, removeSignalHandlers, catchExitSignals, npacStart } from 'npac'
import defaults from './config'
import * as nats from './index'
import * as _ from 'lodash'

describe('nats', () => {
    let sandbox = sinon

    beforeEach((done) => {
        removeSignalHandlers()
        done()
    })

    afterEach((done) => {
        removeSignalHandlers()
        sandbox.restore()
        done()
    })

    const config = (clientId) =>
        _.merge({}, defaults, {
            logger: {
                level: 'debug'
            },
            nats: {}
            /* Add command specific config parameters */
        })

    const testPayload = { note: 'text...', number: 42, floatValue: 42.24 }
    const topic = 'test-topic'
    const testHeaders = {
        'content-type': 'application/json',
        'message-type': 'TestMsgType',
        'content-encoding': 'utf8'
    }

    it('#startup, #shutdown', (done) => {
        catchExitSignals(sandbox, done)

        const adapters = [mergeConfig(config('test-client-ss')), addLogger, nats.startup]

        const testNats = (container, next) => {
            container.logger.info(`Run job to test nats`)
            next(null, null)
        }

        const terminators = [nats.shutdown]

        npacStart(adapters, [testNats], terminators, (err, res) => {
            if (err) {
                throw err
            } else {
                process.kill(process.pid, 'SIGTERM')
            }
        })
    })

    it('#publish, #subscribe', (done) => {
        catchExitSignals(sandbox, done)

        const adapters = [mergeConfig(config('test-client-pub-sub')), addLogger, nats.startup]

        const testNats = (container, next) => {
            container.logger.info(`Run job to test nats`)
            container.nats.subscribe(topic, (err, payload, headers) => {
                const receivedPayload = JSON.parse(payload)
                expect(err).to.be.null
                expect(testPayload).to.eql(receivedPayload)
                expect(testHeaders).to.eql(headers)
                next(null, null)
            })
            container.nats.publish(topic, JSON.stringify(testPayload), testHeaders)
        }

        const terminators = [nats.shutdown]

        npacStart(adapters, [testNats], terminators, (err, res) => {
            if (err) {
                throw err
            } else {
                process.kill(process.pid, 'SIGTERM')
            }
        })
    })

    it('#request, #response', (done) => {
        catchExitSignals(sandbox, done)

        const adapters = [mergeConfig(config('test-client-req-res')), addLogger, nats.startup]

        const testNats = (container, next) => {
            container.logger.info(`test: Run job to test nats`)
            const resSub = container.nats.response(topic, (err, requestPayload, requestHeaders) => {
                container.logger.info(
                    `respCb received err: ${err}, request: ${requestPayload} headers: ${JSON.stringify(requestHeaders)}`
                )
                const receivedPayload = JSON.parse(requestPayload)
                expect(err).to.be.null
                expect(receivedPayload).to.eql(testPayload)
                expect(requestHeaders).to.eql(testHeaders)
                return { payload: requestPayload, headers: requestHeaders }
            })

            container.nats.request(
                topic,
                JSON.stringify(testPayload),
                1000,
                testHeaders,
                (err, responsePayload, responseHeaders) => {
                    const receivedPayload = JSON.parse(responsePayload)
                    container.logger.info(
                        `reqCb received err: ${err}, payload: ${JSON.stringify(
                            receivedPayload
                        )}, headers: ${JSON.stringify(responseHeaders)}`
                    )
                    expect(receivedPayload).to.eql(testPayload)
                    expect(err).to.eql(null)
                    resSub.unsubscribe()
                    next(null, null)
                }
            )
        }

        const terminators = [nats.shutdown]

        npacStart(adapters, [testNats], terminators, (err, res) => {
            if (err) {
                throw err
            } else {
                process.kill(process.pid, 'SIGTERM')
            }
        })
    })
})
