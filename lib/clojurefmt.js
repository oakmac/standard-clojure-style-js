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
      s = s + " '" + node.text + "'"
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
    return {

      parse: (txt, pos) => {
        let i = 0
        const numParsers = arraySize(opts.parsers)
        while (i < numParsers) {
          const parser = getParser(opts.parsers[i])
          const possibleNode = parser.parse(txt, pos)

          if (possibleNode) return possibleNode

          i = i + 1
        }
        return null
      }
    }
  }

  // matches child parser zero or more times
  function Repeat (opts) {
    return {
      parse: (txt, pos) => {
        const children = []
        let end = pos

        let lookForNextNode = true
        while (lookForNextNode) {
          const possibleNode = opts.parser.parse(txt, end)
          if (possibleNode) {
            appendChildren(children, possibleNode)
            end = possibleNode.end
          } else {
            lookForNextNode = false
          }
        }

        let name = null
        if (isString(opts.name) && end > pos) name = opts.name

        return Node({
          start: pos,
          end,
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

  function Optional (opts) {
    return {
      name: opts.parserName,
      parser: null,
      parse: (txt, pos) => {

      }
    }
  }

  // TODO: rename
  function arrayLength (a) {
    return a.length
  }

  // FIXME: write this so it returns the new Array
  function appendChildren (nodesArr, newNode) {
    nodesArr.push(newNode)
  }

  function Regex (opts) {
    return {
      name: opts.name,
      pattern_str: opts.regex,
      parse: (txt, pos) => {
        // console.log('Regex parser happening:', txt, pos)

        const result = opts.regex.exec(txt)
        if (result && result[0]) {
          const result2 = result[0]

          return Node({
            start: pos,
            end: pos + strLen(result2),
            name: opts.name,
            text: result2
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
        Regex({ regex: /#?"/g, name: '.open' }),
        // Optional(Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' })),
        Regex({ regex: /([^"\\]+|\\.)+/g, name: '.body' }),
        //        r'([^"\\]+|\\.)+'
        // Optional(Char({ ch: '"', name: '.close' }))
        Char({ char: '"', name: '.close' })
      ]
    }
  )

  // parsers['_form'] = Choice('token', 'string', 'parens', 'brackets', 'braces', 'wrap', 'meta', 'tagged')
  parsers._form = Choice({ parsers: ['string'] })

  // parsers['source'] = Repeat(Choice('_gap', '_form', AnyChar(name = "error")), name = "source")
  parsers.source = Repeat({
    name: 'source',
    parser: Choice({ parsers: ['_form'] })
  })

  function getParser (p) {
    if (isString(p) && parsers[p]) return parsers[p]
    if (isFunction(p)) return p
    console.error('Unable to getParser:', p)
    return null
  }

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
