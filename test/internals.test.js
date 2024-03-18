/* global test expect */

// This file tests some internal functions of lib/clojurefmt.js
// NOTE: in lib/clojurefmt.js, exportInternalFnsForTesting must be set to true for these to run

const clojurefmtLib = require('../lib/clojurefmt.js')

if (isFn(clojurefmtLib._charAt)) {
  test('String util: charAt', () => {
    expect(clojurefmtLib._charAt('abc', 0)).toBe('a')
    expect(clojurefmtLib._charAt('abc', 2)).toBe('c')
    // TODO: handle out of range?
  })
}

if (isFn(clojurefmtLib._substr)) {
  test('String util: substr', () => {
    expect(clojurefmtLib._substr('abcdef', 0, 0)).toBe('')
    expect(clojurefmtLib._substr('abcdef', 0, 2)).toBe('ab')
    expect(clojurefmtLib._substr('abcdef', 3, 5)).toBe('de')
    expect(clojurefmtLib._substr('abcdef', 2)).toBe('cdef')
  })
}

if (isFn(clojurefmtLib._AnyChar)) {
  test('AnyChar parser', () => {
    const anyCharTest1 = clojurefmtLib._AnyChar({ name: 'anychar_test1' })
    expect(anyCharTest1.parse('a', 0).text).toBe('a')
    expect(anyCharTest1.parse('b', 0).text).toBe('b')
    expect(anyCharTest1.parse('b', 0).name).toBe('anychar_test1')
    expect(anyCharTest1.parse(' ', 0).text).toBe(' ')
    expect(anyCharTest1.parse('+', 0).text).toBe('+')
    expect(anyCharTest1.parse('!~^', 0).text).toBe('!')
    expect(anyCharTest1.parse('', 0)).toBeNull()
  })
}

if (isFn(clojurefmtLib._Char)) {
  test('Char parser', () => {
    const charTest1 = clojurefmtLib._Char({ char: 'a', name: 'char_test_a' })
    expect(charTest1.parse('a', 0).name).toBe('char_test_a')
    expect(charTest1.parse('a', 0).text).toBe('a')
    expect(charTest1.parse('=', 0)).toBeNull()

    const charTest2 = clojurefmtLib._Char({ char: '=', name: 'char_test_equals' })
    expect(charTest2.parse('=', 0).name).toBe('char_test_equals')
    expect(charTest2.parse('=', 0).text).toBe('=')
    expect(charTest2.parse('a', 0)).toBeNull()
  })
}

if (isFn(clojurefmtLib._Regex)) {
  test('Regex parser', () => {
    const regexTest1 = clojurefmtLib._Regex({
      regex: /(c|d)+/,
      name: 'foo'
    })

    // matches must be made at the beginning of a string
    const regexResult1 = regexTest1.parse('aaacb', 0)
    expect(regexResult1).toBeNull()

    const regexResult2 = regexTest1.parse('aaacb', 3)
    expect(regexResult2.name).toBe('foo')
    expect(regexResult2.start).toBe(3)
    expect(regexResult2.end).toBe(4)
    expect(regexResult2.text).toBe('c')

    const regexResult3 = regexTest1.parse('aaacddb', 3)
    expect(regexResult3.name).toBe('foo')
    expect(regexResult3.start).toBe(3)
    expect(regexResult3.end).toBe(6)
    expect(regexResult3.text).toBe('cdd')

    const regexResult4 = regexTest1.parse('aaacddb', 4)
    expect(regexResult4.name).toBe('foo')
    expect(regexResult4.start).toBe(4)
    expect(regexResult4.end).toBe(6)
    expect(regexResult4.text).toBe('dd')
  })
}

if (isFn(clojurefmtLib._Choice)) {
  test('Choice parser', () => {
    const choiceTest1 = clojurefmtLib._Choice({
      parsers: [
        clojurefmtLib._Char({ char: 'a', name: '.a' }),
        clojurefmtLib._Char({ char: 'b', name: '.b' }),
        clojurefmtLib._Char({ char: 'c', name: '.c' })]
    })
    expect(choiceTest1.parse('a', 0).text).toBe('a')
    expect(choiceTest1.parse('b', 0).text).toBe('b')
    expect(choiceTest1.parse('c', 0).text).toBe('c')
    expect(choiceTest1.parse('z', 0)).toBeNull()
  })
}

