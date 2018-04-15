const { test } = require('tap')

const render = require('../lib')

test('properties', assert => {
  assert.plan(1)

  const color = false
  const native = false
  const source = false

  const error = new Error('foo')
  error.foo = 'baz'

  const found = render(error, { native, source, color })

  assert.match(found, /foo: baz/)
})
