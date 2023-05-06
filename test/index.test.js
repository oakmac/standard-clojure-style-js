const foo1 = require('../lib')

test('test1', () => {
  expect(foo1('aaa', 'bbb')).toBe('zzz')
})
