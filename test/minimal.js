const { test } = require('tap')

const render = require('../lib')
test('minimal', assert => {
  assert.plan(1)

  const color = false
  const native = false
  const source = false

  const found = render(new Error('foo'), { native, source, color })

  assert.match(found, /minimal\.js/)
})
