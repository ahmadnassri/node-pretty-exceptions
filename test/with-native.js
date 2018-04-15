const { test } = require('tap')

const render = require('../lib')

test('native', assert => {
  assert.plan(1)

  const color = false
  const native = true
  const source = true

  const found = render(new Error('foo'), { native, source, color })

  assert.match(found, /Module._compile/)
})
