/* global define */

// clojurefmt v0.1.0
//
// Copyright 2023 © Chris Oakman
// ISC License

// -----------------------------------------------------------------------------
// JS Module Boilerplate

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.clojurefmt = factory()
  }
}(this, function () { // start module anonymous scope
  'use strict'

  // ---------------------------------------------------------------------------
  // Type Predicates

  function isString (s) {
    return typeof s === 'string'
  }

  function isInteger (x) {
    return typeof x === 'number' &&
         isFinite(x) &&
         Math.floor(x) === x
  }

  function isPositiveInt (i) {
    return isInteger(i) && i >= 0
  }

  function isFunction (f) {
    return typeof f === 'function'
  }

  function isObject (o) {
    return typeof o === 'object'
  }

  function isArray (x) {
    return Array.isArray(x)
  }

  function looksLikeAParser (p) {
    return p && isFunction(p.parse)
  }

  function looksLikeARegex (r) {
    return typeof r === 'object' && isFunction(r.test)
  }

  // ---------------------------------------------------------------------------
  // Language Helpers
  // NOTE: wrapping these functions make it easier to port between languages

  // returns the length of a String
  function strLen (s) {
    return s.length
  }

  // returns the length of an Array
  function arraySize (a) {
    return a.length
  }

  function strConcat (s1, s2) {
    return '' + s1 + s2
  }

  function inc (n) {
    return n + 1
  }

  function dec (n) {
    return n - 1
  }

  function stackPeek (arr, idxFromBack) {
    const maxIdx = arraySize(arr) - 1
    if (idxFromBack > maxIdx) {
      return null
    }
    return arr[maxIdx - idxFromBack]
  }

  // ---------------------------------------------------------------------------
  // String Utils

  // returns the character at position n inside of String s (0-indexed)
  function charAt (s, n) {
    return s.charAt(n)
  }

  console.assert(charAt('abc', 0) === 'a')
  console.assert(charAt('abc', 2) === 'c')

  // Returns the substring of s beginning at start inclusive, and ending
  // at end (defaults to length of string), exclusive.
  function substr (s, start, end) {
    const len = strLen(s)
    if (!isPositiveInt(end)) end = len
    if (end > len) end = len
    // TODO: throw here is end < start?
    return s.substring(start, end)
  }

  console.assert(substr('abcdef', 0, 0) === '')
  console.assert(substr('abcdef', 0, 2) === 'ab')
  console.assert(substr('abcdef', 3, 5) === 'de')
  console.assert(substr('abcdef', 2) === 'cdef')

  function repeatString (text, n) {
    let result = ''
    let i = 0
    while (i < n) {
      result = result + text
      i = i + 1
    }
    return result
  }

  // replaces all instances of findStr with replaceStr inside of String s
  function strReplaceAll (s, findStr, replaceStr) {
    return s.replaceAll(findStr, replaceStr)
  }

  // ---------------------------------------------------------------------------
  // Node Types

  // creates and returns an AST Node Object:
  // - start: start position in String (inclusive)
  // - end: end position in String (exclusive)
  // - children: array of child Nodes
  // - name: name of the Node
  // - text: raw text of the Node (only for terminal nodes like Regex or Strings)
  function Node (opts) {
    return {
      start: opts.start,
      end: opts.end,
      children: opts.children,
      name: opts.name,
      text: opts.text
    }
  }

  function Named (opts) {
    return {
      parse: (txt, pos) => {
        const parser = getParser(opts.parser)
        const node = parser.parse(txt, pos)

        if (!node) {
          return null
        } else if (node && !isString(node.name)) {
          node.name = opts.name
          return node
        } else {
          return Node({
            start: node.start,
            end: node.end,
            children: [node],
            name: opts.name
          })
        }
      }
    }
  }

  // TODO: move this to the testing framework
  const numSpacesPerIndentLevel = 2

  // returns a String representation of an AST Node Object
  function nodeToString (node, indentLevel) {
    if (!isPositiveInt(indentLevel)) indentLevel = 0

    const indentationSpaces = repeatString(' ', indentLevel * numSpacesPerIndentLevel)

    let s = indentationSpaces + '(' + node.name + ' ' + node.start + '..' + node.end
    if (node.text && node.text !== '') {
      const textWithNewlinesEscaped = strReplaceAll(node.text, '\n', '\\n')
      s = s + " '" + textWithNewlinesEscaped + "'"
    }

    if (node.children) {
      let i = 0
      const numChildren = arraySize(node.children)
      while (i < numChildren) {
        const childNode = node.children[i]
        s = s + '\n' + nodeToString(childNode, indentLevel + 1)
        i = i + 1
      }
    }

    s = s + ')'
    return s
  }

  // ---------------------------------------------------------------------------
  // Terminal Parsers

  // Terminal parser that matches any single character.
  function AnyChar (opts) {
    return {
      name: opts.name,
      parse: (txt, pos) => {
        if (pos < strLen(txt)) {
          return Node({
            start: pos,
            end: pos + 1,
            name: opts.name,
            text: charAt(txt, pos)
          })
        }
      }
    }
  }

  const charDebugLogging = false

  // Terminal parser that matches one character.
  function Char (opts) {
    return {
      isTerminal: true,
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
        if (charDebugLogging) {
          console.log('Char parse:', txt, pos)
          console.log(strLen(txt))
          console.log('Trying to match against:', '###' + opts.char + '###')
          console.log('###' + charAt(txt, pos) + '###')
          console.log('********************************')
        }

        if (pos < strLen(txt) && charAt(txt, pos) === opts.char) {
          if (charDebugLogging) {
            console.log('Yes - we matched here')
            console.log('********************************')
          }

          return Node({
            start: pos,
            end: pos + 1,
            name: opts.name,
            text: opts.char
          })
        }
      }
    }
  }

  // Terminal parser that matches any single character, except one.
  function NotChar (opts) {
    return {
      isTerminal: true,
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
        if (pos < strLen(txt)) {
          const charAtThisPos = charAt(txt, pos)
          if (charAtThisPos !== opts.char) {
            return Node({
              start: pos,
              end: pos + 1,
              name: opts.name,
              text: charAtThisPos
            })
          }
        }
      }
    }
  }

  const stringDebuggLogging = false

  // Terminal parser that matches a String
  function String (opts) {
    return {
      // str: opts.str,
      // len: strLen(opts.str),
      name: opts.name,
      parse: (txt, pos) => {
        const len = strLen(opts.str)
        if (pos + len <= strLen(txt)) {
          const strToCompare = substr(txt, pos, pos + len)

          if (stringDebuggLogging) {
            console.log('String to match:', opts.str)
            console.log('input text:', txt)
            console.log('strToCompare:', strToCompare)
          }

          if (opts.str === strToCompare) {
            return Node({
              start: pos,
              end: pos + len,
              name: opts.name,
              text: opts.str
            })
          }
        }
      }
    }
  }

  const logRegexParser = false

  // TODO: extract the regex operations here to make it easier to port
  function Regex (opts) {
    console.assert(looksLikeARegex(opts.regex), 'non-regex passed to Regex parser')

    return {
      name: opts.name,
      pattern_str: opts.regex,
      parse: (txt, pos) => {
        if (logRegexParser) {
          // console.log('Regex parser happening:', txt, pos, opts.regex.source)
          console.log('Regex parser happening:')
          console.log('text to match:', '***' + txt + '***')
          console.log('position:', pos)
          console.log('regex:', opts.regex.source)
        }

        // NOTE: this might be a perf issue; investigate later
        const txt2 = substr(txt, pos)

        const result = txt2.match(opts.regex)

        if (logRegexParser) {
          console.log('txt2:', txt2)
          console.log('regex match result:', result)
        }

        // HACK HACK HACK:
        // make sure the match was the beginning of the String
        // this can break in subtle ways: think of a better solution here
        if (result && result[0] !== '') {
          const matchedTxt = result[0]
          if (logRegexParser) {
            console.log('matchedTxt:', matchedTxt)
          }
          if (!txt2.startsWith(matchedTxt)) return null
        }

        // HACK: make sure the match was at the beginning of the String
        // FIXME: think a better way to do this
        // this can break in subtle ways
        // if (result && result[0].length === 1 && result[0] !== charAt(txt2, 0)) {
        //   return null
        // }

        let matchedStr = null
        if (result && isInteger(opts.groupIdx) && isString(result[opts.groupIdx + 1])) {
          matchedStr = result[opts.groupIdx + 1]
        } else if (result && isString(result[0])) {
          matchedStr = result[0]
        }

        if (isString(matchedStr)) {
          if (logRegexParser) {
            console.log('Matched str:', matchedStr)
          }

          return Node({
            start: pos,
            end: pos + strLen(matchedStr),
            name: opts.name,
            text: matchedStr
          })
        }

        return null
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Sequence Parsers

  // parser that matches a linear sequence of other parsers
  function Seq (opts) {
    return {
      // parser_names: opts.parsers.map((p) => { return p.name }),
      // parsers: null,
      // parserType: 'Seq',
      isTerminal: false,
      name: opts.name,

      parse: (txt, pos) => {
        // const parsers2 = []
        // let i = 0
        // while (i < arraySize(opts.parsers)) {
        //   const parserName = opts.parsers[i].name
        //   console.log('7777777', parserName)
        //   const p2 = getParser(parserName)
        //   parsers2.push(getParser(parserName))
        //   i = i + 1
        // }

        // console.log('Seq parser', txt, pos)

        const children = []
        let end = pos

        let j = 0
        while (j < arraySize(opts.parsers)) {
          const parser = opts.parsers[j]

          // console.log('attempting parser:', parser)

          const possibleNode = parser.parse(txt, end)
          if (possibleNode) {
            // console.log('here is a node we found:')
            // console.log(possibleNode)

            appendChildren(children, possibleNode)
            end = possibleNode.end
          } else {
            // else this is not a valid sequence: early return
            return null
          }
          j = j + 1
        }

        return Node({ start: pos, end, children, name: opts.name })
      }
    }
  }

  // matches the first matching of several parsers
  function Choice (opts) {
    console.assert(isArray(opts.parsers), 'opts.parsers not passed to Choice')

    return {
      parse: (txt, pos) => {
        let i = 0
        const numParsers = arraySize(opts.parsers)
        while (i < numParsers) {
          const parser = getParser(opts.parsers[i])
          console.assert(looksLikeAParser(parser), 'Choice: invalid parser passed', parser)
          const possibleNode = parser.parse(txt, pos)

          if (possibleNode) return possibleNode

          i = i + 1
        }
        return null
      }
    }
  }

  const repeatDebugLogging = false

  // matches child parser zero or more times
  function Repeat (opts) {
    return {
      parse: (txt, pos) => {
        opts.parser = getParser(opts.parser)

        let minMatches = 0
        if (isPositiveInt(opts.minMatches)) {
          minMatches = opts.minMatches
        }

        const children = []
        let end = pos

        // let repeatDepth = 0

        let lookForTheNextNode = true
        while (lookForTheNextNode) {
          const node = opts.parser.parse(txt, end)
          if (node) {
            if (repeatDebugLogging) {
              console.log('Repeat node found:', node)
            }
            appendChildren(children, node)
            end = node.end
          } else {
            lookForTheNextNode = false
          }

          // repeatDepth++
        }

        let name2 = null
        if (isString(opts.name) && end > pos) name2 = opts.name

        if (arraySize(children) >= minMatches) {
          return Node({
            start: pos,
            end,
            children,
            name: name2
          })
        } else {
          return null
        }
      }
    }
  }

  const optionalParserLogging = false

  // Parser that either matches a child parser or skips it
  function Optional (parser) {
    console.assert(looksLikeAParser(parser), 'parser is not a parser!')

    return {
      parse: (txt, pos) => {
        // const parser = getParser(opts.parser)

        if (optionalParserLogging) {
          console.log('Optional:', txt, pos)
        }

        const node = parser.parse(txt, pos)
        if (node && isString(node.text) && node.text !== '') {
          if (optionalParserLogging) {
            console.log('Yes node:', node)
          }
          return node
        } else {
          if (optionalParserLogging) {
            console.log('Empty node:', Node({ start: pos, end: pos }))
          }
          return Node({ start: pos, end: pos })
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Parser Helpers / Rename?

  // FIXME: write this so it returns the new Array
  function appendChildren (childrenArr, node) {
    if (isString(node.name) && node.name !== '') {
      childrenArr.push(node)
    } else if (isArray(node.children)) {
      let i = 0
      const numChildren = arraySize(node.children)
      while (i < numChildren) {
        const child = node.children[i]
        if (child) appendChildren(childrenArr, child)
        i = i + 1
      }
    }
  }

  // TODO: rename to resolveParser?
  function getParser (p) {
    if (isString(p) && parsers[p]) return parsers[p]
    if (isObject(p) && isFunction(p.parse)) return p
    console.error('Unable to getParser:', p)
    return null
  }

  // ---------------------------------------------------------------------------
  // Parser Definitions

  const parsers = {}

  parsers.string = Seq(
    {
      name: 'string',
      parsers: [
        Regex({ regex: /#?"/, name: '.open' }),
        Optional(Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' })),
        Optional(Char({ char: '"', name: '.close' }))
      ]
    }
  )

  const whitespaceCommons = ' ,\\n\\r\\t\\f'
  const whitespaceUnicodes = '\\u000B\\u001C\\u001D\\u001E\\u001F\\u2028\\u2029\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2008\\u2009\\u200a\\u205f\\u3000'
  const whitespaceChars = strConcat(whitespaceCommons, whitespaceUnicodes)

  const tokenHeadChars = '()\\[\\]{}\\"@~^;`#\\\''
  const tokenTailChars = '()\\[\\]{}\\"@^;`'

  const tokenReStr = '[^' + tokenHeadChars + whitespaceChars + '][^' + tokenTailChars + whitespaceChars + ']*'
  const charReStr = '\\\\[()\\[\\]{}"@^;`]'

  parsers.token = Regex({ name: 'token', regex: new RegExp('(##)?' + '(' + charReStr + '|' + tokenReStr + ')') })

  // parsers._ws = Regex({ regex: new RegExp('[' + whitespaceChars + ']+') })
  parsers._ws = Choice({
    parsers: [
      String({ name: 'whitespace:newline', str: '\n' }),
      Regex({ name: 'whitespace', regex: new RegExp('[' + whitespaceChars + ']+') })
    ]
  })

  parsers.comment = Regex({ name: 'comment', regex: /;[^\n]*/ })

  parsers.discard = Seq({
    name: 'discard',
    parsers: [
      String({ name: 'marker', str: '#_' }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers.braces = Seq({
    name: 'braces',
    parsers: [
      // NOTE: difference from cs_parser.py here
      Choice({
        parsers: [
          Char({ name: '.open', char: '{' }),
          String({ name: '.open', str: '#{' }),
          String({ name: '.open', str: '#::{' }),
          Regex({ name: '.open', regex: /#:{1,2}[a-zA-Z][a-zA-Z0-9.-_]*{/ })
        ]
      }),
      Repeat({
        name: '.body',
        parser: Choice({ parsers: ['_gap', '_form', NotChar({ name: 'error', char: '}' })] })
      }),
      Optional(Char({ name: '.close', char: '}' }))
    ]
  })

  parsers.brackets = Seq({
    name: 'brackets',
    parsers: [
      Char({ name: '.open', char: '[' }),
      Repeat({
        name: '.body',
        parser: Choice({ parsers: ['_gap', '_form', NotChar({ name: 'error', char: ']' })] })
      }),
      Optional(Char({ name: '.close', char: ']' }))
    ]
  })

  parsers.parens = Seq({
    name: 'parens',
    parsers: [
      Regex({ name: '.open', regex: /(#\?@|#\?|#=|#)?\(/ }),
      Repeat({
        name: '.body',
        parser: Choice({ parsers: ['_gap', '_form', NotChar({ char: ')', name: 'error' })] })
      }),
      Optional(Char({ name: '.close', char: ')' }))
    ]
  })

  parsers._gap = Choice({ parsers: ['_ws', 'comment', 'discard'] })

  parsers.meta = Seq({
    name: 'meta',
    parsers: [
      Repeat({
        minMatches: 1,
        parser: Seq({
          parsers: [
            Regex({ name: '.marker', regex: /#?\^/ }),
            Repeat({ parser: '_gap' }),
            Named({ name: '.meta', parser: '_form' }),
            Repeat({ parser: '_gap' })
          ]
        })
      }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers.wrap = Seq({
    name: 'wrap',
    parsers: [
      Regex({ name: '.marker', regex: /(@|'|`|~@|~|#')/ }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers.tagged = Seq({
    name: 'tagged',
    parsers: [
      Char({ char: '#' }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.tag', parser: 'token' }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers._form = Choice({ parsers: ['token', 'string', 'parens', 'brackets', 'braces', 'wrap', 'meta', 'tagged'] })

  parsers.source = Repeat({
    name: 'source',
    parser: Choice({ parsers: ['_gap', '_form', AnyChar({ name: 'error' })] })
  })

  // ---------------------------------------------------------------------------
  // Tests
  // TODO: move these to a testing framework

  const runLocalAsserts = false

  if (runLocalAsserts) {
    const regexTest1 = Regex({
      regex: /(c|d)+/,
      name: 'foo'
    })

    const regexResult1 = regexTest1.parse('aaacb', 0)
    console.assert(regexResult1 === null, 'matches must be made at the beginning of a string')

    const regexResult2 = regexTest1.parse('aaacb', 3)
    console.assert(regexResult2.name === 'foo')
    console.assert(regexResult2.start === 3)
    console.assert(regexResult2.end === 4)
    console.assert(regexResult2.text === 'c')

    const regexResult3 = regexTest1.parse('aaacddb', 3)
    console.assert(regexResult3.name === 'foo')
    console.assert(regexResult3.start === 3)
    console.assert(regexResult3.end === 6)
    console.assert(regexResult3.text === 'cdd')

    const regexResult4 = regexTest1.parse('aaacddb', 4)
    console.assert(regexResult4.name === 'foo')
    console.assert(regexResult4.start === 4)
    console.assert(regexResult4.end === 6)
    console.assert(regexResult4.text === 'dd')

    const choiceTest1 = Choice({
      parsers: [
        Char({ char: 'a', name: '.a' }),
        Char({ char: 'b', name: '.b' }),
        Char({ char: 'c', name: '.c' })]
    })
    console.assert(choiceTest1.parse('a', 0).text === 'a')
    console.assert(choiceTest1.parse('b', 0).text === 'b')
    console.assert(choiceTest1.parse('c', 0).text === 'c')
    console.assert(choiceTest1.parse('z', 0) === null)

    function childrenNames (result) {
      return result.children.map(node => { return node.name })
    }

    const testSeq1 = Seq({
      name: 'seq_test_1',
      parsers: [
        Char({ char: 'a', name: 'AAA' }),
        Char({ char: 'b', name: 'BBB' }),
        Char({ char: 'c', name: 'CCC' })
      ]
    })

    const seqResult1 = testSeq1.parse('abc', 0)
    console.assert(seqResult1.start === 0)
    console.assert(seqResult1.end === 3)
    console.assert(JSON.stringify(childrenNames(seqResult1)) === JSON.stringify(['AAA', 'BBB', 'CCC']))

    const seqResult2 = testSeq1.parse('aba', 0)
    console.assert(seqResult2 === null)

    const seqResult3 = testSeq1.parse('ab', 0)
    console.assert(seqResult3 === null)

    const seqResult4 = testSeq1.parse('abcd', 0)
    console.assert(seqResult4.start === 0)
    console.assert(seqResult4.end === 3)

    const testRepeat1 = Repeat({
      name: 'repeat_test_1',
      parser: Char({ name: 'AAA', char: 'a' })
    })

    const repeatResult1 = testRepeat1.parse('b', 0)
    console.assert(repeatResult1.start === 0)
    console.assert(repeatResult1.end === 0)
    console.assert(repeatResult1.name === null)

    const repeatResult2 = testRepeat1.parse('a', 0)
    console.assert(repeatResult2.start === 0)
    console.assert(repeatResult2.end === 1)
    console.assert(repeatResult2.name === 'repeat_test_1')
    console.assert(isArray(repeatResult2.children))
    console.assert(repeatResult2.children.length === 1)
    console.assert(repeatResult2.children[0].start === 0)
    console.assert(repeatResult2.children[0].end === 1)
    console.assert(repeatResult2.children[0].text === 'a')
    console.assert(repeatResult2.children[0].name === 'AAA')

    const repeatResult3 = testRepeat1.parse('aa', 0)
    console.assert(repeatResult3.start === 0)
    console.assert(repeatResult3.end === 2)
    console.assert(repeatResult3.name === 'repeat_test_1')
    console.assert(isArray(repeatResult3.children))
    console.assert(repeatResult3.children.length === 2)
    console.assert(repeatResult3.children[0].start === 0)
    console.assert(repeatResult3.children[0].end === 1)
    console.assert(repeatResult3.children[0].text === 'a')
    console.assert(repeatResult3.children[0].name === 'AAA')

    console.assert(repeatResult3.children[1].start === 1)
    console.assert(repeatResult3.children[1].end === 2)
    console.assert(repeatResult3.children[1].text === 'a')
    console.assert(repeatResult3.children[1].name === 'AAA')

    const repeatResult4 = testRepeat1.parse('baac', 1)
    console.assert(repeatResult4.start === 1)
    console.assert(repeatResult4.end === 3)
    console.assert(repeatResult4.name === 'repeat_test_1')
    console.assert(isArray(repeatResult4.children))
    console.assert(repeatResult4.children.length === 2)

    console.assert(repeatResult4.children[0].start === 1)
    console.assert(repeatResult4.children[0].end === 2)
    console.assert(repeatResult4.children[0].text === 'a')
    console.assert(repeatResult4.children[0].name === 'AAA')

    console.assert(repeatResult4.children[1].start === 2)
    console.assert(repeatResult4.children[1].end === 3)
    console.assert(repeatResult4.children[1].text === 'a')
    console.assert(repeatResult4.children[1].name === 'AAA')
  }

  // ---------------------------------------------------------------------------
  // Format

  function isNewlineNode (n) {
    return n.name === 'whitespace:newline'
  }

  function isWhitespaceNode (n) {
    return n.name === 'whitespace' || isNewlineNode(n)
  }

  function isParenOpener (n) {
    return n.text === '(' || n.text === '[' || n.text === '{' || n.text === '#{' || n.text === '#?(' || n.text === '#?@('
  }

  function isParenCloser (n) {
    return n.text === ')' || n.text === ']' || n.text === '}'
  }

  function isTokenNode (n) {
    return n.name === 'token'
  }

  // const numSpacesPerIndentLevel2 = 2
  // const indentationLevel = 0

  // function printNode (s, node, lineIdx) {
  //   if (isString(node.text)) {
  //     s = strConcat(s, node.text)
  //   }

  //   if (node.children) {
  //     const numChildren = arraySize(node.children)
  //     let i = 0
  //     while (i < numChildren) {
  //       const childNode = node.children[i]
  //       let nextNode = null
  //       if (node.children[inc(i)]) {
  //         nextNode = node.children[inc(i)]
  //       }

  //       // let indentation = ''
  //       // if (isNewlineNode(childNode)) {
  //       //   lineIdx = inc(lineIdx)
  //       //   indentation = '  '
  //       // }

  //       if (isParenOpener(childNode)) {
  //         indentationLevel = inc(indentationLevel)
  //       } else if (isParenCloser(childNode)) {
  //         indentationLevel = dec(indentationLevel)
  //       }

  //       s = strConcat(s, printNode('', childNode, lineIdx))

  //       if (isNewlineNode(childNode)) {
  //         lineIdx = inc(lineIdx)
  //         const indentationStr = repeatString('  ', indentationLevel)
  //         s = strConcat(s, indentationStr)

  //         // skip the next whitespace node
  //         // FIXME: this will not work with commas
  //         if (nextNode && isWhitespaceNode(nextNode)) {
  //           i = inc(i)
  //         }
  //       }

  //       i = inc(i)
  //     }
  //   }
  //   return s
  // }

  // function format1 (inputTxt, tree) {
  //   console.log(JSON.stringify(tree, null, 4))
  //   console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  //   console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  //   console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

  //   indentationLevel = 0
  //   return printNode('', tree, 0)
  // }

  // function appendChildNode (flatNodesArr, node) {
  //   flatNodesArr.push(node)

  //   if (node.children) {
  //     const numChildren = arraySize(node.children)
  //     let i = 0
  //     while (i < numChildren) {
  //       const childNode = children[i]
  //       flatNodesArr = appendChildNode(flatNodesArr, childNode)
  //       i = inc(i)
  //     }
  //   }

  //   return flatNodesArr
  // }

  // recursively runs aFn on every node in the tree
  function recurseAllChildren (node, aFn) {
    aFn(node)
    if (node.children) {
      const numChildren = arraySize(node.children)
      let i = 0
      while (i < numChildren) {
        const childNode = node.children[i]
        recurseAllChildren(childNode, aFn)
        i = inc(i)
      }
    }
    return null
  }

  // returns a flat array of the nodes to print
  function flattenTree (tree) {
    const nodes = []
    const pushNodeToNodes = (node) => {
      nodes.push(node)
    }
    recurseAllChildren(tree, pushNodeToNodes)

    return nodes
  }

  // ---------------------------------------------------------------------------
  // Public API

  // parses inputTxt and returns an tree structure of the code
  function parse (inputTxt) {
    return getParser('source').parse(inputTxt, 0)
  }

  // searches forward to find the next node that has non-empty text
  // returns the node if found, null otherwise
  function nextNodeWithText (allNodes, idx) {
    const maxIdx = arraySize(allNodes)

    while (idx < maxIdx) {
      const node = allNodes[idx]
      if (isString(node.text) && node.text !== '') {
        return node
      }
      idx = inc(idx)
    }

    return null
  }

  // searches forward in the nodes array for whitespace or closing nodes
  // stops when it finds the first non-whitespace or non-closer
  // returns an array of the closer + whitespace nodes (possibly an empty array)
  function findCloserNodes (nodes, idx) {
    const closers = []
    const nodesSize = arraySize(nodes)

    let keepSearching = true
    while (keepSearching) {
      const node = nodes[idx]

      if (!node) {
        keepSearching = false
      } else if (isWhitespaceNode(node)) {
        closers.push(node)
        keepSearching = true // NOTE: this is a no-op, but I like being explicit
      } else if (isParenCloser(node)) {
        closers.push(node)
        keepSearching = true // also a no-op
      } else {
        keepSearching = false
      }

      idx = inc(idx)

      // stop searching if we are at the end of the nodes list
      if (idx > nodesSize) {
        keepSearching = false
      }
    }

    return closers
  }

  function isOneSpaceOpener (opener) {
    return opener.text === '{' || opener.text === '['
  }

  function isReaderConditionalOpener (opener) {
    return opener.text === '#?(' || opener.text === '#?@('
  }

  // returns the number of spaces to use for indentation at the beginning of a line
  function numSpacesForIndentation (wrappingOpener) {
    if (!wrappingOpener) {
      return 0
    } else {
      const nextNode = wrappingOpener._nextWithText
      const openerTextLength = strLen(wrappingOpener.text)
      const directlyUnderneathOpener = wrappingOpener._colIdx + openerTextLength

      // console.log('wrappingOpener:', wrappingOpener)
      // console.log('nextNode:', nextNode)

      if (isReaderConditionalOpener(wrappingOpener)) {
        return directlyUnderneathOpener
      } else if (nextNode && isParenOpener(nextNode)) {
        return inc(wrappingOpener._colIdx)
      } else if (isOneSpaceOpener(wrappingOpener)) {
        return inc(wrappingOpener._colIdx)
      } else {
      // else indent two spaces from the wrapping opener
        return inc(inc(wrappingOpener._colIdx))
      }
    }
  }

  // parses inputTxt (Clojure code) and returns a String of it formatted using
  // Simple Clojure Formatting Rules
  function format (inputTxt) {
    const tree = parse(inputTxt)
    // TODO: check for errors, return code if found
    // TODO: sort namespace nodes

    const nodesArr = flattenTree(tree)
    const numNodes = arraySize(nodesArr)

    let parenNestingDepth = 0

    let idx = 0
    let outTxt = ''

    // FIXME: need a running paren stack of openers (who are not closed)
    // use this on a newline to determine indentation level
    const parenStack = []

    let colIdx = 0
    while (idx < numNodes) {
      // let prevNode = null
      // if (i > 0) { prevNode = nodesArr[dec(i)] }
      const node = nodesArr[idx]
      const nextTextNode = nextNodeWithText(nodesArr, inc(idx))

      const currentNodeIsNewline = isNewlineNode(node)

      if (isParenOpener(node)) {
        parenNestingDepth = inc(parenNestingDepth)

        // TODO: rename
        const nodeWithExtraInfo = node
        nodeWithExtraInfo._colIdx = colIdx
        // delete nextNode.children
        nodeWithExtraInfo._nextWithText = nextTextNode

        parenStack.push(nodeWithExtraInfo) // TODO: abstract to language neutral

        // remove whitespace after an opener (remove-surrounding-whitespace?)
        // TODO: make this one predicate condition / rename these functions
        if (isWhitespaceNode(nextTextNode) && !isNewlineNode(nextTextNode)) {
          // FIXME: skip this via index instead of modifying the tree like this
          nextTextNode.text = ''
        }
      } else if (isParenCloser(node)) {
        parenNestingDepth = dec(parenNestingDepth)
        parenStack.pop() // TODO: abstract to language neutral
      }

      // remove whitespace before a closer (remove-surrounding-whitespace?)
      if (isWhitespaceNode(node) && !isNewlineNode(node) && isParenCloser(nextTextNode)) {
        // FIXME: skip this via index instead of modifying the tree like this
        node.text = ''
      }

      if (currentNodeIsNewline) {
        // look forward to see if we can close parens on this line
        // FIXME: we can skip this search ahead if the parenNestingDepth is 0
        const parenTrailClosers = findCloserNodes(nodesArr, inc(idx))

        // print the closers at the end of this line if applicable
        let closersIdx = 0
        const numClosers = arraySize(parenTrailClosers)
        while (closersIdx < numClosers) {
          const closerNode = parenTrailClosers[closersIdx]
          // apply the closer nodes to the output string
          if (isParenCloser(closerNode)) {
            outTxt = strConcat(outTxt, closerNode.text)
            parenNestingDepth = dec(parenNestingDepth)
            parenStack.pop() // TODO: abstract to language neutral
          }
          closersIdx = inc(closersIdx)

          // increase the outer loop index as well (ie: skipping forward nodes)
          idx = inc(idx)
        }

        // print the newline and then the next line's indentation level
        // if we are not at the end of the nodes array
        if (inc(idx) < numNodes) {
          const topOfTheParenStack = stackPeek(parenStack, 0)

          // console.log('topOfTheParenStack:', topOfTheParenStack)
          // console.log('++++++++++++++++++++')

          const numSpaces = numSpacesForIndentation(topOfTheParenStack)

          const indentationStr = repeatString(' ', numSpaces)
          outTxt = strConcat(outTxt, strConcat('\n', indentationStr))

          // reset the colIdx
          colIdx = strLen(indentationStr)
        }
      } else if (isString(node.text) && node.text !== '') {
        const addSpaceAfterThisToken = isTokenNode(node) && isParenOpener(nextTextNode)

        outTxt = strConcat(outTxt, node.text)

        if (addSpaceAfterThisToken) {
          outTxt = strConcat(outTxt, ' ')
        }

        // update the colIdx
        colIdx = colIdx + strLen(node.text)
      }

      idx = inc(idx)
    }

    return {
      status: 'success',
      out: outTxt
    }
  }

  // returns a String representation of the AST
  function astToString (ast) {
    return nodeToString(ast, 0)
  }

  const API = {
    astToString,
    format,
    parse
  }

  return API
})) // end module anonymous scope
