/* global describe test expect */

// This file tests some internal functions of lib/standard-clojure-style.js
// NOTE: in lib/standard-clojure-style.js, exportInternalFnsForTesting must be set to true for these to run

const scsLib = require('../lib/standard-clojure-style.js')

test('internal functions are exported', () => {
  expect(isFn(scsLib._charAt)).toBe(true)
  expect(isFn(scsLib._commentNeedsSpaceInside)).toBe(true)
  expect(isFn(scsLib._AnyChar)).toBe(true)
  expect(isFn(scsLib._flattenTree)).toBe(true)
})

describe('String Util', () => {
  describe('charAt', () => {
    test('returns correct character at specified index', () => {
      expect(scsLib._charAt('hello', 0)).toBe('h')
      expect(scsLib._charAt('hello', 4)).toBe('o')
    })

    test('handles edge cases', () => {
      expect(scsLib._charAt('', 0)).toBe('')
      expect(scsLib._charAt('a', 1)).toBe('') // out of bounds
      expect(scsLib._charAt('a', -1)).toBe('') // negative index
    })
  })

  describe('substr', () => {
    test('extracts substring correctly', () => {
      expect(scsLib._substr('hello world', 0, 5)).toBe('hello')
      expect(scsLib._substr('hello world', 6, 11)).toBe('world')
    })

    test('handles negative end index', () => {
      expect(scsLib._substr('hello world', 0, -1)).toBe('hello world')
      expect(scsLib._substr('hello', 2, -1)).toBe('llo')
    })

    test('handles out of bounds indices', () => {
      expect(scsLib._substr('hello', 0, 10)).toBe('hello') // end beyond string length
      expect(scsLib._substr('hello', 10, 15)).toBe('') // start beyond string length
      expect(scsLib._substr('hello', -1, 3)).toBe('') // negative start
    })
  })

  describe('repeatString', () => {
    test('repeats string correctly', () => {
      expect(scsLib._repeatString('abc', 3)).toBe('abcabcabc')
      expect(scsLib._repeatString('x', 5)).toBe('xxxxx')
    })

    test('handles edge cases', () => {
      expect(scsLib._repeatString('', 5)).toBe('')
      expect(scsLib._repeatString('hello', 0)).toBe('')
      expect(scsLib._repeatString('a', -1)).toBe('')
    })
  })

  describe('strIncludes', () => {
    test('correctly checks string inclusion', () => {
      expect(scsLib._strIncludes('hello world', 'world')).toBe(true)
      expect(scsLib._strIncludes('hello world', 'hello')).toBe(true)
      expect(scsLib._strIncludes('hello world', 'xyz')).toBe(false)
    })

    test('handles edge cases', () => {
      expect(scsLib._strIncludes('', '')).toBe(true)
      expect(scsLib._strIncludes('abc', '')).toBe(true)
      expect(scsLib._strIncludes('', 'a')).toBe(false)
    })
  })

  describe('toUpperCase', () => {
    test('converts string to uppercase', () => {
      expect(scsLib._toUpperCase('hello')).toBe('HELLO')
      expect(scsLib._toUpperCase('Hello World!')).toBe('HELLO WORLD!')
    })

    test('handles edge cases', () => {
      expect(scsLib._toUpperCase('')).toBe('')
      expect(scsLib._toUpperCase('123')).toBe('123')
      expect(scsLib._toUpperCase('áéíóú')).toBe('ÁÉÍÓÚ') // accented characters
    })
  })

  describe('strJoin', () => {
    test('joins array elements with separator', () => {
      expect(scsLib._strJoin(['a', 'b', 'c'], '-')).toBe('a-b-c')
      expect(scsLib._strJoin(['hello', 'world'], ' ')).toBe('hello world')
    })

    test('handles edge cases', () => {
      expect(scsLib._strJoin([], '-')).toBe('')
      expect(scsLib._strJoin(['a'], '-')).toBe('a')
      expect(scsLib._strJoin(['a', 'b'], '')).toBe('ab')
    })
  })

  describe('rtrim', () => {
    test('removes trailing whitespace', () => {
      expect(scsLib._rtrim('  hello  ')).toBe('  hello')
      expect(scsLib._rtrim('hello\n\t  ')).toBe('hello')
    })

    test('handles edge cases', () => {
      expect(scsLib._rtrim('')).toBe('')
      expect(scsLib._rtrim('   ')).toBe('')
      expect(scsLib._rtrim('hello')).toBe('hello')
    })
  })

  describe('strTrim', () => {
    test('removes leading and trailing whitespace', () => {
      expect(scsLib._strTrim('  hello  ')).toBe('hello')
      expect(scsLib._strTrim('\n\t hello \t\n')).toBe('hello')
    })

    test('handles edge cases', () => {
      expect(scsLib._strTrim('')).toBe('')
      expect(scsLib._strTrim('   ')).toBe('')
      expect(scsLib._strTrim('hello')).toBe('hello')
    })
  })

  describe('strStartsWith', () => {
    test('checks string start', () => {
      expect(scsLib._strStartsWith('hello world', 'hello')).toBe(true)
      expect(scsLib._strStartsWith('hello world', 'world')).toBe(false)
    })

    test('handles edge cases', () => {
      expect(scsLib._strStartsWith('', '')).toBe(true)
      expect(scsLib._strStartsWith('hello', '')).toBe(true)
      expect(scsLib._strStartsWith('', 'a')).toBe(false)
    })
  })

  describe('strEndsWith', () => {
    test('checks string end', () => {
      expect(scsLib._strEndsWith('hello world', 'world')).toBe(true)
      expect(scsLib._strEndsWith('hello world', 'hello')).toBe(false)
    })

    test('handles edge cases', () => {
      expect(scsLib._strEndsWith('', '')).toBe(true)
      expect(scsLib._strEndsWith('hello', '')).toBe(true)
      expect(scsLib._strEndsWith('', 'a')).toBe(false)
    })
  })

  test('isStringWithChars', () => {
    expect(scsLib._isStringWithChars('hello')).toBe(true)
    expect(scsLib._isStringWithChars('  x  ')).toBe(true)
    expect(scsLib._isStringWithChars(' ')).toBe(true)
    expect(scsLib._isStringWithChars('')).toBe(false)
    expect(scsLib._isStringWithChars(null)).toBe(false)
    expect(scsLib._isStringWithChars(undefined)).toBe(false)
  })

  describe('strReplaceFirst', () => {
    test('replaces substring', () => {
      expect(scsLib._strReplaceFirst('hello world', 'world', 'there')).toBe('hello there')
      expect(scsLib._strReplaceFirst('hello hello', 'hello', 'hi')).toBe('hi hello')
    })

    test('handles edge cases', () => {
      expect(scsLib._strReplaceFirst('', 'a', 'b')).toBe('')
      expect(scsLib._strReplaceFirst('hello', '', 'x')).toBe('hello')
      expect(scsLib._strReplaceFirst('hello', 'x', 'y')).toBe('hello')
    })
  })

  describe('crlfToLf', () => {
    test('converts CRLF to LF', () => {
      expect(scsLib._crlfToLf('hello\r\nworld')).toBe('hello\nworld')
      expect(scsLib._crlfToLf('line1\r\nline2\r\nline3')).toBe('line1\nline2\nline3')
    })

    test('handles edge cases', () => {
      expect(scsLib._crlfToLf('')).toBe('')
      expect(scsLib._crlfToLf('no crlf')).toBe('no crlf')
      expect(scsLib._crlfToLf('\r\n')).toBe('\n')
    })
  })

  describe('strSplit', () => {
    test('splits string by delimiter', () => {
      expect(scsLib._strSplit('a-b-c', '-')).toEqual(['a', 'b', 'c'])
      expect(scsLib._strSplit('hello world', ' ')).toEqual(['hello', 'world'])
    })

    test('handles edge cases', () => {
      expect(scsLib._strSplit('', '-')).toEqual([''])
      expect(scsLib._strSplit('hello', '')).toEqual(['h', 'e', 'l', 'l', 'o'])
      expect(scsLib._strSplit('a', 'x')).toEqual(['a'])
      expect(scsLib._strSplit('a-b-', '-')).toEqual(['a', 'b', ''])
    })
  })
})