if (isFn(clojurefmtLib._Seq)) {
  test('Seq parser', () => {
    const testSeq1 = clojurefmtLib._Seq({
      name: 'seq_test_1',
      parsers: [
        clojurefmtLib._Char({ char: 'a', name: 'AAA' }),
        clojurefmtLib._Char({ char: 'b', name: 'BBB' }),
        clojurefmtLib._Char({ char: 'c', name: 'CCC' })
      ]
    })

    const seqResult1 = testSeq1.parse('abc', 0)
    expect(seqResult1.start).toBe(0)
    expect(seqResult1.end).toBe(3)
    expect(JSON.stringify(childrenNames(seqResult1))).toBe(JSON.stringify(['AAA', 'BBB', 'CCC']))

    const seqResult2 = testSeq1.parse('aba', 0)
    expect(seqResult2).toBeNull()

    const seqResult3 = testSeq1.parse('ab', 0)
    expect(seqResult3).toBeNull()

    const seqResult4 = testSeq1.parse('abcd', 0)
    expect(seqResult4.start).toBe(0)
    expect(seqResult4.end).toBe(3)
  })
}

if (isFn(clojurefmtLib._Repeat)) {
  test('Repeat parser', () => {
    const testRepeat1 = clojurefmtLib._Repeat({
      name: 'repeat_test_1',
      parser: clojurefmtLib._Char({ name: 'AAA', char: 'a' })
    })

    const repeatResult1 = testRepeat1.parse('b', 0)
    expect(repeatResult1.start).toBe(0)
    expect(repeatResult1.end).toBe(0)
    expect(repeatResult1.name).toBeNull()

    const repeatResult2 = testRepeat1.parse('a', 0)
    expect(repeatResult2.start).toBe(0)
    expect(repeatResult2.end).toBe(1)
    expect(repeatResult2.name).toBe('repeat_test_1')
    expect(isArray(repeatResult2.children))
    expect(repeatResult2.children.length).toBe(1)
    expect(repeatResult2.children[0].start).toBe(0)
    expect(repeatResult2.children[0].end).toBe(1)
    expect(repeatResult2.children[0].text).toBe('a')
    expect(repeatResult2.children[0].name).toBe('AAA')

    const repeatResult3 = testRepeat1.parse('aa', 0)
    expect(repeatResult3.start).toBe(0)
    expect(repeatResult3.end).toBe(2)
    expect(repeatResult3.name).toBe('repeat_test_1')
    expect(isArray(repeatResult3.children))
    expect(repeatResult3.children.length).toBe(2)
    expect(repeatResult3.children[0].start).toBe(0)
    expect(repeatResult3.children[0].end).toBe(1)
    expect(repeatResult3.children[0].text).toBe('a')
    expect(repeatResult3.children[0].name).toBe('AAA')

    expect(repeatResult3.children[1].start).toBe(1)
    expect(repeatResult3.children[1].end).toBe(2)
    expect(repeatResult3.children[1].text).toBe('a')
    expect(repeatResult3.children[1].name).toBe('AAA')

    const repeatResult4 = testRepeat1.parse('baac', 1)
    expect(repeatResult4.start).toBe(1)
    expect(repeatResult4.end).toBe(3)
    expect(repeatResult4.name).toBe('repeat_test_1')
    expect(isArray(repeatResult4.children))
    expect(repeatResult4.children.length).toBe(2)

    expect(repeatResult4.children[0].start).toBe(1)
    expect(repeatResult4.children[0].end).toBe(2)
    expect(repeatResult4.children[0].text).toBe('a')
    expect(repeatResult4.children[0].name).toBe('AAA')

    expect(repeatResult4.children[1].start).toBe(2)
    expect(repeatResult4.children[1].end).toBe(3)
    expect(repeatResult4.children[1].text).toBe('a')
    expect(repeatResult4.children[1].name).toBe('AAA')
  })
}

// TODO: add tests for NotChar
// TODO: add tests for String
// TODO: add tests for Optional

if (isFn(clojurefmtLib._parseJavaPackageWithClass)) {
  test('parseJavaPackageWithClass', () => {
    const example1 = clojurefmtLib._parseJavaPackageWithClass('aaa.bbb.ccc.Ddd')
    expect(example1.package).toBe('aaa.bbb.ccc')
    expect(example1.className).toBe('Ddd')

    const example2 = clojurefmtLib._parseJavaPackageWithClass('aaa.bbb.ccc')
    expect(example2.package).toBe('aaa.bbb.ccc')
    expect(example2.className).toBe(null)
  })
}

// -----------------------------------------------------------------------------
// Util

function isFn (f) {
  return typeof f === 'function'
}

function isArray (x) {
  return Array.isArray(x)
}

function childrenNames (result) {
  return result.children.map(node => { return node.name })
}
