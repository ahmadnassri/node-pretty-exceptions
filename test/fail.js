const { test } = require('tap')

const render = require('../lib')

test('fail', assert => {
  assert.plan(1)

  const found = render('foo')

  assert.equal('foo', found)
})