test('commentNeedsSpaceBefore', () => {
  expect(scsLib._commentNeedsSpaceBefore('foo', ';bar')).toBe(true)
  expect(scsLib._commentNeedsSpaceBefore('foo {}', ';bar')).toBe(true)
  expect(scsLib._commentNeedsSpaceBefore('foo ', ';bar')).toBe(false)
  expect(scsLib._commentNeedsSpaceBefore('', ';bar')).toBe(false)
  expect(scsLib._commentNeedsSpaceBefore('foo [', ';bar')).toBe(false)
  expect(scsLib._commentNeedsSpaceBefore('foo (', ';bar')).toBe(false)
  expect(scsLib._commentNeedsSpaceBefore('foo {', ';bar')).toBe(false)
})

test('commentNeedsSpaceInside', () => {
  expect(scsLib._commentNeedsSpaceInside(';foo')).toBe(true)
  expect(scsLib._commentNeedsSpaceInside(';;foo')).toBe(true)
  expect(scsLib._commentNeedsSpaceInside(';;;;;;;foo')).toBe(true)
  expect(scsLib._commentNeedsSpaceInside(';; foo')).toBe(false)
  expect(scsLib._commentNeedsSpaceInside('; foo')).toBe(false)
  expect(scsLib._commentNeedsSpaceInside(';      foo')).toBe(false)
  expect(scsLib._commentNeedsSpaceInside(';')).toBe(false)
  expect(scsLib._commentNeedsSpaceInside(';;')).toBe(false)
  expect(scsLib._commentNeedsSpaceInside(';;;;;;')).toBe(false)
})

