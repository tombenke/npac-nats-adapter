////import { expect } from 'chai'
import expect from 'expect'
import config from './config'

before((done) => {
    done()
})
after((done) => {
    done()
})

describe('nats.config', () => {
    it('#defaults', (done) => {
        const expected = {
            nats: {
                debug: false,
                name: undefined,
                user: undefined,
                pass: undefined,
                servers: ['nats://localhost:4222']
            }
        }

        const defaults = config
        expect(defaults).toEqual(expected)
        done()
    })
})
