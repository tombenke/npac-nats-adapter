#!/usr/bin/env node
/*jshint node: true */
'use strict'
require('babel-core/register')
require('babel-polyfill')
//import { connect, StringCodec, headers } from 'nats'
import { NatsMessenger } from './nats_messenger/nats_messenger'
import defaults from './config'
import _ from 'lodash'

/**
 * The startup function of the nats adapter
 *
 * This function should be registered with the startup phase, then npac will call when the project is starting.
 *
 * @arg {Object} container  - The actual state of the container this adapter will be added
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the nats adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
const startup = async (container, next) => {
    // Merges the defaults with the config coming from the outer world
    const config = _.merge({}, defaults, { nats: container.config.nats || {} })
    container.logger.info(`nats: Start up`)
    const messenger = new NatsMessenger(config.nats.uri, container.logger)
    await messenger.start()

    next(null, {
        config: config,
        nats: {
            messenger: messenger,

            flush: messenger.flush.bind(messenger),
            publish: messenger.publish.bind(messenger),
            subscribe: messenger.subscribe.bind(messenger),
            request: messenger.request.bind(messenger),
            response: messenger.response.bind(messenger)
        }
    })
}

/**
 * The shutdown function of the nats adapter
 *
 * This function should be registered with the shutdown phase, then npac will call when graceful shutdown happens.
 *
 * @arg {Object} container  - The actual state of the container this adapter is running
 * @arg {Function} next     - Error-first callback function to pass the result partial container extended with the nats adapter.
 *
 * see also: the `npac.startup` process description.
 *
 * @function
 */
const shutdown = async (container, next) => {
    container.logger.info('nats: Shutting down')

    // Drain and close the NATS connection
    await container.nats.messenger.close()
    next(null, null)
}

module.exports = {
    defaults: defaults,
    startup: startup,
    shutdown: shutdown
}