test('removeLeadingWhitespace', () => {
  expect(scsLib._removeLeadingWhitespace('\n ,,')).toBe(',,')
  expect(scsLib._removeLeadingWhitespace(' \n ')).toBe('')
  expect(scsLib._removeLeadingWhitespace('  \n\n  ')).toBe('')
  expect(scsLib._removeLeadingWhitespace(',, \n ')).toBe('')
  expect(scsLib._removeLeadingWhitespace(',, \n\n ')).toBe('')
  expect(scsLib._removeLeadingWhitespace(',, \n\n')).toBe('')
})

test('txtHasCommasAfterNewline', () => {
  expect(scsLib._txtHasCommasAfterNewline('\n ,,')).toBe(true)
  expect(scsLib._txtHasCommasAfterNewline('\n\n  ,')).toBe(true)
  expect(scsLib._txtHasCommasAfterNewline(' \n ')).toBe(false)
  expect(scsLib._txtHasCommasAfterNewline('  \n\n  ')).toBe(false)
  expect(scsLib._txtHasCommasAfterNewline(',, \n ')).toBe(false)
  expect(scsLib._txtHasCommasAfterNewline(',, \n\n ')).toBe(false)
})

test('AnyChar parser', () => {
  const anyCharTest1 = scsLib._AnyChar({ name: 'anychar_test1' })
  expect(anyCharTest1.parse('a', 0).text).toBe('a')
  expect(anyCharTest1.parse('b', 0).text).toBe('b')
  expect(anyCharTest1.parse('b', 0).name).toBe('anychar_test1')
  expect(anyCharTest1.parse(' ', 0).text).toBe(' ')
  expect(anyCharTest1.parse('+', 0).text).toBe('+')
  expect(anyCharTest1.parse('!~^', 0).text).toBe('!')
  expect(anyCharTest1.parse('', 0)).toBeNull()
})

test('Char parser', () => {
  const charTest1 = scsLib._Char({ char: 'a', name: 'char_test_a' })
  expect(charTest1.parse('a', 0).name).toBe('char_test_a')
  expect(charTest1.parse('a', 0).text).toBe('a')
  expect(charTest1.parse('=', 0)).toBeNull()

  const charTest2 = scsLib._Char({ char: '=', name: 'char_test_equals' })
  expect(charTest2.parse('=', 0).name).toBe('char_test_equals')
  expect(charTest2.parse('=', 0).text).toBe('=')
  expect(charTest2.parse('a', 0)).toBeNull()
})

test('Regex parser', () => {
  const regexTest1 = scsLib._Regex({
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

test('Choice parser', () => {
  const choiceTest1 = scsLib._Choice({
    parsers: [
      scsLib._Char({ char: 'a', name: '.a' }),
      scsLib._Char({ char: 'b', name: '.b' }),
      scsLib._Char({ char: 'c', name: '.c' })]
  })
  expect(choiceTest1.parse('a', 0).text).toBe('a')
  expect(choiceTest1.parse('b', 0).text).toBe('b')
  expect(choiceTest1.parse('c', 0).text).toBe('c')
  expect(choiceTest1.parse('z', 0)).toBeNull()
})

test('Seq parser', () => {
  const testSeq1 = scsLib._Seq({
    name: 'seq_test_1',
    parsers: [
      scsLib._Char({ char: 'a', name: 'AAA' }),
      scsLib._Char({ char: 'b', name: 'BBB' }),
      scsLib._Char({ char: 'c', name: 'CCC' })
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

test('Repeat parser', () => {
  const testRepeat1 = scsLib._Repeat({
    name: 'repeat_test_1',
    parser: scsLib._Char({ name: 'AAA', char: 'a' })
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

// TODO: add tests for NotChar
// TODO: add tests for String
// TODO: add tests for Optional

test('parseJavaPackageWithClass', () => {
  const example1 = scsLib._parseJavaPackageWithClass('aaa.bbb.ccc.Ddd')
  expect(example1.package).toBe('aaa.bbb.ccc')
  expect(example1.className).toBe('Ddd')

  const example2 = scsLib._parseJavaPackageWithClass('aaa.bbb.ccc')
  expect(example2.package).toBe('aaa.bbb.ccc')
  expect(example2.className).toBe(null)
})

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
