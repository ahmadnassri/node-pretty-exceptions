const { test } = require('tap')

const render = require('../lib')

test('source', assert => {
  assert.plan(1)

  const color = false
  const native = false
  const source = true

  const error = new Error('foo')

  const found = render(error, { native, source, color })

  assert.match(found, /new Error\('foo'\)/)
})
