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
    return s.substring(n, 1)
  }

  console.assert(charAt('abc', 0) === 'a')
  console.assert(charAt('abc', 2) === 'b')

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
      text: opts.text,
      toString: () => {
        let s = ''
        return s
      }
    }
  }

  // returns a String representation of an AST Node Object
  function nodeToString (node) {

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
  function Choice () {

  }

  // matches child parser zero or more times
  function Repeat () {
    return {
      parse: function () {

      }
    }
  }

  function AnyChar () {

  }

  function Char (opts) {
    return {
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
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
        const match = txt.match(txt, opts.regex)
        if (match) {
          return Node({ start: pos, end: match.length, name: opts.name, text: match[0] })
        }
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

        const children = []
        const end = pos

        let j = 0
        while (j < arrayLength(opts.parsers)) {
          const parser = opts.parsers[j]
          const possibleNode = parser.parse(txt, end)
          if (possibleNode) {
            appendChildren(children, possibleNode)
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
        Regex({ regex: /#?"/, name: '.open' }),
        // Optional(Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' })),
        Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' }),
        // Optional(Char({ ch: '"', name: '.close' }))
        Char({ ch: '"', name: '.close' })
      ]
    }
  )

  parsers.source = Repeat(Choice('_gap', '_form', AnyChar()))

  // parsers['source'] = Repeat(Choice('_gap', '_form', AnyChar(name = "error")), name = "source")

  function getParser (name) {
    return parsers[name]
  }

  // ---------------------------------------------------------------------------
  // Public API

  // parses inputTxt and returns an AST structure
  function parseAst (inputTxt) {
    return getParser('string').parse(inputTxt, 0)
  }

  // parses inputTxt (Clojure code) and returns a String of it formatted using
  // Simple Clojure Formatting Rules
  function clojurefmt (inputTxt) {

  }

  // takes an AST and returns a String representation of it
  function printAst (ast) {

  }

  const API = {
    parseAst,
    clojurefmt,
    printAst
  }

  return API
})) // end module anonymous scope
