import { expect } from 'chai'
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
                uri: 'nats://localhost:4222'
            }
        }

        const defaults = config
        expect(defaults).to.eql(expected)
        done()
    })
})
