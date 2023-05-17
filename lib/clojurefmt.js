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

  // returns the character at position n inside of String s
  function charAt (s, n) {
    return s.charAt(n)
  }

  console.assert(charAt('abc', 0) === 'a')
  console.assert(charAt('abc', 2) === 'c')

  // Returns the substring of s beginning at start inclusive, and ending
  // at end (defaults to length of string), exclusive.

  // returns
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

  function strConcat (s1, s2) {
    return (s1 + '') + (s2 + '')
  }

  function repeatString (text, n) {
    let result = ''
    let i = 0
    while (i < n) {
      result = result + text
      i = i + 1
    }
    return result
  }

  function looksLikeARegex (r) {
    return typeof r === 'object' && isFunction(r.test)
  }

  function isObject (o) {
    return typeof o === 'object'
  }

  function isArray (x) {
    return Array.isArray(x)
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

  function isString (s) {
    return typeof s === 'string'
  }

  function isChar (c) {
    return isString(c) && strLen(c) === 1
  }

  function isArrayOfChars (arr) {
    return isArray(arr) && arr.every(isChar)
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

  // Terminal parser that matches a String
  function String (opts) {
    return {
      str: opts.str,
      len: strLen(opts.str),
      name: opts.name,
      parse: (txt, pos) => {
        if (pos + strLen(opts.str) <= strLen(txt)) {
          if (true) { // FIXME
            return Node({
              start: pos,
              end: pos + strLen(opts.str),
              name: opts.name,
              text: opts.str
            })
          }
        }
      }
    }
  }

  // matches the first matching of several parsers
  function Choice (opts) {
    console.assert(isArray(opts.parsers))

    return {

      parse: (txt, pos) => {
        let i = 0
        const numParsers = arraySize(opts.parsers)
        while (i < numParsers) {
          const parser = getParser(opts.parsers[i])
          console.assert(looksLikeAParser(parser))
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
        if (repeatDebugLogging) {
          console.log('Repeat:', txt, pos)
        }

        const maxIdx = txt.length - 1

        const children = []
        const end = pos

        let currentIdx = pos
        let currentTxt = txt

        let repeatDepth = 0

        let lookForNextNode = true
        while (lookForNextNode) {
          const possibleNode = opts.parser.parse(currentTxt, 0)

          if (repeatDebugLogging) {
            console.log('possibleNode:', possibleNode)
            console.log('currentIdx:', currentIdx)
            console.log('currentTxt:', 'aaaa' + currentTxt + 'aaaa')
            console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
          }

          if (possibleNode) {
            appendChildren(children, possibleNode)
            currentIdx = possibleNode.end + 1
            currentTxt = substr(currentTxt, currentIdx)

            if (currentIdx >= maxIdx) {
              lookForNextNode = false
            }
          } else {
            lookForNextNode = false
          }

          repeatDepth++
        }

        // console.log('repeatDepth:', repeatDepth)

        let name = null
        if (isString(opts.name) && currentIdx > pos) name = opts.name

        return Node({
          start: pos,
          end: currentIdx - 1,
          children,
          name
        })
      }
    }
  }

  function AnyChar () {

  }

  // Terminal parser that matches one character.
  function Char (opts) {
    return {
      isTerminal: true,
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
        // console.log('Char parse:', txt, pos)
        // console.log(strLen(txt))
        // console.log(charAt(txt, pos))
        // console.log(opts.char)
        // console.log("********************")

        if (pos < strLen(txt) && charAt(txt, pos) === opts.char) {
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

  function looksLikeAParser (p) {
    return p && isFunction(p.parse)
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
          // return null
        }
      }
    }
  }

  // TODO: rename
  function arrayLength (a) {
    return a.length
  }

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

  const logRegexParser = false

  // TODO: extract the regex operations here to make it easier to port
  function Regex (opts) {
    console.assert(looksLikeARegex(opts.regex), 'non-regex passed to Regex parser')

    return {
      name: opts.name,
      pattern_str: opts.regex,
      parse: (txt, pos) => {
        if (logRegexParser) {
          console.log('Regex parser happening:', txt, pos, opts.regex.source)
        }

        const result = txt.match(opts.regex)

        if (logRegexParser && result) {
          console.log('result:', result)
        }

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

        // const matches = txt.matchAll(opts.regex)
        // for (const match of matches) {
        //   const matchStr = match + ""

        //   console.log(match)
        //   console.log('Here is the match string:', matchStr)

        //   return Node({
        //     start: pos,
        //     end: matchStr.length,
        //     name: opts.name,
        //     text: matchStr
        //   })
        // }

        // return null
      }
    }
  }

  // parser that matches a linear sequence of other parsers
  function Seq (opts) {
    return {
      parser_names: opts.parsers.map((p) => { return p.name }),
      parsers: null,
      parserType: 'Seq',
      isTerminal: false,
      name: opts.name,

      parse: (txt, pos) => {
        // const parsers2 = []
        // let i = 0
        // while (i < arrayLength(opts.parsers)) {
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
        while (j < arrayLength(opts.parsers)) {
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

  // ---------------------------------------------------------------------------
  // Parser Definitions

  const parsers = {}

  parsers.string = Seq(
    {
      name: 'string',
      parsers: [
        Regex({ regex: /^#?"/, name: '.open' }),

        // Optional(Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' })),
        // Optional(Char({ char: '"', name: '.close' }))

        // Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' }),
        Optional(Regex({ regex: /^("|#")([\d\D]*)(")$/, name: '.body', groupIdx: 1 })),
        Char({ char: '"', name: '.close' })
      ]
    }
  )

  const wsNormals = ' ,\\n\\r\\t\\f'
  const wsWeirdos = '\\u000B\\u001C\\u001D\\u001E\\u001F\\u2028\\u2029\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2008\\u2009\\u200a\\u205f\\u3000'
  // const tokenStart = '(##)?(\\\\[()\\[\\]{}\"@^;`]|'
  // const tokenEnd = '[^' + '\\(\\)\\[\\]\\{\\}\\"\\@\\~\\^\\;\\`\\#\'' + wsNormals + wsUncommons + '][^' + '\\(\\)\\[\\]\\{\\}\\"\\@\\^\\;\\`' + wsNormals + wsUncommons + ']*'
  // const tokenCoAttempt = /[^\(\)\[\]\{\}\"\@\~\^\;\`\#"][^\(\)\[\]\{\}\"\@\^\;\`]*/

  const primitivesRegex = /^(true|false|nil|##Inf|##-Inf|##NaN)$/
  const simpleSymbolRegex = /^[a-zA-Z*\-_+\/?][a-zA-Z0-9*\-_+?]*$/
  const qualifiedSymbolRegex = /^([a-zA-Z*\-_+?][a-zA-Z0-9*\-_+?]*\.)+([a-zA-Z0-9*\-_+?]+\/)([a-zA-Z*\-_+\/?][a-zA-Z0-9*\-_+?]*)$/

  // const charRegex = /^(\\[\S]+)(\s)/ // NOTE: captures whitespace terminator at the end
  const charRegex = /^\\[\S]+/
  const keywordRegex = /^:{1,2}[a-zA-Z0-1./\-_]+$/
  const numberRegex = /^[+-]?\d+[NM]?$/
  const hexRegex = /^-?0[xX][a-fA-F0-9]+[N]?$/
  const radixRegex = /^-?\d+[rR][a-zA-z0-9]+?$/
  const ratioRegex = /^-?\d+\/\d+?$/
  // TODO: rename these
  const double1Regex = /^[+-]?\d+\.\d+M?$/ // with a period
  const double2Regex = /^[+-]?\d+[eE]-?\d+M?$/ // with exponent
  const double3Regex = /^[+-]?\d+\.\d+[eE][+-]?\d+M?$/ // with period AND exponent

  parsers.token = Choice({
    parsers: [
      Regex({ name: 'token', regex: new RegExp(primitivesRegex) }),
      Regex({ name: 'token', regex: new RegExp(simpleSymbolRegex) }),
      Regex({ name: 'token', regex: new RegExp(qualifiedSymbolRegex) }),
      Regex({ name: 'token', regex: new RegExp(charRegex), groupIdx: 0 }),
      Regex({ name: 'token', regex: new RegExp(keywordRegex) }),
      Regex({ name: 'token', regex: new RegExp(numberRegex) }),
      Regex({ name: 'token', regex: new RegExp(hexRegex) }),
      Regex({ name: 'token', regex: new RegExp(radixRegex) }),
      Regex({ name: 'token', regex: new RegExp(ratioRegex) }),
      Regex({ name: 'token', regex: new RegExp(double1Regex) }),
      Regex({ name: 'token', regex: new RegExp(double2Regex) }),
      Regex({ name: 'token', regex: new RegExp(double3Regex) })
    ]
  })

  // parsers._ws = Regex({ regex: new RegExp('[' + wsNormals + wsWeirdos + ']+') })
  parsers._ws = Choice({
    parsers: [
      Char({ char: ' ' }),
      Char({ char: ',' }),
      Char({ char: '\n' })
    ]
  })

  // parser._gap = Choice({ parsers: ['_ws', 'comment', 'discard']})
  parsers._gap = Choice({ parsers: ['_ws'] })

  // parsers['_form'] = Choice('token', 'string', 'parens', 'brackets', 'braces', 'wrap', 'meta', 'tagged')
  parsers._form = Choice({ parsers: ['token', 'string'] })

  // parsers['source'] = Repeat(Choice('_gap', '_form', AnyChar(name = "error")), name = "source")
  parsers.source = Repeat({
    name: 'source',
    parser: Choice({ parsers: ['_form', '_gap'] })
  })

  function getParser (p) {
    if (isString(p) && parsers[p]) return parsers[p]
    if (isObject(p) && isFunction(p.parse)) return p
    console.error('Unable to getParser:', p)
    return null
  }

  // const kwdTest1 = getParser('token').parse(':foo', 0)
  // console.log(kwdTest1)
  // console.log('222222222222222')

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

  const strRegex1 = Regex({ regex: /^("|#")([\d\D]*)(")$/, name: '.body', groupIdx: 1 })
  const strTest1 = strRegex1.parse('""', 0)
  console.assert(strTest1.text === '')

  // const seqTest1 = Seq({
  //   parsers: [
  //     Char({ char: 'a', name: 'AAA' }),
  //     // Char({ char: 'b', name: 'BBB' }),
  //     Regex({ regex: /b/, name: 'BBB' }),
  //     Char({ char: 'c', name: 'CCC' })]
  // })
  // const seqTestResult = seqTest1.parse('abc', 0)
  // console.log(seqTestResult)
  // console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')

  // ---------------------------------------------------------------------------
  // Public API

  // parses inputTxt and returns an AST structure
  function parseAst (inputTxt) {
    return getParser('source').parse(inputTxt, 0)
  }

  // parses inputTxt (Clojure code) and returns a String of it formatted using
  // Simple Clojure Formatting Rules
  function clojurefmt (inputTxt) {

  }

  // returns a String representation of the AST
  function astToString (ast) {
    return nodeToString(ast, 0)
  }

  const API = {
    astToString,
    clojurefmt,
    parseAst
  }

  return API
})) // end module anonymous scope
