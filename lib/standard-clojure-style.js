/* global define */

// standard-clojure-style @@VERSION@@
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
    root.standardClojureStyle = factory()
  }
}(this, function () { // start module anonymous scope
  'use strict'

  // ---------------------------------------------------------------------------
  // Type Predicates

  function isString (s) {
    return typeof s === 'string'
  }

  function isInteger (x) {
    return typeof x === 'number' && isFinite(x) && Math.floor(x) === x
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

  // returns the last item in an Array
  // returns null if the Array has no items
  function arrayLast (a) {
    const s = arraySize(a)
    if (s === 0) {
      return null
    } else {
      return a[dec(s)]
    }
  }

  function dropLast (arr) {
    return arr.splice(0, dec(arraySize(arr)))
  }

  // given an array of objects, returns a new array of the values at obj[key]
  function arrayPluck (arr, key) {
    const arr2 = []
    const size = arraySize(arr)
    let idx = 0
    while (idx < size) {
      const itm = arr[idx]
      arr2.push(itm[key])
      idx = inc(idx)
    }
    return arr2
  }

  function arrayReverse (arr) {
    return arr.reverse()
  }

  function strConcat (s1, s2) {
    return '' + s1 + s2
  }

  function strConcat3 (s1, s2, s3) {
    return '' + s1 + s2 + s3
  }

  function inc (n) {
    return n + 1
  }

  function dec (n) {
    return n - 1
  }

  const runtimeHasObjectKeys = isFunction(Object.keys)

  // runs aFn(key, value) on every key/value pair inside of obj
  function objectForEach (obj, aFn) {
    if (runtimeHasObjectKeys) {
      const keys = Object.keys(obj)
      const numKeys = arraySize(keys)
      let idx = 0
      while (idx < numKeys) {
        const key = keys[idx]
        aFn(key, obj[key])
        idx = inc(idx)
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          aFn(key, obj[key])
        }
      }
    }
  }

  function deleteObjKey (obj, key) {
    delete obj[key]
    return obj
  }

  function alwaysTrue () {
    return true
  }

  // ---------------------------------------------------------------------------
  // Stack Operations

  function stackPeek (arr, idxFromBack) {
    const maxIdx = dec(arraySize(arr))
    if (idxFromBack > maxIdx) {
      return null
    }
    return arr[maxIdx - idxFromBack]
  }

  function stackPop (s) {
    const itm = s.pop()
    return itm
  }

  function stackPush (s, itm) {
    s.push(itm)
    return null
  }

  // ---------------------------------------------------------------------------
  // String Utils

  // returns the character at position n inside of String s (0-indexed)
  function charAt (s, n) {
    return s.charAt(n)
  }

  // Returns the substring of s beginning at startIdx inclusive, and ending
  // at endIdx, exclusive.
  // Pass -1 to endIdx to mean "until the end of the string"
  function substr (s, startIdx, endIdx) {
    const len = strLen(s)
    if (startIdx < 0 || startIdx > len) {
      return ''
    }
    if (endIdx < 0) {
      endIdx = len
    } else if (endIdx > len) {
      endIdx = len
    }
    return s.substring(startIdx, endIdx)
  }

  function repeatString (text, n) {
    let result = ''
    let i = 0
    while (i < n) {
      result = result + text
      i = inc(i)
    }
    return result
  }

  // does String needle exist inside of String s?
  function strIncludes (s, needle) {
    return s.includes(needle)
  }

  function toUpperCase (s) {
    return s.toUpperCase()
  }

  function strJoin (arr, s) {
    return arr.join(s)
  }

  function rtrim (s) {
    return s.trimEnd()
  }

  function strTrim (s) {
    return s.trim()
  }

  function strStartsWith (s, startStr) {
    return s.startsWith(startStr)
  }

  function strEndsWith (s, endStr) {
    return s.endsWith(endStr)
  }

  function isStringWithChars (s) {
    return isString(s) && s !== ''
  }

  function strReplaceFirst (s, find, replace) {
    if (s === '') return ''
    if (find === '') return s
    return s.replace(find, replace)
  }

  const runtimeHasStringReplaceAll = isFunction(''.replaceAll)

  function strReplaceAll (s, find, replace) {
    if (runtimeHasStringReplaceAll) {
      return s.replaceAll(find, replace)
    } else {
      let s2 = s
      while (strIncludes(s2, find)) {
        s2 = strReplaceFirst(s2, find, replace)
      }
      return s2
    }
  }

  function crlfToLf (txt) {
    return txt.replace(/\r\n/g, '\n')
  }

  // ---------------------------------------------------------------------------
  // id generator

  let idCounter = 0

  function createId () {
    idCounter = inc(idCounter)
    return idCounter
  }

  // ---------------------------------------------------------------------------
  // Node Types

  // creates and returns an AST Node Object:
  // - startIdx: start position in String (inclusive)
  // - endIdx: end position in String (exclusive)
  // - children: array of child Nodes
  // - name: name of the Node
  // - text: raw text of the Node (only for terminal nodes like Regex or Strings)
  function Node (opts) {
    return {
      children: opts.children,
      endIdx: opts.endIdx,
      id: createId(),
      name: opts.name,
      startIdx: opts.startIdx,
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
            children: [node],
            endIdx: node.endIdx,
            name: opts.name,
            startIdx: node.startIdx
          })
        }
      }
    }
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
            endIdx: inc(pos),
            name: opts.name,
            startIdx: pos,
            text: charAt(txt, pos)
          })
        } else {
          return null
        }
      }
    }
  }

  // Terminal parser that matches one character.
  function Char (opts) {
    return {
      isTerminal: true,
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
        if (pos < strLen(txt) && charAt(txt, pos) === opts.char) {
          return Node({
            endIdx: inc(pos),
            name: opts.name,
            startIdx: pos,
            text: opts.char
          })
        } else {
          return null
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
              endIdx: inc(pos),
              name: opts.name,
              startIdx: pos,
              text: charAtThisPos
            })
          }
        }

        return null
      }
    }
  }

  // Terminal parser that matches a String
  function StringParser (opts) {
    return {
      name: opts.name,
      parse: (txt, pos) => {
        const len = strLen(opts.str)
        if (pos + len <= strLen(txt)) {
          const strToCompare = substr(txt, pos, pos + len)
          if (opts.str === strToCompare) {
            return Node({
              endIdx: pos + len,
              name: opts.name,
              startIdx: pos,
              text: opts.str
            })
          }
        }

        return null
      }
    }
  }

  function Regex (opts) {
    return {
      name: opts.name,
      parse: (txt, pos) => {
        // NOTE: this might be a perf issue; investigate later
        const innerTxt = substr(txt, pos, -1)
        const result = innerTxt.match(opts.regex)

        // NOTE: uncomment this for development / testing
        // const regexStr = opts.regex.toString()
        // if (!strStartsWith(regexStr, '/^')) {
        //   throw new Error('Regex pattern "' + opts.name + '" does not have input boundary assertion: ' + regexStr)
        // }

        let matchedStr = null
        if (result && isInteger(opts.groupIdx) && isString(result[inc(opts.groupIdx)])) {
          matchedStr = result[inc(opts.groupIdx)]
        } else if (result && isString(result[0])) {
          matchedStr = result[0]
        }

        if (isString(matchedStr)) {
          return Node({
            endIdx: pos + strLen(matchedStr),
            name: opts.name,
            startIdx: pos,
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
      isTerminal: false,
      name: opts.name,
      parse: (txt, pos) => {
        const children = []
        let endIdx = pos

        let j = 0
        const numParsers = arraySize(opts.parsers)
        while (j < numParsers) {
          const parser = opts.parsers[j]

          const possibleNode = parser.parse(txt, endIdx)
          if (possibleNode) {
            appendChildren(children, possibleNode)
            endIdx = possibleNode.endIdx
          } else {
            // else this is not a valid sequence: early return
            return null
          }
          j = inc(j)
        }

        return Node({
          children,
          endIdx,
          name: opts.name,
          startIdx: pos
        })
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

          i = inc(i)
        }
        return null
      }
    }
  }

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
        let endIdx = pos

        let lookForTheNextNode = true
        while (lookForTheNextNode) {
          const node = opts.parser.parse(txt, endIdx)
          if (node) {
            appendChildren(children, node)
            endIdx = node.endIdx
          } else {
            lookForTheNextNode = false
          }
        }

        let name2 = null
        if (isString(opts.name) && endIdx > pos) name2 = opts.name

        if (arraySize(children) >= minMatches) {
          return Node({
            children,
            endIdx,
            name: name2,
            startIdx: pos
          })
        }

        return null
      }
    }
  }

  // Parser that either matches a child parser or skips it
  function Optional (parser) {
    return {
      parse: (txt, pos) => {
        const node = parser.parse(txt, pos)
        if (node && isString(node.text) && node.text !== '') {
          return node
        } else {
          return Node({ startIdx: pos, endIdx: pos })
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
        i = inc(i)
      }
    }
  }

  function getParser (p) {
    if (isString(p) && parsers[p]) {
      return parsers[p]
    } else if (isObject(p) && isFunction(p.parse)) {
      return p
    } else {
      throw new Error('getParser error: could not find parser: ' + p)
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
        Optional(Regex({ regex: /^([^"\\]+|\\.)+/, name: '.body' })),
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
  const charReStr = '\\\\[()\\[\\]{}"@^;`, ]'

  parsers.token = Regex({ name: 'token', regex: new RegExp('^(##)?' + '(' + charReStr + '|' + tokenReStr + ')') })

  parsers._ws = Regex({ name: 'whitespace', regex: new RegExp('^[' + whitespaceChars + ']+') })

  parsers.comment = Regex({ name: 'comment', regex: /^;[^\n]*/ })

  parsers.discard = Seq({
    name: 'discard',
    parsers: [
      StringParser({ name: 'marker', str: '#_' }),
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
          StringParser({ name: '.open', str: '#{' }),
          StringParser({ name: '.open', str: '#::{' }),
          Regex({ name: '.open', regex: /^#:{1,2}[a-zA-Z][a-zA-Z0-9.-_]*{/ })
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
      Regex({ name: '.open', regex: /^(#\?@|#\?|#=|#)?\(/ }),
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
            Regex({ name: '.marker', regex: /^#?\^/ }),
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
      Regex({ name: '.marker', regex: /^(@|'|`|~@|~|#')/ }),
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
  // Format Helpers

  // TODO: some of this information should be calculated when parsing
  // TODO: it would be nice if every paren open / close pair had a unique id

  function nodeContainsText (node) {
    return node && isString(node.text) && node.text !== ''
  }

  function isNodeWithNonBlankText (node) {
    return nodeContainsText(node) && charAt(node.text, 0) !== ' '
  }

  function isNsNode (node) {
    return node.name === 'token' && node.text === 'ns'
  }

  function isUseNode (node) {
    return node && isString(node.text) && (node.text === ':use' || node.text === 'use')
  }

  function isRequireNode (node) {
    return node && isString(node.text) && (node.text === ':require' || node.text === 'require')
  }

  function isRequireMacrosKeyword (node) {
    return node && isString(node.text) && node.text === ':require-macros'
  }

  function isReferClojureNode (node) {
    return node && isString(node.text) && (node.text === ':refer-clojure' || node.text === 'refer-clojure')
  }

  function isExcludeKeyword (node) {
    return node && isString(node.text) && node.text === ':exclude'
  }

  function isOnlyKeyword (node) {
    return node && isString(node.text) && node.text === ':only'
  }

  function isRenameKeyword (node) {
    return node && isString(node.text) && node.text === ':rename'
  }

  function isAsKeyword (node) {
    return node && isString(node.text) && node.text === ':as'
  }

  function isAsAliasKeyword (node) {
    return node && isString(node.text) && node.text === ':as-alias'
  }

  function isReferKeyword (node) {
    return node && isString(node.text) && node.text === ':refer'
  }

  function isDefaultKeyword (node) {
    return node && isString(node.text) && node.text === ':default'
  }

  function isReferMacrosKeyword (node) {
    return node && isString(node.text) && node.text === ':refer-macros'
  }

  function isIncludeMacrosNode (node) {
    return node && isString(node.text) && node.text === ':include-macros'
  }

  function isBooleanNode (node) {
    return node && isString(node.text) && (node.text === 'true' || node.text === 'false')
  }

  function isAllNode (node) {
    return node && isString(node.text) && node.text === ':all'
  }

  function isKeywordNode (node) {
    return node && isString(node.text) && strStartsWith(node.text, ':')
  }

  function isImportNode (node) {
    return node && isString(node.text) && (node.text === ':import' || node.text === 'import')
  }

  function isNewlineNode (n) {
    return n.name === 'whitespace' && isString(n.text) && strIncludes(n.text, '\n')
  }

  function isWhitespaceNode (n) {
    return n.name === 'whitespace' || isNewlineNode(n)
  }

  function isCommaNode (n) {
    return n.name === 'whitespace' && strIncludes(n.text, ',')
  }

  const parenOpenersTbl = {
    '(': true,
    '[': true,
    '{': true,
    '#{': true,
    '#(': true,
    '#?(': true,
    '#?@(': true
  }

  function isParenOpener (n) {
    return n && n.name === '.open' && (parenOpenersTbl[n.text] || isNamespacedMapOpener(n))
  }

  function isParenCloser (n) {
    return n && n.name === '.close' && (n.text === ')' || n.text === ']' || n.text === '}')
  }

  function isTokenNode (n) {
    return n.name === 'token'
  }

  function isTagNode (n) {
    return n.name === '.tag'
  }

  function isStringNode (n) {
    return n && n.name === 'string' && isArray(n.children) && arraySize(n.children) === 3 && n.children[1].name === '.body'
  }

  function getTextFromStringNode (n) {
    return n.children[1].text
  }

  function isCommentNode (n) {
    return n.name === 'comment'
  }

  function isReaderCommentNode (n) {
    return n.name === 'discard'
  }

  function isDiscardNode (n) {
    return n.name === 'marker' && n.text === '#_'
  }

  function isStandardCljIgnoreKeyword (n) {
    return n.name === 'token' && n.text === ':standard-clj/ignore'
  }

  function isStandardCljIgnoreFileKeyword (n) {
    return n.name === 'token' && n.text === ':standard-clj/ignore-file'
  }

  function nodeContainsTextAndNotWhitespace (n) {
    return nodeContainsText(n) && !isWhitespaceNode(n)
  }

  function isMapLiteralOpener (n) {
    return n && n.name === '.open' && n.text === '{'
  }

  function isVectorLiteralOpener (n) {
    return n && n.name === '.open' && n.text === '['
  }

  function isSingleParenOpener (n) {
    return n && n.name === '.open' && n.text === '('
  }

  function isAnonFnOpener (n) {
    return n && n.name === '.open' && n.text === '#('
  }

  function isSetLiteralOpener (n) {
    return n && n.name === '.open' && n.text === '#{'
  }

  function isNamespacedMapOpener (n) {
    return n && n.name === '.open' && strStartsWith(n.text, '#:') && strEndsWith(n.text, '{')
  }

  function isReaderConditionalOpener (n) {
    return n && n.name === '.open' && (n.text === '#?(' || n.text === '#?@(')
  }

  function isOpeningBraceNode (n) {
    return n && n.name === 'braces' && isArray(n.children) && arraySize(n.children) === 3 && n.children[2].name === '.close' && n.children[2].text === '}'
  }

  function commentNeedsSpaceBefore (lineTxt, nodeTxt) {
    return strStartsWith(nodeTxt, ';') && lineTxt !== '' && !strEndsWith(lineTxt, ' ') && !strEndsWith(lineTxt, '(') && !strEndsWith(lineTxt, '[') && !strEndsWith(lineTxt, '{')
  }

  // FIXME: there must be a way to do this with a single regex
  function commentNeedsSpaceInside (commentTxt) {
    return !commentTxt.match(/^;+ /) && !commentTxt.match(/^;+$/)
  }

  function isGenClassNode (node) {
    return node && isString(node.text) && node.text === ':gen-class'
  }

  const genClassKeywordsTbl = {
    ':name': true,
    ':extends': true,
    ':implements': true,
    ':init': true,
    ':constructors': true,
    ':post-init': true,
    ':methods': true,
    ':main': true,
    ':factory': true,
    ':state': true,
    ':exposes': true,
    ':exposes-methods': true,
    ':prefix': true,
    ':impl-ns': true,
    ':load-impl-ns': true
  }

  function isGenClassKeyword (node) {
    return node && isString(node.text) && genClassKeywordsTbl[node.text]
  }

  const genClassKeys = ['name', 'extends', 'implements', 'init', 'constructors', 'post-init', 'methods', 'main', 'factory', 'state', 'exposes', 'exposes-methods', 'prefix', 'impl-ns', 'load-impl-ns']

  // These are all of the :gen-class keys and their value types:
  // https://github.com/clojure/clojure/blob/master/src/clj/clojure/genclass.clj
  //
  // :name aname
  // :extends aclass
  // :implements [interface ...]
  // :init name
  // :constructors {[param-types] [super-param-types], ...}
  // :post-init name
  // :methods [ [name [param-types] return-type], ...]
  // :main boolean
  // :factory name
  // :state name
  // :exposes {protected-field-name {:get name :set name}, ...}
  // :exposes-methods {super-method-name exposed-name, ...}
  // :prefix string
  // :impl-ns name
  // :load-impl-ns boolean
  //
  // TODO: store these as an object instead of enumerating them individually like below?

  // these are all of the possible :gen-class keywords that should have a token value
  // FIXME: we need to confirm this is accurate for :extends, which should be a class name
  function isGenClassNameKey (keyTxt) {
    return (keyTxt === 'name' || keyTxt === 'extends' || keyTxt === 'init' || keyTxt === 'post-init' || keyTxt === 'factory' || keyTxt === 'state' || keyTxt === 'impl-ns')
  }

  function isGenClassBooleanKey (keyTxt) {
    return (keyTxt === 'main' || keyTxt === 'load-impl-ns')
  }

  // recursively runs function f on every node in the tree
  function recurseAllChildren (node, f) {
    f(node)
    if (node.children) {
      const numChildren = arraySize(node.children)
      let i = 0
      while (i < numChildren) {
        const childNode = node.children[i]
        recurseAllChildren(childNode, f)
        i = inc(i)
      }
    }
    return null
  }

  // given a root node, returns a string of all the text found within its children
  function getTextFromRootNode (rootNode) {
    let s = ''
    recurseAllChildren(rootNode, n => {
      // edge case: add '#' text to .tag nodes
      if (isTagNode(n)) {
        s = strConcat(s, '#')
      }
      if (isStringWithChars(n.text)) {
        s = strConcat(s, n.text)
      }
    })
    return s
  }

  // given a root node, returns the last node that contains text from its children
  function getLastChildNodeWithText (rootNode) {
    let lastNode = null
    recurseAllChildren(rootNode, n => {
      if (isStringWithChars(n.text)) {
        lastNode = n
      }
    })
    return lastNode
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

  // searches forward to find the next node that has non-empty text
  // returns the node if found, null otherwise
  function findNextNodeWithText (allNodes, idx) {
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

  // searches forward to find the next node that can be the starting node of an ignore block
  // returns the node if found, null otherwise
  function findNextNonWhitespaceNode (allNodes, idx) {
    const maxIdx = arraySize(allNodes)

    while (idx < maxIdx) {
      const node = allNodes[idx]
      if (!isWhitespaceNode(node)) {
        return node
      }
      idx = inc(idx)
    }

    return null
  }

  // searches backwards in the nodes array to find the previous node with non-empty text
  // note that this node must be before the startingNodeId argument
  // returns the node if found, null otherwise
  // TODO: this could be made into a generic "search backwards with predicate function" function
  function findPrevNodeWithText (allNodes, startIdx, startingNodeId) {
    let keepSearching = true
    let idx = startIdx
    let beforeStartingNode = false

    while (keepSearching) {
      const node = allNodes[idx]

      if (!beforeStartingNode) {
        if (node.id === startingNodeId) {
          beforeStartingNode = true
        }
      } else {
        if (nodeContainsText(node)) {
          return node
        }
      }

      idx = dec(idx)
      if (idx === 0) {
        keepSearching = false
      }
    }

    return null
  }

  // searches forward in the nodes Array to find a node that returns true for predFn(node)
  // and is located after specificNodeId
  // returns the node if found, null otherwise
  function findNextNodeWithPredicateAfterSpecificNode (allNodes, startIdx, predFn, specificNodeId) {
    const maxIdx = arraySize(allNodes)
    let keepSearching = true
    let idx = startIdx
    let afterSpecificNode = false

    while (keepSearching) {
      const node = allNodes[idx]

      if (!afterSpecificNode) {
        if (node.id === specificNodeId) {
          afterSpecificNode = true
        }
      } else {
        if (predFn(node)) {
          return node
        }
      }

      idx = inc(idx)
      if (idx >= maxIdx) {
        keepSearching = false
      }
    }

    return null
  }

  // searches backwards in the nodes Array to find a node that returns true for predFn(node)
  // returns the node if found, null otherwise
  function findPrevNodeWithPredicate (allNodes, startIdx, predFn) {
    let idx = startIdx
    while (idx >= 0) {
      const node = allNodes[idx]

      if (predFn(node)) {
        return node
      }

      idx = dec(idx)
    }

    return null
  }

  // Are all of the nodes on the next line already slurped up or whitespace nodes?
  function areForwardNodesAlreadySlurped (nodes, idx) {
    const nodesSize = arraySize(nodes)
    let result = true
    let keepSearching = true

    while (keepSearching) {
      const node = nodes[idx]

      if (!node) {
        keepSearching = false
      } else if (isNewlineNode(node)) {
        keepSearching = false
      } else if (!isString(node.text)) {
        keepSearching = true
      } else if (node._wasSlurpedUp || isWhitespaceNode(node)) {
        keepSearching = true
      } else {
        keepSearching = false
        result = false
      }

      idx = inc(idx)

      // stop searching if we are at the end of the nodes list
      if (idx >= nodesSize) {
        keepSearching = false
      }
    }

    return result
  }

  function isNewlineNodeWithCommaOnNextLine (n) {
    if (n && isNewlineNode(n)) {
      const tailStr = removeCharsUpToNewline(n.text)
      if (strIncludes(tailStr, ',')) {
        return true
      }
    }

    return false
  }

  // Searches forward in the nodes array for closing paren nodes that could potentially
  // be slurped up to the current line. Includes whitespace and comment nodes as well.
  // returns an array of the nodes (possibly empty)
  function findForwardClosingParens (nodes, idx) {
    const closers = []
    const nodesSize = arraySize(nodes)

    let keepSearching = true
    while (keepSearching) {
      const node = nodes[idx]

      if (!node) {
        keepSearching = false
      } else if (isNewlineNodeWithCommaOnNextLine(node)) {
        keepSearching = false
      } else if (isWhitespaceNode(node) || isParenCloser(node) || isCommentNode(node)) {
        closers.push(node)
        keepSearching = true
      } else {
        keepSearching = false
      }

      idx = inc(idx)

      // stop searching if we are at the end of the nodes list
      if (idx >= nodesSize) {
        keepSearching = false
      }
    }

    return closers
  }

  function numSpacesAfterNewline (newlineNode) {
    return strLen(removeCharsUpToNewline(newlineNode.text))
  }

  // adds _origColIdx to the nodes on this line, stopping when we reach the next newline node
  function recordOriginalColIndexes (nodes, idx) {
    let initialSpaces = 0
    if (isNewlineNode(nodes[idx])) {
      initialSpaces = numSpacesAfterNewline(nodes[idx])
      idx = inc(idx)
    }

    let colIdx = initialSpaces
    const numNodes = arraySize(nodes)
    let keepSearching = true
    while (keepSearching) {
      const node = nodes[idx]

      if (!node) {
        keepSearching = false
      } else if (isNewlineNode(node)) {
        keepSearching = false
      } else {
        const nodeTxt = node.text
        if (isString(nodeTxt) && nodeTxt !== '') {
          const nodeTxtLength = strLen(nodeTxt)
          node._origColIdx = colIdx
          colIdx = colIdx + nodeTxtLength
        } else if (isTagNode(node)) {
          node._origColIdx = colIdx
          colIdx = colIdx + 1
        }
      }

      idx = inc(idx)
      if (idx > numNodes) {
        keepSearching = false
      }
    }

    return nodes
  }

  function removeLeadingWhitespace (txt) {
    return rtrim(strReplaceFirst(txt, /^[, ]*\n+ */, ''))
  }

  // NOTE: this function does not remove newline characters because it only
  // needs to operates on a single line
  function removeTrailingWhitespace (txt) {
    return txt.replace(/[, ]*$/, '')
  }

  function removeCharsUpToNewline (txt) {
    const slices = txt.split('\n')
    return slices[slices.length - 1]
  }

  function txtHasCommasAfterNewline (s) {
    return /\n.*,.*$/.test(s)
  }

  function hasCommasAfterNewline (node) {
    return isWhitespaceNode(node) && txtHasCommasAfterNewline(node.text)
  }

  // Starting from idx, is the next line a line where there is only a comment and nothing else?
  function isNextLineACommentLine (nodes, idx) {
    const n1 = nodes[idx]
    const n2 = nodes[inc(idx)]

    if (n1 && n2) {
      return isCommentNode(n1) && isNewlineNode(n2)
    } else if (n1 && !n2) {
      return isCommentNode(n1)
    } else {
      return false
    }
  }

  // returns the number of spaces to use for indentation at the beginning of a line
  function numSpacesForIndentation (wrappingOpener) {
    if (!wrappingOpener) {
      return 0
    } else {
      const nextNodeAfterOpener = wrappingOpener._nextWithText
      const openerTextLength = strLen(wrappingOpener.text)
      const openerColIdx = wrappingOpener._printedColIdx

      const directlyUnderneathOpener = openerColIdx + openerTextLength

      if (isReaderConditionalOpener(wrappingOpener)) {
        return directlyUnderneathOpener
      } else if (nextNodeAfterOpener && isParenOpener(nextNodeAfterOpener)) {
        if (isMapLiteralOpener(wrappingOpener)) {
          return inc(openerColIdx)
        } else if (isVectorLiteralOpener(wrappingOpener)) {
          return inc(openerColIdx)
        } else if (isSingleParenOpener(wrappingOpener)) {
          return inc(openerColIdx)
        } else if (isSetLiteralOpener(wrappingOpener)) {
          return inc(inc(openerColIdx))
        } else if (isAnonFnOpener(wrappingOpener)) {
          return inc(inc(openerColIdx))
        } else {
          throw new Error('Error inside numSpacesForIndentation function. This condition should be unreachable.')
        }
      } else if (isMapLiteralOpener(wrappingOpener)) {
        return inc(openerColIdx)
      } else if (isVectorLiteralOpener(wrappingOpener)) {
        return inc(openerColIdx)
      } else if (isAnonFnOpener(wrappingOpener)) {
        return openerColIdx + 3
      } else if (isNamespacedMapOpener(wrappingOpener)) {
        return openerColIdx + strLen(wrappingOpener.text)
      } else {
        // else indent two spaces from the wrapping opener
        return inc(inc(openerColIdx))
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Parse Namespace

  function compareSymbolsThenPlatform (itmA, itmB) {
    if (itmA.symbol > itmB.symbol) return 1
    else if (itmA.symbol < itmB.symbol) return -1
    else if (itmA.symbol === itmB.symbol) {
      if (itmA.platform > itmB.platform) return 1
      else if (itmA.platform < itmB.platform) return -1
    }
    return 0
  }

  function compareFromSymbol (itmA, itmB) {
    if (itmA.fromSymbol > itmB.fromSymbol) return 1
    else if (itmA.fromSymbol < itmB.fromSymbol) return -1
    else return 0
  }

  function compareImports (importA, importB) {
    if (importA.package > importB.package) return 1
    else if (importA.package < importB.package) return -1
    else return 0
  }

  function looksLikeAJavaClassname (s) {
    const firstChar = charAt(s, 0)
    return toUpperCase(firstChar) === firstChar
  }

  function parseJavaPackageWithClass (s) {
    const chunks = s.split('.')
    const lastItm = arrayLast(chunks)

    if (looksLikeAJavaClassname(lastItm)) {
      const packageChunks = dropLast(chunks)
      const packageName = strJoin(packageChunks, '.')

      return {
        package: packageName,
        className: lastItm
      }
    } else {
      return {
        package: s,
        className: null
      }
    }
  }

  // returns the next token node inside a :require list / vector, starting from idx
  // returns null if we reach a closing paren
  // FIXME: this will not work with metadata, comments, or reader conditionals
  function findNextTokenInsideRequireForm (nodes, idx) {
    let result = null
    const numNodes = arraySize(nodes)

    let keepSearching = true
    while (keepSearching) {
      const node = nodes[idx]

      if (isParenCloser(node)) {
        keepSearching = false
        result = null
      } else if (isTokenNode(node) && node.text !== '') {
        keepSearching = false
        result = node
      }

      idx = inc(idx)

      if (idx >= numNodes) {
        keepSearching = false
      }
    }

    return result
  }

  function sortNsResult (result, prefixListComments) {
    // sort :refer-clojure :exclude symbols
    if (result.referClojure && isArray(result.referClojure.exclude)) {
      result.referClojure.exclude.sort(compareSymbolsThenPlatform)
    }

    // sort :refer-clojure :only symbols
    if (result.referClojure && isArray(result.referClojure.only)) {
      result.referClojure.only.sort(compareSymbolsThenPlatform)
    }

    // sort :refer-clojure :rename symbols
    if (result.referClojure && isArray(result.referClojure.rename)) {
      result.referClojure.rename.sort(compareFromSymbol)
    }

    // sort :require-macros symbols
    if (isArray(result.requireMacros)) {
      result.requireMacros.sort(compareSymbolsThenPlatform)

      // sort :refer symbols
      let rmIdx = 0
      const numRequireMacrosResults = arraySize(result.requireMacros)
      while (rmIdx < numRequireMacrosResults) {
        if (isArray(result.requireMacros[rmIdx].refer)) {
          result.requireMacros[rmIdx].refer.sort(compareSymbolsThenPlatform)
        }
        rmIdx = inc(rmIdx)
      }
    }

    // sort the requires symbols
    if (isArray(result.requires)) {
      result.requires.sort(compareSymbolsThenPlatform)

      const numRequires = arraySize(result.requires)
      let requiresIdx = 0
      while (requiresIdx < numRequires) {
        const req = result.requires[requiresIdx]

        // attach prefix list comments to the first require with the same id (if possible)
        if (req.prefixListId) {
          if (prefixListComments[req.prefixListId]) {
            if (prefixListComments[req.prefixListId].commentsAbove) {
              req.commentsAbove = prefixListComments[req.prefixListId].commentsAbove
            }
            if (prefixListComments[req.prefixListId].commentAfter) {
              req.commentAfter = prefixListComments[req.prefixListId].commentAfter
            }
            deleteObjKey(prefixListComments, req.prefixListId)
          }

          // delete prefixListIds from the result
          deleteObjKey(req, 'prefixListId')
        }

        // sort :require :refer symbols
        if (isArray(result.requires[requiresIdx].refer)) {
          result.requires[requiresIdx].refer.sort(compareSymbolsThenPlatform)
        }

        // sort :require :exclude symbols
        if (isArray(result.requires[requiresIdx].exclude)) {
          result.requires[requiresIdx].exclude.sort(compareSymbolsThenPlatform)
        }

        // sort :require :rename symbols
        if (isArray(result.requires[requiresIdx].rename)) {
          result.requires[requiresIdx].rename.sort(compareFromSymbol)
        }

        requiresIdx = inc(requiresIdx)
      }
    }

    // convert and sort the imports
    if (result.importsObj) {
      result.imports = []

      objectForEach(result.importsObj, function (packageName, obj) {
        const sortedClasses = obj.classes.sort()
        const importObj = {
          package: packageName,
          classes: sortedClasses
        }

        if (obj.commentsAbove) {
          importObj.commentsAbove = obj.commentsAbove
        }
        if (obj.commentAfter) {
          importObj.commentAfter = obj.commentAfter
        }
        if (obj.platform) {
          importObj.platform = obj.platform
        }

        stackPush(result.imports, importObj)
      })

      deleteObjKey(result, 'importsObj')

      result.imports.sort(compareImports)
    }

    // merge nsMetadata keys
    if (isArray(result.nsMetadata)) {
      const numMetadataItms = arraySize(result.nsMetadata)
      if (numMetadataItms > 1) {
        const metadataObj = {}
        const metadataKeys = []
        let idx = 0
        while (idx < numMetadataItms) {
          const metadataItm = result.nsMetadata[idx]
          metadataObj[metadataItm.key] = metadataItm.value
          stackPush(metadataKeys, metadataItm.key)
          idx = inc(idx)
        }

        const newNsMetadata = []
        let reverseIdx = dec(arraySize(metadataKeys))
        while (reverseIdx >= 0) {
          const key2 = metadataKeys[reverseIdx]

          if (metadataObj[key2]) {
            const metadataItm2 = {}
            metadataItm2.key = key2
            metadataItm2.value = metadataObj[key2]

            deleteObjKey(metadataObj, key2)
            stackPush(newNsMetadata, metadataItm2)
          }

          reverseIdx = dec(reverseIdx)
        }

        result.nsMetadata = arrayReverse(newNsMetadata)
      }
    }

    return result
  }

  // search for a #_ :standard-clj/ignore-file
  // stopping when we reach the first (ns) form
  function lookForIgnoreFile (nodesArr) {
    let keepSearching = true
    const numNodes = arraySize(nodesArr)
    let idx = 0

    while (keepSearching) {
      const node = nodesArr[idx]

      if (isDiscardNode(node)) {
        const next1 = findNextNodeWithPredicateAfterSpecificNode(nodesArr, idx, nodeContainsTextAndNotWhitespace, node.id)
        if (isStandardCljIgnoreFileKeyword(next1)) {
          return true
        } else if (next1.text === '{') {
          const next2 = findNextNodeWithPredicateAfterSpecificNode(nodesArr, idx, nodeContainsTextAndNotWhitespace, next1.id)
          if (isStandardCljIgnoreFileKeyword(next2)) {
            const next3 = findNextNodeWithPredicateAfterSpecificNode(nodesArr, idx, nodeContainsTextAndNotWhitespace, next2.id)
            if (next3.name === 'token' && next3.text === 'true') {
              return true
            }
          }
        }
      } else if (isNsNode(node)) {
        return false
      }

      idx = inc(idx)

      if (idx >= numNodes) {
        keepSearching = false
      }
    }

    return false
  }

  // Extracts namespace information from a flat array of Nodes.
  // Returns a data structure of the ns form that can be used to "print from scratch"
  function parseNs (nodesArr) {
    let idx = 0
    const numNodes = arraySize(nodesArr)
    const result = {
      nsSymbol: null
    }

    let continueParsingNsForm = true
    let nsFormEndsLineIdx = -1
    let parenNestingDepth = 0
    let lineNo = 0
    const parenStack = []
    let insideNsForm = false
    let insideReferClojureForm = false
    let referClojureParenNestingDepth = -1
    let insideRequireForm = false
    let requireFormParenNestingDepth = -1
    let requireFormLineNo = -1
    let insideImportForm = false
    let importFormLineNo = -1
    let nextTextNodeIsNsSymbol = false
    let insideImportPackageList = false
    let collectReferClojureExcludeSymbols = false
    let collectReferClojureOnlySymbols = false
    let collectReferClojureRenameSymbols = false
    let collectRequireExcludeSymbols = false
    let requireExcludeSymbolParenDepth = -1
    let renamesTmp = []
    let importPackageListFirstToken = null
    let nsNodeIdx = -1
    let nsSymbolIdx = -1
    let beyondNsMetadata = false
    let insideNsMetadataHashMap = false
    let insideNsMetadataShorthand = false
    let nextTokenNodeIsMetadataTrueKey = false
    let nextTextNodeIsMetadataKey = false
    let metadataValueNodeId = -1
    let tmpMetadataKey = ''
    let referClojureNodeIdx = -1
    let requireNodeIdx = -1
    let referIdx = -1
    let referParenNestingDepth = -1
    let importNodeIdx = -1
    let importNodeParenNestingDepth = -1
    let activeRequireIdx = -1
    let requireSymbolIdx = -1
    let nextTokenIsAsSymbol = false
    let singleLineComments = []
    let activeImportPackageName = null
    let prevNodeIsNewline = false
    let lineOfLastCommentRecording = -1
    let insidePrefixList = false
    let prefixListParenNestingDepth = -1
    let prefixListPrefix = null
    let prefixListLineNo = -1
    const prefixListComments = {}
    let currentPrefixListId = null
    let insideReaderConditional = false
    let currentReaderConditionalPlatform = null
    let readerConditionalParenNestingDepth = -1
    let insideRequireList = false
    let requireListParenNestingDepth = -1
    let referMacrosIdx = -1
    let referMacrosParenNestingDepth = -1
    let insideIncludeMacros = false
    let activeRequireMacrosIdx = -1
    let insideRequireMacrosForm = false
    let requireMacrosNodeIdx = -1
    let requireMacrosLineNo = -1
    let requireMacrosParenNestingDepth = -1
    let requireMacrosReferNodeIdx = -1
    let requireMacrosAsNodeIdx = -1
    let requireMacrosRenameIdx = -1
    let genClassNodeIdx = -1
    let insideGenClass = false
    let genClassLineNo = -1
    let genClassToggle = 0
    let genClassKeyStr = null
    let genClassValueLineNo = -1
    let insideReaderComment = false
    let idOfLastNodeInsideReaderComment = -1
    let renameIdx = -1
    let renameParenNestingDepth = -1
    let skipNodesUntilWeReachThisId = -1
    let sectionToAttachEolCommentsTo = null
    let nextTokenIsRequireDefaultSymbol = false
    let numSymbolsInsideList = 0

    while (continueParsingNsForm) {
      const node = nodesArr[idx]
      const currentNodeIsNewline = isNewlineNode(node)
      const isTokenNode2 = isTokenNode(node)
      const isTextNode = nodeContainsText(node)
      const nodeHasNonBlankText = isNodeWithNonBlankText(node)

      if (parenNestingDepth >= 1 && isTokenNode2 && nodeHasNonBlankText) {
        numSymbolsInsideList = inc(numSymbolsInsideList)
      }

      if (parenNestingDepth === 1 && isNsNode(node) && numSymbolsInsideList === 1) {
        insideNsForm = true
        nextTextNodeIsNsSymbol = true
        nsNodeIdx = idx
      } else if (insideNsForm && isReferClojureNode(node)) {
        insideReferClojureForm = true
        referClojureParenNestingDepth = parenNestingDepth
        sectionToAttachEolCommentsTo = 'refer-clojure'
        referClojureNodeIdx = idx
        beyondNsMetadata = true
      } else if (insideNsForm && isRequireNode(node)) {
        insideRequireForm = true
        requireFormParenNestingDepth = parenNestingDepth
        requireFormLineNo = lineNo
        requireNodeIdx = idx
        beyondNsMetadata = true
        sectionToAttachEolCommentsTo = 'require'
      } else if (insideNsForm && isImportNode(node)) {
        insideImportForm = true
        importFormLineNo = lineNo
        importNodeIdx = idx
        importNodeParenNestingDepth = parenNestingDepth
        beyondNsMetadata = true
        sectionToAttachEolCommentsTo = 'import'
      } else if (insideNsForm && isRequireMacrosKeyword(node)) {
        insideRequireMacrosForm = true
        requireMacrosNodeIdx = idx
        requireMacrosLineNo = lineNo
        requireMacrosParenNestingDepth = parenNestingDepth
        beyondNsMetadata = true
        sectionToAttachEolCommentsTo = 'require-macros'
      } else if (insideNsForm && isGenClassNode(node)) {
        insideGenClass = true
        genClassNodeIdx = idx
        beyondNsMetadata = true
        sectionToAttachEolCommentsTo = 'gen-class'
      }

      if (isParenOpener(node)) {
        parenNestingDepth = inc(parenNestingDepth)
        stackPush(parenStack, node)

        numSymbolsInsideList = 0

        if (insideNsForm && isReaderConditionalOpener(node)) {
          insideReaderConditional = true
          currentReaderConditionalPlatform = null
          readerConditionalParenNestingDepth = parenNestingDepth
        } else if (insideRequireForm && requireListParenNestingDepth === -1) {
          insideRequireList = true
          requireListParenNestingDepth = parenNestingDepth
        } else if (insideImportForm && parenNestingDepth > importNodeParenNestingDepth) {
          insideImportPackageList = true
        }
      } else if (isParenCloser(node)) {
        parenNestingDepth = dec(parenNestingDepth)
        stackPop(parenStack)

        // We can assume there is only one ns form per file and exit the main
        // loop once we have finished parsing it.
        if (insideNsForm && parenNestingDepth === 0) {
          insideNsForm = false
          nsFormEndsLineIdx = lineNo
        }

        if (insideImportPackageList) {
          insideImportPackageList = false
          importPackageListFirstToken = null
        }
        if (insideRequireForm && parenNestingDepth < requireFormParenNestingDepth) {
          insideRequireForm = false
          requireFormParenNestingDepth = -1
        }
        if (insideReferClojureForm && parenNestingDepth < referClojureParenNestingDepth) {
          insideReferClojureForm = false
          referClojureNodeIdx = -1
        }

        if (insideReferClojureForm && parenNestingDepth <= referClojureParenNestingDepth) {
          collectReferClojureExcludeSymbols = false
          collectReferClojureOnlySymbols = false
          collectReferClojureRenameSymbols = false
        }

        // we are finished collecting :refer symbols
        if (referIdx > 0 && parenNestingDepth <= referParenNestingDepth) {
          referIdx = -1
          referParenNestingDepth = -1
        }

        // we are finished collecting :rename symbols
        if (renameIdx > 0 && parenNestingDepth <= renameParenNestingDepth) {
          renameIdx = -1
          renameParenNestingDepth = -1
        }

        // we are finished collecting require prefix list symbols
        if (insideRequireList && parenNestingDepth < requireListParenNestingDepth) {
          insideRequireList = false
          requireListParenNestingDepth = -1
          nextTokenIsRequireDefaultSymbol = false
        }

        if (insideRequireForm && requireSymbolIdx > 0) {
          requireSymbolIdx = -1
        }

        if (insideRequireForm && insidePrefixList && prefixListParenNestingDepth !== -1 && parenNestingDepth === dec(prefixListParenNestingDepth)) {
          insidePrefixList = false
          prefixListPrefix = null
          prefixListParenNestingDepth = -1
        }

        if (insideReaderConditional && parenNestingDepth === dec(readerConditionalParenNestingDepth)) {
          insideReaderConditional = false
          currentReaderConditionalPlatform = null
          readerConditionalParenNestingDepth = -1
        }
        if (idx > referMacrosIdx && parenNestingDepth <= referMacrosParenNestingDepth) {
          referMacrosIdx = -1
          referMacrosParenNestingDepth = -1
        }
        if (insideImportForm && parenNestingDepth < importNodeParenNestingDepth) {
          insideImportForm = false
          importNodeIdx = -1
          importNodeParenNestingDepth = -1
        }
        if (insideRequireMacrosForm && parenNestingDepth < requireMacrosParenNestingDepth) {
          insideRequireMacrosForm = false
          requireMacrosParenNestingDepth = -1
          requireMacrosNodeIdx = -1
          requireMacrosAsNodeIdx = -1
        }
        if (collectRequireExcludeSymbols && parenNestingDepth < requireExcludeSymbolParenDepth) {
          collectRequireExcludeSymbols = false
          requireExcludeSymbolParenDepth = -1
        }

        requireMacrosReferNodeIdx = -1
        requireMacrosRenameIdx = -1
      }

      const isCommentNode2 = isCommentNode(node)
      const isReaderCommentNode2 = isReaderCommentNode(node)

      if (isReaderCommentNode2) {
        insideReaderComment = true
        const lastNodeOfReaderComment = getLastChildNodeWithText(node)
        idOfLastNodeInsideReaderComment = lastNodeOfReaderComment.id
      }

      if (skipNodesUntilWeReachThisId > 0) {
        if (node.id === skipNodesUntilWeReachThisId) {
          skipNodesUntilWeReachThisId = -1
        }

      // collect ns metadata shorthand
      } else if (insideNsMetadataShorthand) {
        if (node.name === '.marker' && node.text === '^') {
          nextTokenNodeIsMetadataTrueKey = true
        } else if (nextTokenNodeIsMetadataTrueKey && isTokenNode2) {
          if (!result.nsMetadata) {
            result.nsMetadata = []
          }

          const metadataObj = {}
          metadataObj.key = node.text
          metadataObj.value = 'true'

          stackPush(result.nsMetadata, metadataObj)

          nextTokenNodeIsMetadataTrueKey = false
          insideNsMetadataShorthand = false
        }

      // collect ns metadata inside a hash map literal
      } else if (insideNsMetadataHashMap) {
        if (nextTextNodeIsMetadataKey && node.name === '.close' && node.text === '}') {
          insideNsMetadataHashMap = false
        } else if (!nextTextNodeIsMetadataKey && node.name === '.open' && node.text === '{') {
          nextTextNodeIsMetadataKey = true
        } else if (nextTextNodeIsMetadataKey && isTokenNode2) {
          if (!result.nsMetadata) {
            result.nsMetadata = []
          }

          tmpMetadataKey = node.text
          nextTextNodeIsMetadataKey = false

          // the next node should be a whitespace node, then collect the value for this key
          const nextNonWhitespaceNode = findNextNonWhitespaceNode(nodesArr, inc(idx))
          metadataValueNodeId = nextNonWhitespaceNode.id
        } else if (node.id === metadataValueNodeId) {
          const metadataObj = {}
          metadataObj.key = tmpMetadataKey
          metadataObj.value = getTextFromRootNode(node)

          stackPush(result.nsMetadata, metadataObj)

          tmpMetadataKey = ''
          nextTextNodeIsMetadataKey = true
          metadataValueNodeId = -1

          // skip any forward nodes that we have just collected as text
          let skipCandidate = node
          while (skipCandidate) {
            if (isArray(skipCandidate.children)) {
              skipCandidate = arrayLast(skipCandidate.children)
              skipNodesUntilWeReachThisId = skipCandidate.id
            } else {
              skipCandidate = null
            }
          }
        }

      // collect ns metadata before we hit the nsSymbol
      } else if (!insideNsMetadataHashMap && !insideNsMetadataShorthand && insideNsForm && nsSymbolIdx < 0 && node.name === 'meta') {
        const markerNode = findNextNodeWithText(nodesArr, inc(idx))

        // NOTE: this should always be true
        if (markerNode.text === '^') {
          const nodeAfterMarker = findNextNodeWithText(nodesArr, inc(inc(idx)))

          if (nodeAfterMarker && nodeAfterMarker.text === '{') {
            insideNsMetadataHashMap = true
          } else if (nodeAfterMarker && isTokenNode(nodeAfterMarker)) {
            insideNsMetadataShorthand = true
          }
        }

      // collect metadata hash map after the ns symbol
      } else if (insideNsForm && idx > nsNodeIdx && parenNestingDepth >= 1 && !beyondNsMetadata && !insideReaderComment && !insideNsMetadataShorthand && !insideNsMetadataHashMap && node.name === '.open' && node.text === '{') {
        insideNsMetadataHashMap = true
        nextTextNodeIsMetadataKey = true

      // collect the ns symbol
      } else if (idx > nsNodeIdx && nextTextNodeIsNsSymbol && isTokenNode2 && isTextNode) {
        result.nsSymbol = node.text
        nsSymbolIdx = idx
        nextTextNodeIsNsSymbol = false

      // collect reader conditional platform keyword
      } else if (insideReaderConditional && parenNestingDepth === readerConditionalParenNestingDepth && isKeywordNode(node)) {
        currentReaderConditionalPlatform = node.text

      // collect single-line comments
      } else if (insideNsForm && idx > nsNodeIdx && prevNodeIsNewline && isCommentNode2) {
        stackPush(singleLineComments, node.text)

      // collect reader macro comment line(s)
      } else if (insideNsForm && idx > nsNodeIdx && prevNodeIsNewline && isReaderCommentNode2) {
        stackPush(singleLineComments, getTextFromRootNode(node))

      // collect comments at the end of a line
      } else if (idx > nsNodeIdx && !prevNodeIsNewline && (isCommentNode2 || isReaderCommentNode2)) {
        let commentAtEndOfLine = null
        if (isCommentNode2) {
          commentAtEndOfLine = node.text
        } else {
          commentAtEndOfLine = getTextFromRootNode(node)
        }

        if (prefixListLineNo === lineNo) {
          if (!prefixListComments[currentPrefixListId]) {
            prefixListComments[currentPrefixListId] = {}
          }
          prefixListComments[currentPrefixListId].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (requireFormLineNo === lineNo && activeRequireIdx < 0) {
          result.requireCommentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (requireFormLineNo === lineNo && activeRequireIdx >= 0) {
          result.requires[activeRequireIdx].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (sectionToAttachEolCommentsTo === 'refer-clojure' && result.referClojure) {
          result.referClojureCommentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (importFormLineNo === lineNo && !result.importsObj) {
          result.importCommentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (importFormLineNo === lineNo) {
          result.importsObj[activeImportPackageName].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (requireMacrosLineNo === lineNo) {
          result.requireMacros[activeRequireMacrosIdx].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (genClassLineNo === lineNo) {
          result.genClass.commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (genClassValueLineNo === lineNo) {
          result.genClass[genClassKeyStr].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        }

        if (!insideNsForm && lineNo === lineOfLastCommentRecording) {
          result.commentOutsideNsForm = commentAtEndOfLine
        }

      // discard nodes that are inside a reader comment
      } else if (insideReaderComment) {
        if (node.id === idOfLastNodeInsideReaderComment) {
          insideReaderComment = false
          idOfLastNodeInsideReaderComment = -1
        }

      // attach comments to the :require form
      } else if (insideRequireForm && idx === requireNodeIdx && arraySize(singleLineComments) > 0) {
        result.requireCommentsAbove = singleLineComments
        singleLineComments = []

      // attach comments to the :import form
      } else if (insideImportForm && idx === importNodeIdx && arraySize(singleLineComments) > 0) {
        result.importCommentsAbove = singleLineComments
        singleLineComments = []

      // attach comments to the :refer-clojure form
      } else if (insideReferClojureForm && idx === referClojureNodeIdx && arraySize(singleLineComments) > 0) {
        result.referClojureCommentsAbove = singleLineComments
        singleLineComments = []

      // collect the docstring
      } else if (insideNsForm && idx > nsNodeIdx && parenNestingDepth === 1 && !beyondNsMetadata && !insideNsMetadataShorthand && !insideNsMetadataHashMap && isStringNode(node)) {
        result.docstring = getTextFromStringNode(node)

      // collect :refer-clojure :exclude
      } else if (insideReferClojureForm && idx > referClojureNodeIdx && isExcludeKeyword(node)) {
        if (!result.referClojure) {
          result.referClojure = {}
        }
        if (!isArray(result.referClojure.exclude)) {
          result.referClojure.exclude = []
        }
        collectReferClojureExcludeSymbols = true

      // collect :refer-clojure :exclude symbols
      } else if (idx > inc(referClojureNodeIdx) && collectReferClojureExcludeSymbols && parenNestingDepth >= 3 && isTokenNode2 && isTextNode && result.referClojure && isArray(result.referClojure.exclude)) {
        const symbolObj = {}
        symbolObj.symbol = node.text

        if (insideReaderConditional && currentReaderConditionalPlatform) {
          symbolObj.platform = currentReaderConditionalPlatform
        }

        stackPush(result.referClojure.exclude, symbolObj)

      // collect :refer-clojure :only
      } else if (insideReferClojureForm && idx > referClojureNodeIdx && isOnlyKeyword(node)) {
        if (!result.referClojure) {
          result.referClojure = {}
        }
        result.referClojure.only = []
        collectReferClojureOnlySymbols = true

      // collect :refer-clojure :only symbols
      } else if (idx > inc(referClojureNodeIdx) && collectReferClojureOnlySymbols && parenNestingDepth >= 3 && isTokenNode2 && isTextNode && result.referClojure && isArray(result.referClojure.only)) {
        const symbolObj = {
          symbol: node.text
        }

        // add reader conditional platform if necessary
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          symbolObj.platform = currentReaderConditionalPlatform
        }

        stackPush(result.referClojure.only, symbolObj)

      // collect :refer-clojure :rename
      } else if (insideReferClojureForm && idx > referClojureNodeIdx && isRenameKeyword(node)) {
        if (!result.referClojure) {
          result.referClojure = {}
        }
        result.referClojure.rename = []
        collectReferClojureRenameSymbols = true

      // collect :refer-clojure :rename symbols
      } else if (idx > inc(referClojureNodeIdx) && collectReferClojureRenameSymbols && parenNestingDepth >= 3 && isTokenNode2 && isTextNode && result.referClojure && isArray(result.referClojure.rename)) {
        stackPush(renamesTmp, node.text)

        if (arraySize(renamesTmp) === 2) {
          const itm = {}
          itm.fromSymbol = renamesTmp[0]
          itm.toSymbol = renamesTmp[1]

          if (insideReaderConditional && currentReaderConditionalPlatform) {
            itm.platform = currentReaderConditionalPlatform
          }

          stackPush(result.referClojure.rename, itm)

          renamesTmp = []
        }

      // is this :require :as ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isAsKeyword(node)) {
        nextTokenIsAsSymbol = true

      // collect the require :as symbol
      } else if (idx > requireNodeIdx && insideRequireForm && nextTokenIsAsSymbol && isTokenNode2 && isTextNode) {
        nextTokenIsAsSymbol = false
        result.requires[activeRequireIdx].as = node.text

      // collect :require-macros :refer symbols
      } else if (insideRequireMacrosForm && requireMacrosReferNodeIdx !== -1 && idx > requireMacrosReferNodeIdx && isTokenNode2 && isTextNode) {
        if (!isArray(result.requireMacros[activeRequireMacrosIdx].refer)) {
          result.requireMacros[activeRequireMacrosIdx].refer = []
        }

        const referObj = {}
        referObj.symbol = node.text

        if (insideReaderConditional && currentReaderConditionalPlatform) {
          referObj.platform = currentReaderConditionalPlatform
        }

        stackPush(result.requireMacros[activeRequireMacrosIdx].refer, referObj)

      // collect :require-macros :as symbol
      } else if (insideRequireMacrosForm && requireMacrosAsNodeIdx !== -1 && idx > requireMacrosAsNodeIdx && isTokenNode2 && isTextNode) {
        result.requireMacros[activeRequireMacrosIdx].as = node.text
        requireMacrosAsNodeIdx = -1

      // collect :require-macros :rename
      } else if (insideRequireMacrosForm && requireMacrosRenameIdx !== -1 && idx > requireMacrosRenameIdx && isTokenNode2 && isTextNode) {
        if (!isArray(result.requireMacros[activeRequireMacrosIdx].rename)) {
          result.requireMacros[activeRequireMacrosIdx].rename = []
        }

        stackPush(renamesTmp, node.text)

        if (arraySize(renamesTmp) === 2) {
          const itm = {}
          itm.fromSymbol = renamesTmp[0]
          itm.toSymbol = renamesTmp[1]
          if (insideReaderConditional && currentReaderConditionalPlatform) {
            itm.platform = currentReaderConditionalPlatform
          }
          stackPush(result.requireMacros[activeRequireMacrosIdx].rename, itm)
          renamesTmp = []
        }

      // :require-macros :refer
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isReferKeyword(node)) {
        requireMacrosReferNodeIdx = idx

      // :require-macros :as
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isAsKeyword(node)) {
        requireMacrosAsNodeIdx = idx

      // :require-macros :rename
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isRenameKeyword(node)) {
        requireMacrosRenameIdx = idx
        renamesTmp = []

      // collect :require-macros symbol
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isTokenNode2 && isTextNode) {
        if (!result.requireMacros) {
          result.requireMacros = []

          // add commentsAbove to the :require-macros form if possible
          if (arraySize(singleLineComments) > 0) {
            result.requireMacrosCommentsAbove = singleLineComments
            singleLineComments = []
          }
        }

        const reqObj = {
          symbol: node.text
        }

        // store the comments above this line
        if (arraySize(singleLineComments) > 0) {
          reqObj.commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add reader conditional platform
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          reqObj.platform = currentReaderConditionalPlatform
        }

        stackPush(result.requireMacros, reqObj)
        activeRequireMacrosIdx = inc(activeRequireMacrosIdx)
        requireMacrosLineNo = lineNo

      // is this :include-macros ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isIncludeMacrosNode(node)) {
        insideIncludeMacros = true

      // collect :include-macros boolean
      } else if (insideIncludeMacros && isTokenNode2 && isBooleanNode(node)) {
        if (node.text === 'true') {
          result.requires[activeRequireIdx].includeMacros = true
        } else {
          result.requires[activeRequireIdx].includeMacros = false
        }

        insideIncludeMacros = false

      // is this :refer-macros ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isReferMacrosKeyword(node)) {
        referMacrosIdx = idx
        referMacrosParenNestingDepth = parenNestingDepth

      // collect :refer-macros symbols
      } else if (idx > referMacrosIdx && insideRequireForm && parenNestingDepth === inc(referMacrosParenNestingDepth) && isTokenNode2 && isTextNode) {
        if (!isArray(result.requires[activeRequireIdx].referMacros)) {
          result.requires[activeRequireIdx].referMacros = []
        }
        stackPush(result.requires[activeRequireIdx].referMacros, node.text)

      // is this :require :refer ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isReferKeyword(node)) {
        referIdx = idx
        referParenNestingDepth = parenNestingDepth

      // is this :require :default ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isDefaultKeyword(node)) {
        nextTokenIsRequireDefaultSymbol = true

      // collect :require :exclude symbols
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && collectRequireExcludeSymbols && parenNestingDepth > requireExcludeSymbolParenDepth) {
        const symbolObj = {
          symbol: node.text
        }
        stackPush(result.requires[activeRequireIdx].exclude, symbolObj)

      // is this :require :exclude ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isExcludeKeyword(node)) {
        result.requires[activeRequireIdx].exclude = []
        collectRequireExcludeSymbols = true
        requireExcludeSymbolParenDepth = parenNestingDepth

      // :require :as-alias
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isAsAliasKeyword(node)) {
        const nextSymbol = findNextTokenInsideRequireForm(nodesArr, inc(idx))
        result.requires[activeRequireIdx].asAlias = nextSymbol.text

      // collect :refer :all
      } else if (idx > referIdx && insideRequireForm && isTokenNode2 && isAllNode(node)) {
        result.requires[activeRequireIdx].refer = 'all'

      // collect :refer :default symbol
      } else if (idx > referIdx && insideRequireForm && isTokenNode2 && nextTokenIsRequireDefaultSymbol) {
        result.requires[activeRequireIdx].default = node.text
        nextTokenIsRequireDefaultSymbol = false

      // :rename keyword inside a :require list
      } else if (insideRequireForm && insideRequireList && renameIdx === -1 && isRenameKeyword(node)) {
        renameIdx = idx
        renameParenNestingDepth = parenNestingDepth
        renamesTmp = []

      // collect :require renames
      } else if (insideRequireForm && insideRequireList && renameIdx > 0 && idx > renameIdx && parenNestingDepth > renameParenNestingDepth && isTokenNode2 && isTextNode) {
        stackPush(renamesTmp, node.text)

        if (arraySize(renamesTmp) === 2) {
          const itm = {}
          itm.fromSymbol = renamesTmp[0]
          itm.toSymbol = renamesTmp[1]

          if (insideReaderConditional && currentReaderConditionalPlatform) {
            itm.platform = currentReaderConditionalPlatform
          }

          if (!isArray(result.requires[activeRequireIdx].rename)) {
            result.requires[activeRequireIdx].rename = []
          }

          stackPush(result.requires[activeRequireIdx].rename, itm)

          renamesTmp = []
        }

      // collect :require :refer symbols
      } else if (idx > referIdx && insideRequireForm && referParenNestingDepth !== -1 && parenNestingDepth > referParenNestingDepth && isTokenNode2 && isTextNode) {
        if (!isArray(result.requires[activeRequireIdx].refer)) {
          result.requires[activeRequireIdx].refer = []
        }
        const referObj = {
          symbol: node.text
        }
        stackPush(result.requires[activeRequireIdx].refer, referObj)

      // collect :require symbol not inside of a list / vector
      } else if (insideRequireForm && !insideRequireList && idx > requireNodeIdx && isTokenNode2 && isTextNode && requireSymbolIdx === -1 && !isKeywordNode(node)) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        const requireObj = {
          symbol: node.text
        }
        stackPush(result.requires, requireObj)
        activeRequireIdx = inc(activeRequireIdx)
        requireFormLineNo = lineNo

        // attach comments from the lines above this require
        if (arraySize(singleLineComments) > 0) {
          result.requires[activeRequireIdx].commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add platform if we are inside a Reader Conditional
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          result.requires[activeRequireIdx].platform = currentReaderConditionalPlatform
        }

      // collect symbols inside of a prefix list
      } else if (insidePrefixList && isTokenNode2 && isTextNode) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        const namespace = strConcat3(prefixListPrefix, '.', node.text)

        const requireObj = {
          prefixListId: currentPrefixListId,
          symbol: namespace
        }
        stackPush(result.requires, requireObj)
        activeRequireIdx = inc(activeRequireIdx)
        requireSymbolIdx = idx
        requireFormLineNo = lineNo

      // collect :require symbol inside of a list / vector
      } else if (insideRequireForm && insideRequireList && idx > requireNodeIdx && referIdx === -1 && renameIdx === -1 && isTokenNode2 && isTextNode && requireSymbolIdx === -1 && !isKeywordNode(node)) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        // five possibilities for a :require import:
        // - require symbol not inside of list / vector
        // - require symbol inside a list / vector, followed by nothing
        // - require symbol for a prefix list (need to examine the following symbols in order to know this)
        // - require symbol followed by :as
        // - require symbol followed by :refer

        const nextTokenInsideRequireForm = findNextTokenInsideRequireForm(nodesArr, inc(idx))
        const isPrefixList = nextTokenInsideRequireForm && !isKeywordNode(nextTokenInsideRequireForm)

        if (isPrefixList) {
          const prefixListId = createId()
          insidePrefixList = true
          prefixListParenNestingDepth = parenNestingDepth
          prefixListLineNo = lineNo
          prefixListPrefix = node.text
          currentPrefixListId = prefixListId

          // store the comments above this line
          // we will attach them to the first ns imported by this prefix list later
          if (arraySize(singleLineComments) > 0) {
            const itm = {
              commentsAbove: singleLineComments
            }
            prefixListComments[prefixListId] = itm
            singleLineComments = []
          }
        } else {
          const requireObj = {
            symbol: node.text
          }
          stackPush(result.requires, requireObj)
          activeRequireIdx = inc(activeRequireIdx)
          requireSymbolIdx = idx
          requireFormLineNo = lineNo
          insidePrefixList = false
          prefixListLineNo = -1

          // attach comments from the lines above this require
          if (arraySize(singleLineComments) > 0) {
            result.requires[activeRequireIdx].commentsAbove = singleLineComments
            singleLineComments = []
          }

          // add platform if we are inside a Reader Conditional
          if (insideReaderConditional && currentReaderConditionalPlatform) {
            result.requires[activeRequireIdx].platform = currentReaderConditionalPlatform
          }
        }

      // collect require Strings in ClojureScript
      } else if (insideRequireForm && insideRequireList && idx > requireNodeIdx && isStringNode(node)) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        const requireObj = {}
        stackPush(result.requires, requireObj)
        activeRequireIdx = inc(activeRequireIdx)
        requireFormLineNo = lineNo

        // attach comments from the lines above this require
        if (arraySize(singleLineComments) > 0) {
          result.requires[activeRequireIdx].commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add platform if we are inside a Reader Conditional
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          result.requires[activeRequireIdx].platform = currentReaderConditionalPlatform
        }

        result.requires[activeRequireIdx].symbol = strConcat3('"', getTextFromStringNode(node), '"')
        result.requires[activeRequireIdx].symbolIsString = true

      // collect :import packages not inside of a list or vector
      } else if (insideImportForm && idx > importNodeIdx && !insideImportPackageList && isTokenNode2 && isTextNode) {
        if (!result.importsObj) {
          result.importsObj = {}
        }

        const packageParsed = parseJavaPackageWithClass(node.text)
        const packageName = packageParsed.package
        const className = packageParsed.className

        if (!result.importsObj[packageName]) {
          result.importsObj[packageName] = {
            classes: []
          }
        }

        stackPush(result.importsObj[packageName].classes, className)
        activeImportPackageName = packageName
        importFormLineNo = lineNo

        if (arraySize(singleLineComments) > 0) {
          result.importsObj[packageName].commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add platform if we are inside a Reader Conditional
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          result.importsObj[packageName].platform = currentReaderConditionalPlatform
        }

      // collect :import classes inside of a list or vector
      } else if (insideImportPackageList && isTokenNode2 && isTextNode) {
        if (!importPackageListFirstToken) {
          const packageName = node.text
          importPackageListFirstToken = packageName
          activeImportPackageName = packageName
          importFormLineNo = lineNo

          if (!result.importsObj) {
            result.importsObj = {}
          }

          if (!result.importsObj[packageName]) {
            result.importsObj[packageName] = {
              classes: []
            }
          }

          if (arraySize(singleLineComments) > 0) {
            result.importsObj[packageName].commentsAbove = singleLineComments
            singleLineComments = []
          }

          // add platform if we are inside a Reader Conditional
          if (insideReaderConditional && currentReaderConditionalPlatform) {
            result.importsObj[packageName].platform = currentReaderConditionalPlatform
          }
        } else {
          stackPush(result.importsObj[importPackageListFirstToken].classes, node.text)
        }
      // we are on the :gen-class node
      } else if (insideGenClass && idx === genClassNodeIdx) {
        result.genClass = {}
        result.genClass.isEmpty = true

        // add platform if we are inside a Reader Conditional
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          result.genClass.platform = currentReaderConditionalPlatform
        }

        // add commentsAbove
        if (arraySize(singleLineComments) > 0) {
          result.genClass.commentsAbove = singleLineComments
          singleLineComments = []
        }

        genClassLineNo = lineNo
      // :gen-class key like :main, :name, :state, :init, etc
      } else if (insideGenClass && idx > genClassNodeIdx && isTextNode && genClassToggle === 0 && isGenClassKeyword(node)) {
        result.genClass.isEmpty = false

        genClassKeyStr = substr(node.text, 1, -1)
        result.genClass[genClassKeyStr] = {}

        // add commentsAbove if possible
        if (arraySize(singleLineComments) > 0) {
          result.genClass[genClassKeyStr].commentsAbove = singleLineComments
          singleLineComments = []
        }

        // genClassToggle = 0 means we are looking for a key
        // genClassToggle = 1 means we are looking for a value
        genClassToggle = 1

      // :gen-class :prefix value
      } else if (insideGenClass && idx > genClassNodeIdx && genClassToggle === 1 && genClassKeyStr === 'prefix' && isStringNode(node)) {
        result.genClass.prefix.value = strConcat3('"', getTextFromStringNode(node), '"')
        genClassToggle = 0
        genClassValueLineNo = lineNo

      // other :gen-class values
      } else if (insideGenClass && idx > genClassNodeIdx && isTextNode && isTokenNode2 && genClassToggle === 1) {
        // :name, :extends, :init, :post-init, :factory, :state, :impl-ns
        if (isGenClassNameKey(genClassKeyStr)) {
          result.genClass[genClassKeyStr].value = node.text
          genClassToggle = 0
          genClassValueLineNo = lineNo
        // :main, :load-impl-ns
        } else if (isGenClassBooleanKey(genClassKeyStr)) {
          if (node.text === 'true') {
            result.genClass[genClassKeyStr].value = true
            genClassToggle = 0
            genClassValueLineNo = lineNo
          } else if (node.text === 'false') {
            result.genClass[genClassKeyStr].value = false
            genClassToggle = 0
            genClassValueLineNo = lineNo
          } else {
            // FIXME: throw here? this is almost certainly an error in the source
          }
        }
        // FIXME: we need to handle :implements, :constructors, :methods, :exposes, :exposes-methods, here

      // throw an error if we encounter :use
      } else if (insideNsForm && isTokenNode2 && parenNestingDepth >= 1 && isUseNode(node)) {
        throw new Error('Standard Clojure Style does not support :use inside of the ns form. Please refactor with :require as appropriate.')
      }

      // increment the lineNo for the next node if we are on a newline node
      // NOTE: this lineNo variable does not account for newlines inside of multi-line strings
      // but we can ignore that for the purposes of ns parsing here
      if (currentNodeIsNewline) {
        lineNo = inc(lineNo)
      }
      prevNodeIsNewline = currentNodeIsNewline

      // increment to look at the next node
      idx = inc(idx)

      // exit if we are at the end of the nodes
      if (idx >= numNodes) {
        continueParsingNsForm = false
      // exit if we have finished parsing the ns form
      } else if (nsNodeIdx > 0 && !insideNsForm && lineNo >= inc(inc(nsFormEndsLineIdx))) {
        continueParsingNsForm = false
      }
    } // end main ns parsing node loop

    return sortNsResult(result, prefixListComments)
  }

  // ---------------------------------------------------------------------------
  // Formatter

  // adds the lines from a commentsAbove array to outTxt if possible
  // returns outTxt (String)
  function printCommentsAbove (outTxt, commentsAbove, indentationStr) {
    if (isArray(commentsAbove)) {
      const numCommentLines = arraySize(commentsAbove)
      let idx = 0
      while (idx < numCommentLines) {
        const commentLine = strConcat(indentationStr, commentsAbove[idx])
        outTxt = strConcat3(outTxt, commentLine, '\n')
        idx = inc(idx)
      }
    }
    return outTxt
  }

  // returns a sorted array of platform strings found on items in arr
  function getPlatformsFromArray (arr) {
    let hasDefault = false
    const platforms = {}
    const numItms = arraySize(arr)
    let idx = 0
    while (idx < numItms) {
      const itm = arr[idx]
      if (itm.platform) {
        if (itm.platform === ':default') {
          hasDefault = true
        } else {
          platforms[itm.platform] = true
        }
      }

      idx = inc(idx)
    }

    const platformsArr = []
    objectForEach(platforms, function (platformStr, _ignore) {
      stackPush(platformsArr, platformStr)
    })

    platformsArr.sort()

    if (hasDefault) {
      stackPush(platformsArr, ':default')
    }

    return platformsArr
  }

  // returns true if there are only one require per platform
  // this lets us use the standard reader conditional #?( instead of
  // the splicing reader conditional #?@(
  function onlyOneRequirePerPlatform (reqs) {
    const platformCounts = {}
    const numReqs = arraySize(reqs)
    let idx = 0
    let keepSearching = true
    let result = true
    while (keepSearching) {
      if (reqs[idx] && reqs[idx].platform && isString(reqs[idx].platform)) {
        const platform = reqs[idx].platform
        if (platform !== '') {
          if (platformCounts[platform]) {
            keepSearching = false
            result = false
          } else {
            platformCounts[platform] = 1
          }
        }
      }

      idx = inc(idx)
      if (idx > numReqs) {
        keepSearching = false
      }
    }

    return result
  }

  // Returns an array of Objects filtered on the .platform key
  function filterOnPlatform (arr, platform) {
    const filteredReqs = []
    let idx = 0
    const numReqs = arraySize(arr)
    while (idx < numReqs) {
      const itm = arr[idx]
      if (platform === false && !itm.platform) {
        stackPush(filteredReqs, itm)
      } else if (isString(itm.platform) && itm.platform === platform) {
        stackPush(filteredReqs, arr[idx])
      }

      idx = inc(idx)
    }
    return filteredReqs
  }

  function formatRequireLine (req, initialIndentation) {
    let outTxt = ''

    outTxt = printCommentsAbove(outTxt, req.commentsAbove, initialIndentation)

    outTxt = strConcat(outTxt, initialIndentation)
    outTxt = strConcat3(outTxt, '[', req.symbol)

    if (isString(req.as) && req.as !== '') {
      outTxt = strConcat3(outTxt, ' :as ', req.as)
    } else if (isString(req.asAlias) && req.asAlias !== '') {
      outTxt = strConcat3(outTxt, ' :as-alias ', req.asAlias)
    } else if (isString(req.default) && req.default !== '') {
      outTxt = strConcat3(outTxt, ' :default ', req.default)
    }

    // NOTE: this will not work if the individual :refer symbols are wrapped in a reader conditional
    if (isArray(req.refer) && arraySize(req.refer) > 0) {
      outTxt = strConcat(outTxt, ' :refer [')
      const referSymbols = arrayPluck(req.refer, 'symbol')
      outTxt = strConcat(outTxt, strJoin(referSymbols, ' '))
      outTxt = strConcat(outTxt, ']')
    } else if (req.refer === 'all') {
      outTxt = strConcat(outTxt, ' :refer :all')
    }

    // NOTE: this will not work if the individual :exclude symbols are wrapped in a reader conditional
    if (isArray(req.exclude) && arraySize(req.exclude) > 0) {
      outTxt = strConcat(outTxt, ' :exclude [')
      const excludeSymbols = arrayPluck(req.exclude, 'symbol')
      outTxt = strConcat(outTxt, strJoin(excludeSymbols, ' '))
      outTxt = strConcat(outTxt, ']')
    }

    if (req.includeMacros === true) {
      outTxt = strConcat(outTxt, ' :include-macros true')
    } else if (req.includeMacros === false) {
      outTxt = strConcat(outTxt, ' :include-macros false')
    }

    if (isArray(req.referMacros) && arraySize(req.referMacros) > 0) {
      outTxt = strConcat(outTxt, ' :refer-macros [')
      outTxt = strConcat(outTxt, strJoin(req.referMacros, ' '))
      outTxt = strConcat(outTxt, ']')
    }

    if (isArray(req.rename) && arraySize(req.rename) > 0) {
      outTxt = strConcat(outTxt, ' :rename {')
      outTxt = strConcat(outTxt, formatRenamesList(req.rename))
      outTxt = strConcat(outTxt, '}')
    }

    outTxt = strConcat(outTxt, ']')

    return outTxt
  }

  // returns an array of the available :refer-clojure keys
  // valid options are: :exclude, :only, :rename
  function getReferClojureKeys (referClojure) {
    const keys = []
    if (referClojure) {
      if (referClojure.exclude) {
        stackPush(keys, ':exclude')
      }
      if (referClojure.only) {
        stackPush(keys, ':only')
      }
      if (referClojure.rename) {
        stackPush(keys, ':rename')
      }
    }
    return keys
  }

  function formatKeywordFollowedByListOfSymbols (kwd, symbols) {
    let s = strConcat(kwd, ' [')
    s = strConcat(s, strJoin(symbols, ' '))
    s = strConcat(s, ']')

    return s
  }

  function formatRenamesList (itms) {
    let s = ''
    const numItms = arraySize(itms)
    let idx = 0
    while (idx < numItms) {
      s = strConcat(s, itms[idx].fromSymbol)
      s = strConcat(s, ' ')
      s = strConcat(s, itms[idx].toSymbol)
      if (inc(idx) < numItms) {
        s = strConcat(s, ', ')
      }
      idx = inc(idx)
    }
    return s
  }

  function formatReferClojureSingleKeyword (ns, excludeOrOnly) {
    const symbolsArr = ns.referClojure[excludeOrOnly]
    const kwd = strConcat(':', excludeOrOnly)

    const platforms = getPlatformsFromArray(symbolsArr)
    const numPlatforms = arraySize(platforms)
    const symbolsForAllPlatforms = arrayPluck(filterOnPlatform(symbolsArr, false), 'symbol')
    const numSymbolsForAllPlatforms = arraySize(symbolsForAllPlatforms)

    // there are no reader conditionals: print all of the symbols
    if (numPlatforms === 0) {
      let s = '\n'
      s = printCommentsAbove(s, ns.referClojureCommentsAbove, '  ')
      s = strConcat(s, '  (:refer-clojure ')
      s = strConcat(s, formatKeywordFollowedByListOfSymbols(kwd, symbolsForAllPlatforms))
      s = strConcat(s, ')')
      return s

    // all symbols are for a single platform: wrap the entire (:refer-clojure) in a single reader conditional
    } else if (numPlatforms === 1 && numSymbolsForAllPlatforms === 0) {
      const symbols2 = arrayPluck(symbolsArr, 'symbol')

      let s = strConcat3('\n  #?(', platforms[0], '\n')
      s = printCommentsAbove(s, ns.referClojureCommentsAbove, '     ')
      s = strConcat(s, '     (:refer-clojure ')
      s = strConcat(s, formatKeywordFollowedByListOfSymbols(kwd, symbols2))
      s = strConcat(s, '))')
      return s

    // all symbols are for specific platforms, ie: every symbol is wrapped in a reader conditional
    } else if (numPlatforms > 1 && numSymbolsForAllPlatforms === 0) {
      let s = '\n'
      s = printCommentsAbove(s, ns.referClojureCommentsAbove, '  ')
      s = strConcat(s, '  (:refer-clojure\n')
      s = strConcat3(s, '    ', kwd)
      s = strConcat(s, ' #?@(')

      let platformIdx = 0
      while (platformIdx < numPlatforms) {
        const platform = platforms[platformIdx]
        const symbolsForPlatform = arrayPluck(filterOnPlatform(symbolsArr, platform), 'symbol')

        s = strConcat(s, formatKeywordFollowedByListOfSymbols(platform, symbolsForPlatform))

        if (inc(platformIdx) !== numPlatforms) {
          if (kwd === ':exclude') {
            s = strConcat3(s, '\n', repeatString(' ', 17))
          } else if (kwd === ':only') {
            s = strConcat3(s, '\n', repeatString(' ', 14))
          } else {
            // FIXME: throw error here?
          }
        }

        platformIdx = inc(platformIdx)
      }

      s = strConcat(s, '))')

      return s

      // we have a mix of symbols for all platforms and some for specific platforms
    } else {
      let s = '\n'
      s = printCommentsAbove(s, ns.referClojureCommentsAbove, '  ')
      s = strConcat(s, '  (:refer-clojure\n')
      s = strConcat3(s, '    ', kwd)
      s = strConcat(s, ' [')
      s = strConcat(s, strJoin(symbolsForAllPlatforms, ' '))

      if (kwd === ':exclude') {
        s = strConcat3(s, '\n', repeatString(' ', 14))
      } else if (kwd === ':only') {
        s = strConcat3(s, '\n', repeatString(' ', 11))
      } else {
        // FIXME: throw error here?
      }

      s = strConcat(s, '#?@(')

      let platformIdx = 0
      while (platformIdx < numPlatforms) {
        const platform = platforms[platformIdx]
        const symbolsForPlatform = arrayPluck(filterOnPlatform(symbolsArr, platform), 'symbol')

        s = strConcat(s, formatKeywordFollowedByListOfSymbols(platform, symbolsForPlatform))
        if (inc(platformIdx) !== numPlatforms) {
          if (kwd === ':exclude') {
            s = strConcat3(s, '\n', repeatString(' ', 18))
          } else if (kwd === ':only') {
            s = strConcat3(s, '\n', repeatString(' ', 15))
          }
        }

        platformIdx = inc(platformIdx)
      }

      s = strConcat(s, ')])')

      return s
    }
  }

  function formatReferClojure (ns) {
    const keys = getReferClojureKeys(ns.referClojure)
    const numKeys = arraySize(keys)

    // there are no :refer-clojure items, we are done
    if (numKeys === 0) {
      return ''
    // there is only :exclude
    } else if (numKeys === 1 && keys[0] === ':exclude') {
      return formatReferClojureSingleKeyword(ns, 'exclude')

    // there is only :only
    } else if (numKeys === 1 && keys[0] === ':only') {
      return formatReferClojureSingleKeyword(ns, 'only')

    // there is only :rename
    } else if (numKeys === 1 && keys[0] === ':rename') {
      const platforms = getPlatformsFromArray(ns.referClojure.rename)
      const numPlatforms = arraySize(platforms)
      const nonPlatformSpecificRenames = filterOnPlatform(ns.referClojure.rename, false)
      const numNonPlatformSpecificRenames = arraySize(nonPlatformSpecificRenames)
      const allRenamesForSamePlatform = numNonPlatformSpecificRenames === 0 && arraySize(platforms) > 0

      if (numPlatforms === 0) {
        let s = '\n'
        s = printCommentsAbove(s, ns.referClojureCommentsAbove, '  ')
        s = strConcat(s, '  (:refer-clojure :rename {')
        s = strConcat(s, formatRenamesList(ns.referClojure.rename))
        s = strConcat(s, '})')
        return s
      } else if (numPlatforms === 1 && allRenamesForSamePlatform) {
        let s = strConcat3('\n  #?(', platforms[0], '\n')
        s = printCommentsAbove(s, ns.referClojureCommentsAbove, '     ')
        s = strConcat(s, '     (:refer-clojure :rename {')
        s = strConcat(s, formatRenamesList(ns.referClojure.rename))
        s = strConcat(s, '}))')
        return s
      } else {
        let s = '\n  (:refer-clojure\n    :rename {'
        s = strConcat(s, formatRenamesList(nonPlatformSpecificRenames))
        s = strConcat(s, '\n             #?@(')

        let platformIdx = 0
        while (platformIdx < numPlatforms) {
          const platformStr = platforms[platformIdx]
          const platformRenames = filterOnPlatform(ns.referClojure.rename, platformStr)

          if (platformIdx === 0) {
            s = strConcat3(s, platformStr, ' [')
          } else {
            s = strConcat(s, '\n                 ')
            s = strConcat3(s, platformStr, ' [')
          }
          s = strConcat(s, formatRenamesList(platformRenames))
          s = strConcat(s, ']')

          platformIdx = inc(platformIdx)
        }

        s = strConcat(s, ')})')

        return s
      }

    // there are multiple keys, put each one on it's own line
    } else {
      let s = '\n  (:refer-clojure'

      if (ns.referClojure.exclude && arraySize(ns.referClojure.exclude) > 0) {
        const excludeSymbols = arrayPluck(ns.referClojure.exclude, 'symbol')
        s = strConcat(s, '\n    ')
        s = strConcat(s, formatKeywordFollowedByListOfSymbols(':exclude', excludeSymbols))
      }

      if (ns.referClojure.only && arraySize(ns.referClojure.only) > 0) {
        const onlySymbols = arrayPluck(ns.referClojure.only, 'symbol')
        s = strConcat(s, '\n    ')
        s = strConcat(s, formatKeywordFollowedByListOfSymbols(':only', onlySymbols))
      }

      if (ns.referClojure.rename && arraySize(ns.referClojure.rename) > 0) {
        s = strConcat(s, '\n    :rename {')
        s = strConcat(s, formatRenamesList(ns.referClojure.rename))
        s = strConcat(s, '}')
      }

      s = strConcat(s, ')')
      return s

      // FIXME - I need to create some tests cases for this
      // return 'FIXME: handle reader conditionals for multiple :refer-clojure keys'
    }
  }

  function formatNs (ns) {
    let outTxt = strConcat('(ns ', ns.nsSymbol)

    let numRequireMacros = 0
    if (isArray(ns.requireMacros)) {
      numRequireMacros = arraySize(ns.requireMacros)
    }

    let numRequires = 0
    if (isArray(ns.requires)) {
      numRequires = arraySize(ns.requires)
    }

    let numImports = 0
    if (isArray(ns.imports)) {
      numImports = arraySize(ns.imports)
    }

    let commentOutsideNsForm2 = null
    const hasGenClass = !!ns.genClass
    const importsIsLastMainForm = numImports > 0 && !hasGenClass
    const requireIsLastMainForm = numRequires > 0 && !importsIsLastMainForm && !hasGenClass
    const requireMacrosIsLastMainForm = numRequireMacros > 0 && numRequires === 0 && numImports === 0 && !hasGenClass
    const referClojureIsLastMainForm = ns.referClojure && numRequireMacros === 0 && numRequires === 0 && numImports === 0 && !hasGenClass
    let trailingParensArePrinted = false

    if (isString(ns.docstring)) {
      outTxt = strConcat(outTxt, '\n  "')
      outTxt = strConcat(outTxt, ns.docstring)
      outTxt = strConcat(outTxt, '"')
    }

    if (isArray(ns.nsMetadata)) {
      const numMetadataItms = arraySize(ns.nsMetadata)
      if (numMetadataItms > 0) {
        let metadataItmsIdx = 0

        outTxt = strConcat(outTxt, '\n  {')
        while (metadataItmsIdx < numMetadataItms) {
          const metadataItm = ns.nsMetadata[metadataItmsIdx]
          outTxt = strConcat3(outTxt, metadataItm.key, ' ')
          outTxt = strConcat(outTxt, metadataItm.value)

          metadataItmsIdx = inc(metadataItmsIdx)

          if (metadataItmsIdx !== numMetadataItms) {
            outTxt = strConcat(outTxt, '\n   ')
          }
        }

        outTxt = strConcat(outTxt, '}')
      }
    }

    // FIXME - we need reader conditionals for :refer-clojure here
    if (ns.referClojure) {
      outTxt = strConcat(outTxt, formatReferClojure(ns))

      if (isStringWithChars(ns.referClojureCommentAfter)) {
        if (referClojureIsLastMainForm) {
          commentOutsideNsForm2 = ns.referClojureCommentAfter
        } else {
          outTxt = strConcat3(outTxt, ' ', ns.referClojureCommentAfter)
        }
      }
    }

    if (numRequireMacros > 0) {
      const cljsPlatformRequireMacros = filterOnPlatform(ns.requireMacros, ':cljs')
      const wrapRequireMacrosWithReaderConditional = arraySize(cljsPlatformRequireMacros) === numRequireMacros
      let rmLastLineCommentAfter = null

      let rmIndentation = '   '
      if (wrapRequireMacrosWithReaderConditional) {
        outTxt = strConcat(outTxt, '\n')
        outTxt = strConcat(outTxt, '  #?(:cljs\n')
        outTxt = printCommentsAbove(outTxt, ns.requireMacrosCommentsAbove, '     ')
        outTxt = strConcat(outTxt, '     (:require-macros\n')

        rmIndentation = '      '
      } else {
        outTxt = strConcat(outTxt, '\n')
        outTxt = printCommentsAbove(outTxt, ns.requireMacrosCommentsAbove, '  ')
        outTxt = strConcat(outTxt, '  (:require-macros\n')
      }

      let rmIdx = 0
      while (rmIdx < numRequireMacros) {
        const rm = ns.requireMacros[rmIdx]
        const isLastRequireMacroLine = inc(rmIdx) === numRequireMacros
        outTxt = strConcat(outTxt, formatRequireLine(rm, rmIndentation))

        if (isStringWithChars(rm.commentAfter)) {
          if (isLastRequireMacroLine) {
            rmLastLineCommentAfter = rm.commentAfter
          } else {
            outTxt = strConcat3(outTxt, ' ', rm.commentAfter)
          }
        }

        if (!isLastRequireMacroLine) {
          outTxt = strConcat(outTxt, '\n')
        }

        rmIdx = inc(rmIdx)
      }

      if (!requireMacrosIsLastMainForm && !wrapRequireMacrosWithReaderConditional) {
        outTxt = strConcat(outTxt, ')')
      } else if (!requireMacrosIsLastMainForm && wrapRequireMacrosWithReaderConditional) {
        outTxt = strConcat(outTxt, '))')
      } else if (requireMacrosIsLastMainForm && !wrapRequireMacrosWithReaderConditional) {
        outTxt = strConcat(outTxt, '))')
        trailingParensArePrinted = true
      } else if (requireMacrosIsLastMainForm && wrapRequireMacrosWithReaderConditional) {
        outTxt = strConcat(outTxt, ')))')
        trailingParensArePrinted = true
      }

      if (isStringWithChars(rmLastLineCommentAfter)) {
        outTxt = strConcat3(outTxt, ' ', rmLastLineCommentAfter)
      }
    }

    if (numRequires > 0) {
      let closeRequireParenTrail = ')'
      let lastRequireHasComment = false
      let lastRequireComment = null
      const reqPlatforms = getPlatformsFromArray(ns.requires)
      const numPlatforms = arraySize(reqPlatforms)

      let allRequiresUnderOnePlatform = false
      if (numPlatforms === 1) {
        const onePlatformRequires = filterOnPlatform(ns.requires, reqPlatforms[0])
        if (numRequires === arraySize(onePlatformRequires)) {
          allRequiresUnderOnePlatform = true
        }
      }

      let requireLineIndentation = '   '
      if (allRequiresUnderOnePlatform) {
        outTxt = strConcat(outTxt, '\n  #?(')
        outTxt = strConcat(outTxt, reqPlatforms[0])

        if (isArray(ns.requireCommentsAbove) && arraySize(ns.requireCommentsAbove) > 0) {
          outTxt = strConcat(outTxt, '\n     ')
          outTxt = strConcat(outTxt, strJoin(ns.requireCommentsAbove, '\n     '))
        }

        outTxt = strConcat(outTxt, '\n     (:require')
        if (isString(ns.requireCommentAfter) && ns.requireCommentAfter !== '') {
          outTxt = strConcat3(outTxt, ' ', ns.requireCommentAfter)
        }
        outTxt = strConcat(outTxt, '\n')

        requireLineIndentation = '      '
      } else {
        if (isArray(ns.requireCommentsAbove) && arraySize(ns.requireCommentsAbove) > 0) {
          outTxt = strConcat(outTxt, '\n  ')
          outTxt = strConcat(outTxt, strJoin(ns.requireCommentsAbove, '\n  '))
        }
        outTxt = strConcat(outTxt, '\n  (:require\n')
      }

      let requiresIdx = 0
      while (requiresIdx < numRequires) {
        const req = ns.requires[requiresIdx]
        // NOTE: I am not sure this works correctly with reader conditionals
        const isLastRequire1 = inc(requiresIdx) === numRequires

        if (!req.platform || allRequiresUnderOnePlatform) {
          outTxt = strConcat(outTxt, formatRequireLine(req, requireLineIndentation))

          if (req.commentAfter && !isLastRequire1) {
            outTxt = strConcat(outTxt, ' ')
            outTxt = strConcat(outTxt, req.commentAfter)
            outTxt = strConcat(outTxt, '\n')
          } else if (isLastRequire1 && req.commentAfter && requireIsLastMainForm && !allRequiresUnderOnePlatform) {
            closeRequireParenTrail = strConcat(')) ', req.commentAfter)
            trailingParensArePrinted = true
          } else if (isLastRequire1 && req.commentAfter && allRequiresUnderOnePlatform) {
            lastRequireComment = req.commentAfter
            lastRequireHasComment = true
          } else if (isLastRequire1 && req.commentAfter) {
            closeRequireParenTrail = strConcat(') ', req.commentAfter)
          } else if (isLastRequire1 && !req.commentAfter) {
            closeRequireParenTrail = ')'
          } else {
            outTxt = strConcat(outTxt, '\n')
          }
        }

        requiresIdx = inc(requiresIdx)
      }

      let platformIdx = 0

      const requireBlockHasReaderConditionals = numPlatforms > 0
      const useStandardReaderConditional = onlyOneRequirePerPlatform(ns.requires)

      if (!allRequiresUnderOnePlatform) {
        // use standard reader conditional #?(
        if (useStandardReaderConditional) {
          while (platformIdx < numPlatforms) {
            const platform = reqPlatforms[platformIdx]

            if (platformIdx === 0) {
              outTxt = strTrim(outTxt)
              outTxt = strConcat3(outTxt, '\n   #?(', platform)
              outTxt = strConcat(outTxt, ' ')
            } else {
              outTxt = strConcat(outTxt, '\n      ')
              outTxt = strConcat3(outTxt, platform, ' ')
            }

            // only look at requires for this platform
            const platformRequires = filterOnPlatform(ns.requires, platform)
            const req = platformRequires[0]
            outTxt = strConcat(outTxt, formatRequireLine(req, ''))

            // FIXME: need to add commentsBefore and commentsAfter here

            platformIdx = inc(platformIdx)
          }
        // use splicing reader conditional #?@(
        } else {
          while (platformIdx < numPlatforms) {
            const platform = reqPlatforms[platformIdx]
            const isLastPlatform = inc(platformIdx) === numPlatforms

            if (platformIdx === 0) {
              outTxt = strTrim(outTxt)
              outTxt = strConcat(outTxt, '\n   #?@(')
              outTxt = strConcat3(outTxt, platform, '\n       [')
            } else {
              outTxt = strConcat(outTxt, '\n\n       ')
              outTxt = strConcat3(outTxt, platform, '\n       [')
            }

            // only look at requires for this platform
            const platformRequires = filterOnPlatform(ns.requires, platform)
            const numFilteredReqs = arraySize(platformRequires)
            let printedFirstReqLine = false
            let printPlatformClosingBracket = true
            let reqIdx2 = 0
            while (reqIdx2 < numFilteredReqs) {
              const req = platformRequires[reqIdx2]
              const isLastRequireForThisPlatform = inc(reqIdx2) === numFilteredReqs

              if (printedFirstReqLine) {
                outTxt = strConcat(outTxt, formatRequireLine(req, '        '))
              } else {
                printedFirstReqLine = true
                outTxt = strConcat(outTxt, formatRequireLine(req, ''))
              }

              if (req.commentAfter && !isLastRequireForThisPlatform) {
                outTxt = strConcat(outTxt, ' ')
                outTxt = strConcat(outTxt, req.commentAfter)
                outTxt = strConcat(outTxt, '\n')
              } else if (req.commentAfter && isLastRequireForThisPlatform && !isLastPlatform) {
                outTxt = strConcat3(outTxt, '] ', req.commentAfter)
                printPlatformClosingBracket = false
              } else if (req.commentAfter && isLastRequireForThisPlatform && (isLastPlatform || requireIsLastMainForm)) {
                lastRequireHasComment = true
                lastRequireComment = req.commentAfter
              } else if (isLastRequireForThisPlatform && req.commentAfter) {
                closeRequireParenTrail = strConcat(') ', req.commentAfter)
              } else if (isLastRequireForThisPlatform && !req.commentAfter) {
                closeRequireParenTrail = ']'
              } else {
                outTxt = strConcat(outTxt, '\n')
              }

              reqIdx2 = inc(reqIdx2)
            }

            if (printPlatformClosingBracket) {
              outTxt = strConcat(outTxt, ']')
            }

            platformIdx = inc(platformIdx)
          }
        }
      }

      // closeRequireParenTrail can be one of six options:
      // - )             <-- no reader conditional, no comment on the last item, not the last main form
      // - ) <comment>   <-- no reader conditional, comment on the last itm, not the last main form
      // - ))            <-- reader conditional, no comment on the last itm, not the last main form
      // - )) <comment>  <-- reader conditional, comment on last itm, not the last main form
      // - )))           <-- reader conditional, no comment on last itm, :require is last main form
      // - ))) <comment> <-- reader conditional, comment on last itm, :require is last main form
      if (!requireBlockHasReaderConditionals && !lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = ')'
      } else if (!requireBlockHasReaderConditionals && lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = strConcat(') ', lastRequireComment)
      } else if (requireBlockHasReaderConditionals && !lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = '))'
      } else if (requireBlockHasReaderConditionals && lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = strConcat(')) ', lastRequireComment)
      } else if (requireBlockHasReaderConditionals && !lastRequireHasComment && requireIsLastMainForm) {
        closeRequireParenTrail = ')))'
        trailingParensArePrinted = true
      } else if (requireBlockHasReaderConditionals && lastRequireHasComment && requireIsLastMainForm) {
        closeRequireParenTrail = strConcat('))) ', lastRequireComment)
        trailingParensArePrinted = true
      }

      outTxt = strTrim(outTxt)
      outTxt = strConcat(outTxt, closeRequireParenTrail)
    } // end :require printing

    if (numImports > 0) {
      // collect imports that are platform-specific (or not)
      const nonPlatformSpecificImports = filterOnPlatform(ns.imports, false)
      const numNonPlatformSpecificImports = arraySize(nonPlatformSpecificImports)
      const importPlatforms = getPlatformsFromArray(ns.imports)
      const numImportPlatforms = arraySize(importPlatforms)

      let lastImportLineCommentAfter = null
      let isImportKeywordPrinted = false

      let importsIdx = 0
      while (importsIdx < numNonPlatformSpecificImports) {
        if (!isImportKeywordPrinted) {
          outTxt = strConcat(outTxt, '\n  (:import\n')
          isImportKeywordPrinted = true
        }

        const imp = nonPlatformSpecificImports[importsIdx]
        const isLastImport = inc(importsIdx) === numNonPlatformSpecificImports

        outTxt = strConcat3(outTxt, '   (', imp.package)

        const numClasses = arraySize(imp.classes)
        let classNameIdx = 0
        while (classNameIdx < numClasses) {
          const className = imp.classes[classNameIdx]
          outTxt = strConcat3(outTxt, ' ', className)

          classNameIdx = inc(classNameIdx)
        }

        outTxt = strConcat(outTxt, ')')

        if (isStringWithChars(imp.commentAfter)) {
          outTxt = strConcat3(outTxt, ' ', imp.commentAfter)
        }

        if (!isLastImport) {
          outTxt = strConcat(outTxt, '\n')
        }

        importsIdx = inc(importsIdx)
      }

      let platformIdx = 0
      let isFirstPlatform = true
      const importSectionHasReaderConditionals = numImportPlatforms > 0
      const placeReaderConditionalOutsideOfImport = numImportPlatforms === 1 && numNonPlatformSpecificImports === 0

      while (platformIdx < numImportPlatforms) {
        const platformStr = importPlatforms[platformIdx]

        if (placeReaderConditionalOutsideOfImport) {
          outTxt = strConcat(outTxt, '\n  #?(')
          outTxt = strConcat(outTxt, platformStr)
          outTxt = strConcat(outTxt, '\n')
          outTxt = strConcat(outTxt, '     (:import\n')
          outTxt = strConcat(outTxt, '      ')
          isImportKeywordPrinted = true
        } else if (isFirstPlatform) {
          if (!isImportKeywordPrinted) {
            outTxt = strConcat(outTxt, '\n  (:import')
            isImportKeywordPrinted = true
          }
          outTxt = strConcat3(outTxt, '\n   #?@(', platformStr)
          outTxt = strConcat(outTxt, '\n       [')
          isFirstPlatform = false
        } else {
          outTxt = strConcat3(outTxt, '\n\n       ', platformStr)
          outTxt = strConcat(outTxt, '\n       [')
        }

        const importsForThisPlatform = filterOnPlatform(ns.imports, platformStr)
        let idx2 = 0
        const numImports2 = arraySize(importsForThisPlatform)
        while (idx2 < numImports2) {
          const imp = importsForThisPlatform[idx2]
          const isLastImport2 = inc(idx2) === numImports2

          outTxt = strConcat(outTxt, '(')
          outTxt = strConcat(outTxt, imp.package)
          outTxt = strConcat(outTxt, ' ')
          outTxt = strConcat(outTxt, strJoin(imp.classes, ' '))
          outTxt = strConcat(outTxt, ')')

          if (isLastImport2) {
            if (!placeReaderConditionalOutsideOfImport) {
              outTxt = strConcat(outTxt, ']')
            }
            if (isStringWithChars(imp.commentAfter)) {
              lastImportLineCommentAfter = imp.commentAfter
            }
          } else {
            if (isStringWithChars(imp.commentAfter)) {
              outTxt = strConcat3(outTxt, ' ', imp.commentAfter)
            }
            if (placeReaderConditionalOutsideOfImport) {
              outTxt = strConcat(outTxt, '\n      ')
            } else {
              outTxt = strConcat(outTxt, '\n        ')
            }
          }

          idx2 = inc(idx2)
        }

        platformIdx = inc(platformIdx)
      }

      let closeImportParenTrail = ')'
      if (importsIsLastMainForm && importSectionHasReaderConditionals) {
        closeImportParenTrail = ')))'
        trailingParensArePrinted = true
      } else if (importsIsLastMainForm && !importSectionHasReaderConditionals) {
        closeImportParenTrail = '))'
        trailingParensArePrinted = true
      }

      outTxt = strConcat(outTxt, closeImportParenTrail)

      if (isStringWithChars(lastImportLineCommentAfter)) {
        outTxt = strConcat3(outTxt, ' ', lastImportLineCommentAfter)
      }
    } // end :import section

    if (hasGenClass) {
      let genClassIndentationLevel = 2
      outTxt = strConcat(outTxt, '\n')

      const isGenClassBehindReaderConditional = ns.genClass.platform === ':clj'

      if (isGenClassBehindReaderConditional) {
        outTxt = strConcat(outTxt, '  #?(:clj\n')
        genClassIndentationLevel = 5
      }

      const indentationStr = repeatString(' ', genClassIndentationLevel)
      outTxt = printCommentsAbove(outTxt, ns.genClass.commentsAbove, indentationStr)

      outTxt = strConcat(outTxt, indentationStr)
      outTxt = strConcat(outTxt, '(:gen-class')

      let commentAfterGenClass = null

      if (ns.genClass.isEmpty) {
        if (isStringWithChars(ns.genClass.commentAfter)) {
          commentAfterGenClass = ns.genClass.commentAfter
        }
      } else {
        if (isStringWithChars(ns.genClass.commentAfter)) {
          outTxt = strConcat3(outTxt, ' ', ns.genClass.commentAfter)
        }

        const genClassValueIndentationLevel = inc(genClassIndentationLevel)
        const indentationStr2 = repeatString(' ', genClassValueIndentationLevel)

        // print the :gen-class keys in the order in which they appear in the clojure.core.genclass documentation
        // https://github.com/clojure/clojure/blob/clojure-1.11.1/src/clj/clojure/genclass.clj#L507
        let idx3 = 0
        const numGenClassKeys = arraySize(genClassKeys)
        while (idx3 < numGenClassKeys) {
          const genClassKey = genClassKeys[idx3]
          const genClassValue = ns.genClass[genClassKey]

          if (genClassValue) {
            // print the comment from the previous line if necessary
            if (isStringWithChars(commentAfterGenClass)) {
              outTxt = strConcat3(outTxt, ' ', commentAfterGenClass)
              commentAfterGenClass = null
            }

            outTxt = strConcat(outTxt, '\n')

            outTxt = printCommentsAbove(outTxt, genClassValue.commentsAbove, indentationStr2)

            outTxt = strConcat(outTxt, indentationStr2)
            outTxt = strConcat3(outTxt, ':', genClassKey)
            outTxt = strConcat3(outTxt, ' ', genClassValue.value)

            if (isStringWithChars(genClassValue.commentAfter)) {
              commentAfterGenClass = genClassValue.commentAfter
            }
          }

          idx3 = inc(idx3)
        }
      }

      if (!isGenClassBehindReaderConditional && !commentAfterGenClass) {
        outTxt = strConcat(outTxt, '))')
        trailingParensArePrinted = true
      } else if (isGenClassBehindReaderConditional && !commentAfterGenClass) {
        outTxt = strConcat(outTxt, ')))')
        trailingParensArePrinted = true
      } else if (!isGenClassBehindReaderConditional && isStringWithChars(commentAfterGenClass)) {
        outTxt = strConcat3(outTxt, ')) ', commentAfterGenClass)
        trailingParensArePrinted = true
      } else if (isGenClassBehindReaderConditional && isStringWithChars(commentAfterGenClass)) {
        outTxt = strConcat3(outTxt, '))) ', commentAfterGenClass)
        trailingParensArePrinted = true
      }
    } // end :gen-class section

    if (!trailingParensArePrinted) {
      outTxt = strConcat(outTxt, ')')
    }

    if (isStringWithChars(commentOutsideNsForm2)) {
      outTxt = strConcat3(outTxt, ' ', commentOutsideNsForm2)
    }

    return outTxt
  }

  // Continuation of the format() function, with the input text parsed into nodes
  // and ns form parsed.
  function formatNodes (nodesArr, parsedNs) {
    const numNodes = arraySize(nodesArr)
    const hasParsedNsForm = parsedNs.nsSymbol !== null

    let parenNestingDepth = 0
    let idx = 0
    let outTxt = ''
    let outputTxtContainsChars = false
    let lineTxt = ''
    let lineIdx = 0
    let insideNsForm = false
    let lineIdxOfClosingNsForm = -1
    let nsStartStringIdx = -1
    let nsEndStringIdx = -1
    let ignoreNodesStartId = -1
    let ignoreNodesEndId = -1
    let insideTheIgnoreZone = false

    const parenStack = []
    let nodesWeHavePrintedOnThisLine = []

    let colIdx = 0
    while (idx < numNodes) {
      const node = nodesArr[idx]

      if (ignoreNodesStartId > 0 && node.id === ignoreNodesStartId) {
        insideTheIgnoreZone = true

        // dump the current lineTxt when we start the ignore zone
        outTxt = strConcat(outTxt, lineTxt)
        lineTxt = ''
      }

      if (insideTheIgnoreZone) {
        if (isString(node.text) && node.text !== '') {
          outTxt = strConcat(outTxt, node.text)
        }

        if (node.id === ignoreNodesEndId) {
          ignoreNodesStartId = -1
          ignoreNodesEndId = -1
          insideTheIgnoreZone = false
        }
      } else {
        // edge case: add '#' text to .tag nodes
        if (isTagNode(node)) {
          node.text = '#'
        }

        // record original column indexes for the first line
        if (idx === 0) {
          nodesArr = recordOriginalColIndexes(nodesArr, idx)
        }

        if (nsStartStringIdx === -1 && parenNestingDepth === 1 && hasParsedNsForm && isNsNode(node)) {
          insideNsForm = true
          nsStartStringIdx = strLen(strConcat(outTxt, lineTxt))
        }

        const nextTextNode = findNextNodeWithText(nodesArr, inc(idx))
        const isLastNode = inc(idx) >= numNodes

        const currentNodeIsWhitespace = isWhitespaceNode(node)
        const currentNodeIsNewline = isNewlineNode(node)

        let skipPrintingThisNode = false

        if (isStandardCljIgnoreKeyword(node) && idx > 1) {
          const prevNode1 = findPrevNodeWithText(nodesArr, idx, node.id)
          let prevNode2 = null
          if (prevNode1) {
            prevNode2 = findPrevNodeWithText(nodesArr, idx, prevNode1.id)
          }

          const isDiscardMap = prevNode1.name === '.open' && prevNode1.text === '{' && prevNode2 && isDiscardNode(prevNode2)

          if (isDiscardNode(prevNode1) || (isWhitespaceNode(prevNode1) && isDiscardNode(prevNode2))) {
            // look forward to find the next node with text
            const nextIgnoreNode = findNextNonWhitespaceNode(nodesArr, inc(idx))

            // if parens or brackets or something with children, then find the closing node id
            if (isArray(nextIgnoreNode.children) && arraySize(nextIgnoreNode.children) > 0) {
              const closingNode = arrayLast(nextIgnoreNode.children)
              ignoreNodesStartId = nextIgnoreNode.id
              ignoreNodesEndId = closingNode.id

            // if a node without children, then just don't format it
            } else {
              const nextImmediateNode = nodesArr[inc(idx)]
              ignoreNodesStartId = nextImmediateNode.id
              ignoreNodesEndId = nextIgnoreNode.id
            }
          } else if (isDiscardMap) {
            // find the opening { and closing } for this form
            const openingBraceNode = findPrevNodeWithPredicate(nodesArr, idx, isOpeningBraceNode)
            const closingBraceNodeId = openingBraceNode.children[2].id

            const startIgnoreNode = findNextNodeWithPredicateAfterSpecificNode(nodesArr, idx, alwaysTrue, closingBraceNodeId)
            const firstNodeInsideIgnoreZone = findNextNodeWithPredicateAfterSpecificNode(nodesArr, idx, alwaysTrue, startIgnoreNode.id)

            // if parens or brackets or something with children, then find the closing node id
            if (isArray(firstNodeInsideIgnoreZone.children) && arraySize(firstNodeInsideIgnoreZone.children) > 0) {
              const closingNode = arrayLast(firstNodeInsideIgnoreZone.children)
              ignoreNodesStartId = startIgnoreNode.id
              ignoreNodesEndId = closingNode.id

            // if a node without children, then just don't format it
            } else {
              ignoreNodesStartId = startIgnoreNode.id
              ignoreNodesEndId = firstNodeInsideIgnoreZone.id
            }
          }
        }

        if (isParenOpener(node)) {
          // we potentially need to add this opener node to the current openingLineNodes
          // before we push into the next parenStack
          const topOfTheParenStack = stackPeek(parenStack, 0)
          if (topOfTheParenStack) {
            const onOpeningLineOfParenStack = lineIdx === topOfTheParenStack._parenOpenerLineIdx
            if (onOpeningLineOfParenStack) {
              node._colIdx = colIdx
              node._lineIdx = lineIdx
              stackPush(topOfTheParenStack._openingLineNodes, node)
            }
          }

          parenNestingDepth = inc(parenNestingDepth)

          // attach some extra information to this node and push it onto the parenStack
          const parenStackNode = node
          parenStackNode._colIdx = colIdx
          parenStackNode._nextWithText = nextTextNode
          parenStackNode._parenOpenerLineIdx = lineIdx
          // an array of nodes on the first line of this parenStack
          // used to determine if Rule 3 indentation applies
          parenStackNode._openingLineNodes = []
          parenStackNode._rule3Active = false
          parenStackNode._rule3NumSpaces = 0
          parenStackNode._rule3SearchComplete = false

          stackPush(parenStack, parenStackNode)

          // remove whitespace after an opener (remove-surrounding-whitespace?)
          if (isWhitespaceNode(nextTextNode)) {
          // FIXME: skip this via index instead of modifying the tree like this
            nextTextNode.text = ''
          }
        } else if (isParenCloser(node)) {
        // NOTE: this code is duplicated when we look forward to close parenTrails
          parenNestingDepth = dec(parenNestingDepth)
          stackPop(parenStack)

          // flag the end of the ns form
          if (insideNsForm && parenNestingDepth === 0) {
            insideNsForm = false
            nsEndStringIdx = strLen(strConcat(outTxt, lineTxt))
            lineIdxOfClosingNsForm = lineIdx
          }
        }

        // add nodes to the top of the parenStack if we are on the opening line
        const topOfTheParenStack = stackPeek(parenStack, 0)
        if (topOfTheParenStack && nodeContainsText(node)) {
          const onOpeningLineOfParenStack = lineIdx === topOfTheParenStack._parenOpenerLineIdx
          if (onOpeningLineOfParenStack) {
            node._colIdx = colIdx
            node._lineIdx = lineIdx
            stackPush(topOfTheParenStack._openingLineNodes, node)
          }
        }

        // remove whitespace before a closer (remove-surrounding-whitespace?)
        if (currentNodeIsWhitespace && !currentNodeIsNewline && isParenCloser(nextTextNode)) {
          skipPrintingThisNode = true
        }

        // do not print a comma at the end of a line
        if (currentNodeIsWhitespace && !currentNodeIsNewline && nextTextNode && isCommentNode(nextTextNode)) {
          node.text = strReplaceAll(node.text, ',', '')
        }

        // If we are inside of a parenStack and hit a newline,
        // look forward to see if we can close the current parenTrail.
        // ie: slurp closing parens onto the current line
        const parenStackSize = arraySize(parenStack)
        if (parenStackSize > 0 && !insideNsForm) {
          const isCommentFollowedByNewline = isCommentNode(node) && nextTextNode && isNewlineNode(nextTextNode)
          const isNewline = isNewlineNode(node)
          const hasCommasAfterNewline2 = hasCommasAfterNewline(node) || (nextTextNode && hasCommasAfterNewline(nextTextNode))

          let lookForwardToSlurpNodes = false
          if (hasCommasAfterNewline2) {
            lookForwardToSlurpNodes = false
          } else if (isCommentFollowedByNewline) {
            lookForwardToSlurpNodes = true
          } else if (isNewline) {
            lookForwardToSlurpNodes = true
          }

          if (lookForwardToSlurpNodes) {
            // look forward and grab any closers nodes that may be slurped up
            const parenTrailClosers = findForwardClosingParens(nodesArr, inc(idx))

            // If we have printed a whitespace node just before this, we may need to remove it and then re-print
            const lastNodeWePrinted = arrayLast(nodesWeHavePrintedOnThisLine)
            let lineTxtHasBeenRightTrimmed = false
            if (lastNodeWePrinted && isWhitespaceNode(lastNodeWePrinted)) {
              lineTxt = removeTrailingWhitespace(lineTxt)
              lineTxtHasBeenRightTrimmed = true
            }

            let parenTrailCloserIdx = 0
            const numParenTrailClosers = arraySize(parenTrailClosers)

            while (parenTrailCloserIdx < numParenTrailClosers) {
              const parenTrailCloserNode = parenTrailClosers[parenTrailCloserIdx]

              if (isParenCloser(parenTrailCloserNode)) {
                // NOTE: we are adjusting the current line here, but we do not update the nodesWeHavePrintedOnThisLine
                // because we cannot have a Rule 3 alignment to a closer node
                lineTxt = strConcat(lineTxt, parenTrailCloserNode.text)

                parenTrailCloserNode.text = ''
                parenTrailCloserNode._wasSlurpedUp = true

                parenNestingDepth = dec(parenNestingDepth)
                stackPop(parenStack)
              }

              parenTrailCloserIdx = inc(parenTrailCloserIdx)
            }

            // re-print the whitespace node if necessary
            if (lineTxtHasBeenRightTrimmed) {
              lineTxt = strConcat(lineTxt, lastNodeWePrinted.text)
            }
          }
        }

        if (currentNodeIsNewline) {
          // record the original column indexes for the next line
          nodesArr = recordOriginalColIndexes(nodesArr, idx)

          const numSpacesOnNextLine = numSpacesAfterNewline(node)

          // Have we already slurped up everything on the next line?
          const allNextLineNodesWereSlurpedUp = areForwardNodesAlreadySlurped(nodesArr, inc(idx))

          const nextLineContainsOnlyOneComment = isNextLineACommentLine(nodesArr, inc(idx))
          let nextLineCommentColIdx = -1
          if (nextLineContainsOnlyOneComment) {
            nextLineCommentColIdx = numSpacesOnNextLine
          }

          const isDoubleNewline = strIncludes(node.text, '\n\n')
          let newlineStr = '\n'
          if (isDoubleNewline) newlineStr = '\n\n'

          // print the current line and calculate the next line's indentation level
          if (outputTxtContainsChars) {
            const topOfTheParenStack = stackPeek(parenStack, 0)

            // Check for Rule 3:
            // Are we inside of a parenStack that crosses into the next line?
            // And have not already done a "Rule 3" check for this parenStack?
            if (topOfTheParenStack && !topOfTheParenStack._rule3SearchComplete) {
              let searchForAlignmentNode = true
              // NOTE: we can start this index at 1 because we will always want to skip at least the first node
              let openingLineNodeIdx = 1

              // we must be past the first whitespace node in order to look for Rule 3 alignment nodes
              let pastFirstWhitespaceNode = false

              const numOpeningLineNodes = arraySize(topOfTheParenStack._openingLineNodes)
              if (numOpeningLineNodes > 2) {
                while (searchForAlignmentNode) {
                  const openingLineNode = topOfTheParenStack._openingLineNodes[openingLineNodeIdx]
                  if (openingLineNode) {
                    // Is the first node on this new line vertically aligned with any of the nodes
                    // on the line above that are in the same paren stack?
                    if (pastFirstWhitespaceNode && isNodeWithNonBlankText(openingLineNode) && openingLineNode._origColIdx === numSpacesOnNextLine) {
                      // Rule 3 is activated 👍
                      topOfTheParenStack._rule3Active = true

                      // NOTE: we use the original _colIdx of this node in order to determine Rule 3 alignment,
                      // but we use the _printedColIdx of this node to determine the number of leading spaces
                      topOfTheParenStack._rule3NumSpaces = openingLineNode._printedColIdx

                      // we are done searching at this point
                      searchForAlignmentNode = false
                    } else if (!pastFirstWhitespaceNode && isWhitespaceNode(openingLineNode)) {
                      pastFirstWhitespaceNode = true
                    }
                  }

                  openingLineNodeIdx = inc(openingLineNodeIdx)
                  if (openingLineNodeIdx >= numOpeningLineNodes) {
                    searchForAlignmentNode = false
                  }
                }
              }

              // only check for Rule 3 alignment once per parenStack
              topOfTheParenStack._rule3SearchComplete = true
            }

            // Do we have a comment line that looks vertically aligned with nodes on the previous line?
            // NOTE: this is basically "Rule 3" for single line comments
            let colIdxOfSingleLineCommentAlignmentNode = -1
            let commentLooksAlignedWithPreviousForm = false
            if (nextLineContainsOnlyOneComment) {
              let idx2 = 0
              const numPrevLineNodes = arraySize(nodesWeHavePrintedOnThisLine)
              while (idx2 < numPrevLineNodes) {
                const prevLineNode = nodesWeHavePrintedOnThisLine[idx2]
                let prevNode2 = null
                if (idx2 > 0) {
                  prevNode2 = nodesWeHavePrintedOnThisLine[dec(idx2)]
                }

                let isPossibleAlignmentNode = false
                if (isNodeWithNonBlankText(prevLineNode)) {
                  if (!prevNode2 || (prevNode2 && !isParenOpener(prevNode2))) {
                    isPossibleAlignmentNode = true
                  }
                }

                if (isPossibleAlignmentNode && nextLineCommentColIdx === prevLineNode._origColIdx) {
                  colIdxOfSingleLineCommentAlignmentNode = prevLineNode._printedColIdx
                  commentLooksAlignedWithPreviousForm = true
                  idx2 = inc(numPrevLineNodes) // exit the loop
                }

                idx2 = inc(idx2)
              }
            }

            let numSpaces = 0
            // If we are inside a parenStack and Rule 3 has been activated, use that first.
            if (topOfTheParenStack && topOfTheParenStack._rule3Active) {
              numSpaces = topOfTheParenStack._rule3NumSpaces

            // Comment lines that are vertically aligned with a node from the line above --> align to that node
            } else if (nextLineContainsOnlyOneComment && commentLooksAlignedWithPreviousForm) {
              numSpaces = colIdxOfSingleLineCommentAlignmentNode

            // Comment lines that are outside of a parenStack, and have no obvious relation to lines above them:
            // keep their current indentation
            } else if (nextLineContainsOnlyOneComment && !topOfTheParenStack) {
              numSpaces = numSpacesOnNextLine

            // Else apply regular fixed indentation rules based on the parenStack depth (ie: Tonsky rules)
            } else {
              numSpaces = numSpacesForIndentation(topOfTheParenStack)
            }

            let indentationStr = repeatString(' ', numSpaces)

            // If we have slurped up all of the nodes on this line, we can remove it.
            if (allNextLineNodesWereSlurpedUp) {
              newlineStr = ''
              indentationStr = ''
            }

            if (isCommaNode(node)) {
              const nextLineCommaTrail = removeLeadingWhitespace(node.text)
              const trimmedCommaTrail = rtrim(nextLineCommaTrail)
              indentationStr = strConcat(indentationStr, trimmedCommaTrail)
            }

            // add this line to the outTxt and reset lineTxt
            if (strTrim(lineTxt) !== '') {
              outTxt = strConcat(outTxt, lineTxt)
            }
            outTxt = strConcat(outTxt, newlineStr)

            lineTxt = indentationStr
            nodesWeHavePrintedOnThisLine = []

            // reset the colIdx
            colIdx = strLen(indentationStr)

            // increment the lineIdx
            lineIdx = inc(lineIdx)
            if (isDoubleNewline) {
              lineIdx = inc(lineIdx)
            }
          }

          // we have taken care of printing this node, skip the "normal" printing step
          skipPrintingThisNode = true
        } // end currentNodeIsNewline

        if (nodeContainsText(node) && !skipPrintingThisNode) {
          const isTokenFollowedByOpener = isTokenNode(node) && nextTextNode && isParenOpener(nextTextNode)
          const isParenCloserFollowedByText = isParenCloser(node) && nextTextNode && (isTokenNode(nextTextNode) || isParenOpener(nextTextNode))
          const addSpaceAfterThisNode = isTokenFollowedByOpener || isParenCloserFollowedByText

          let nodeTxt = node.text
          if (isCommentNode(node)) {
            if (commentNeedsSpaceInside(nodeTxt)) {
              nodeTxt = strReplaceFirst(nodeTxt, /^(;+)([^ ])/, '$1 $2')
            }
            if (commentNeedsSpaceBefore(lineTxt, nodeTxt)) {
              nodeTxt = strConcat(' ', nodeTxt)
            }
          }

          // if there is a whitespace node as the first or last node, do not print it
          if (currentNodeIsWhitespace && (isLastNode || !outputTxtContainsChars)) {
            skipPrintingThisNode = true

          // do not print a comment node on the last line of the ns form
          // (this is handled by the nsFormat function)
          } else if (isCommentNode(node) && parsedNs.commentOutsideNsForm === node.text && lineIdx === lineIdxOfClosingNsForm) {
            skipPrintingThisNode = true
          } else if (currentNodeIsWhitespace && lineIdx === lineIdxOfClosingNsForm) {
            skipPrintingThisNode = true
          } else if (node._skipPrintingThisNode === true) {
            skipPrintingThisNode = true
          }

          // add the text of this node to the current line
          if (!skipPrintingThisNode) {
            const lineLengthBeforePrintingNode = strLen(lineTxt)
            lineTxt = strConcat(lineTxt, nodeTxt)

            if (lineTxt !== '') {
              outputTxtContainsChars = true
            }

            // add the printed colIdx to this node
            node._printedColIdx = lineLengthBeforePrintingNode
            node._printedLineIdx = lineIdx

            stackPush(nodesWeHavePrintedOnThisLine, node)
          }

          if (addSpaceAfterThisNode) {
            lineTxt = strConcat(lineTxt, ' ')
          }

          // update the colIdx
          colIdx = colIdx + strLen(nodeTxt)
        }
      } // end !insideTheIgnoreZone

      idx = inc(idx)
    } // end looping through the nodes

    // add the last line to outTxt if necesary
    if (lineTxt !== '') {
      outTxt = strConcat(outTxt, lineTxt)
    }

    // replace the ns form with our formatted version
    if (nsStartStringIdx > 0) {
      const headStr = substr(outTxt, 0, dec(nsStartStringIdx))

      let nsStr = null
      try {
        nsStr = formatNs(parsedNs)
      } catch (e) {
        return {
          status: 'error',
          reason: e.message
        }
      }

      let tailStr = ''
      if (nsEndStringIdx > 0) {
        tailStr = substr(outTxt, inc(nsEndStringIdx), -1)
      }

      outTxt = strConcat3(headStr, nsStr, tailStr)
    }

    // remove any leading or trailing whitespace
    outTxt = strTrim(outTxt)

    return {
      status: 'success',
      out: outTxt
    }
  }

  // Parses inputTxt (Clojure code) and returns a String of it formatted according
  // to Standard Clojure Style.
  function format (inputTxt) {
    // replace any CRLF with LF before we do anything
    inputTxt = crlfToLf(inputTxt)

    // FIXME: wrap this in try/catch and return error code if found
    const tree = parse(inputTxt)
    const nodesArr = flattenTree(tree)

    const ignoreFile = lookForIgnoreFile(nodesArr)

    if (ignoreFile) {
      return {
        fileWasIgnored: true,
        status: 'success',
        out: inputTxt
      }
    } else {
      // parse the ns data structure from the nodes
      let parsedNs = null
      try {
        parsedNs = parseNs(nodesArr)
      } catch (e) {
        return {
          status: 'error',
          reason: e.message
        }
      }

      return formatNodes(nodesArr, parsedNs)
    }
  }

  // parses inputTxt and returns an tree structure of the code
  function parse (inputTxt) {
    return getParser('source').parse(inputTxt, 0)
  }

  // ---------------------------------------------------------------------------
  // Public API

  const API = {
    format,
    parse
  }

  // NOTE: the scripts/build-release.js file toggles this to false when we build the project
  const exportInternalFnsForTesting = true // 24d4533f-0f94-4d9c-85f9-048aca1e19b6

  if (exportInternalFnsForTesting) {
    API._charAt = charAt
    API._substr = substr
    API._repeatString = repeatString
    API._strIncludes = strIncludes
    API._toUpperCase = toUpperCase
    API._strJoin = strJoin
    API._rtrim = rtrim
    API._strTrim = strTrim
    API._strStartsWith = strStartsWith
    API._strEndsWith = strEndsWith
    API._isStringWithChars = isStringWithChars
    API._strReplaceFirst = strReplaceFirst
    API._strReplaceAll = strReplaceAll
    API._crlfToLf = crlfToLf
    API._stackPeek = stackPeek
    API._stackPop = stackPop
    API._stackPush = stackPush

    API._commentNeedsSpaceBefore = commentNeedsSpaceBefore
    API._commentNeedsSpaceInside = commentNeedsSpaceInside
    API._removeLeadingWhitespace = removeLeadingWhitespace
    API._removeTrailingWhitespace = removeTrailingWhitespace
    API._removeCharsUpToNewline = removeCharsUpToNewline
    API._txtHasCommasAfterNewline = txtHasCommasAfterNewline

    API._Named = Named
    API._AnyChar = AnyChar
    API._Char = Char
    API._Choice = Choice
    API._NotChar = NotChar
    API._Optional = Optional
    API._Regex = Regex
    API._Repeat = Repeat
    API._Seq = Seq
    API._StringParser = StringParser

    API._flattenTree = flattenTree
    API._parseJavaPackageWithClass = parseJavaPackageWithClass
    API._parseNs = parseNs
  }

  return API
})) // end module anonymous scope
