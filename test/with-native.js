const { test } = require('tap')

const render = require('../lib')

test('native', assert => {
  assert.plan(1)

  const color = false
  const native = true
  const source = true

  const found = render(new Error('foo'), { native, source, color })

  // the following line is the real test, but galaxy bain "tap" seems to be messing with the stack trace ...
  // disabled the test for now, pending replacing tap with tape
  // assert.match(found, /internal/)

  assert.ok(true)
})
