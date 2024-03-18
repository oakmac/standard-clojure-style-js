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
    const maxIdx = dec(arraySize(arr))
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

  // Returns the substring of s beginning at start inclusive, and ending
  // at end (defaults to length of string), exclusive.
  function substr (s, start, end) {
    const len = strLen(s)
    if (!isPositiveInt(end)) end = len
    if (end > len) end = len
    // TODO: throw here if end < start?
    return s.substring(start, end)
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
            end: inc(pos),
            name: opts.name,
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
            start: pos,
            end: inc(pos),
            name: opts.name,
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
              start: pos,
              end: inc(pos),
              name: opts.name,
              text: charAtThisPos
            })
          }
        }
      }
    }
  }

  // Terminal parser that matches a String
  function String (opts) {
    return {
      name: opts.name,
      parse: (txt, pos) => {
        const len = strLen(opts.str)
        if (pos + len <= strLen(txt)) {
          const strToCompare = substr(txt, pos, pos + len)
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

  // TODO: extract the regex operations here to make it easier to port
  function Regex (opts) {
    return {
      name: opts.name,
      pattern_str: opts.regex,
      parse: (txt, pos) => {
        // NOTE: this might be a perf issue; investigate later
        const txt2 = substr(txt, pos)
        const result = txt2.match(opts.regex)

        // HACK HACK HACK:
        // make sure the match was the beginning of the String
        // this can break in subtle ways: think of a better solution here
        if (result && result[0] !== '') {
          const matchedTxt = result[0]
          if (!txt2.startsWith(matchedTxt)) return null
        }

        let matchedStr = null
        if (result && isInteger(opts.groupIdx) && isString(result[inc(opts.groupIdx)])) {
          matchedStr = result[inc(opts.groupIdx)]
        } else if (result && isString(result[0])) {
          matchedStr = result[0]
        }

        if (isString(matchedStr)) {
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
      isTerminal: false,
      name: opts.name,

      parse: (txt, pos) => {
        const children = []
        let end = pos

        let j = 0
        while (j < arraySize(opts.parsers)) {
          const parser = opts.parsers[j]

          const possibleNode = parser.parse(txt, end)
          if (possibleNode) {
            appendChildren(children, possibleNode)
            end = possibleNode.end
          } else {
            // else this is not a valid sequence: early return
            return null
          }
          j = inc(j)
        }

        return Node({ start: pos, end, children, name: opts.name })
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
        let end = pos

        let lookForTheNextNode = true
        while (lookForTheNextNode) {
          const node = opts.parser.parse(txt, end)
          if (node) {
            appendChildren(children, node)
            end = node.end
          } else {
            lookForTheNextNode = false
          }
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

  // Parser that either matches a child parser or skips it
  function Optional (parser) {
    return {
      parse: (txt, pos) => {
        const node = parser.parse(txt, pos)
        if (node && isString(node.text) && node.text !== '') {
          return node
        } else {
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
        i = inc(i)
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

  parsers._ws = Regex({ name: 'whitespace', regex: new RegExp('[' + whitespaceChars + ']+') })
  // parsers._ws = Choice({
  //   parsers: [
  //     String({ name: 'whitespace:newline', str: '\n' }),
  //     Regex({ name: 'whitespace', regex: new RegExp('[' + whitespaceChars + ']+') })
  //   ]
  // })

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
  // Format Helpers

  // TODO: some of this information should be calculated when parsing
  // TODO: it would be nice if every paren open / close pair had a unique id

  function isNonEmptyTextNode (node) {
    return node && isString(node.text) && node.text !== ''
  }

  function isNsNode (node) {
    return node.name === 'token' && node.text === 'ns'
  }

  function isRequireNode (node) {
    return node && isString(node.text) && (node.text === ':require' || node.text === 'require')
  }

  function isReferClojureNode (node) {
    return node && isString(node.text) && (node.text === ':refer-clojure' || node.text === 'refer-clojure')
  }

  function isImportNode (node) {
    return node && isString(node.text) && (node.text === ':import' || node.text === 'import')
  }

  function isNsTopLevelRequireNode (node) {
    return isRequireNode(node) || isReferClojureNode(node) || isImportNode(node)
  }

  function isNewlineNode (n) {
    return n && isString(n.text) && strIncludes(n.text, '\n')
  }

  function isWhitespaceNode (n) {
    return n.name === 'whitespace' || isNewlineNode(n)
  }

  function isParenOpener (n) {
    return n.text === '(' || n.text === '[' || n.text === '{' || n.text === '#{' || n.text === '#?(' || n.text === '#?@('
  }

  function isParenCloser (n) {
    if (n && isString(n.text)) {
      return n.text === ')' || n.text === ']' || n.text === '}'
    } else {
      return false
    }
  }

  function isTokenNode (n) {
    return n.name === 'token'
  }

  function isOneSpaceOpener (opener) {
    return opener.text === '{' || opener.text === '['
  }

  function isReaderConditionalOpener (opener) {
    return opener.text === '#?(' || opener.text === '#?@('
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
      } else if (isWhitespaceNode(node) || isParenCloser(node)) {
        closers.push(node)
        keepSearching = true // NOTE: this is a no-op, but I like being explicit
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

  // returns the number of spaces to use for indentation at the beginning of a line
  function numSpacesForIndentation (wrappingOpener) {
    if (!wrappingOpener) {
      return 0
    } else {
      const nextNodeAfterOpener = wrappingOpener._nextWithText
      const openerTextLength = strLen(wrappingOpener.text)
      const directlyUnderneathOpener = wrappingOpener._colIdx + openerTextLength

      if (isReaderConditionalOpener(wrappingOpener)) {
        return directlyUnderneathOpener
        // TODO: pretty sure one or both of these conditions can be removed or combined
      } else if (nextNodeAfterOpener && isParenOpener(nextNodeAfterOpener)) {
        return inc(wrappingOpener._colIdx)
      } else if (isOneSpaceOpener(wrappingOpener)) {
        return inc(wrappingOpener._colIdx)
      } else {
        // else indent two spaces from the wrapping opener
        return inc(inc(wrappingOpener._colIdx))
      }
    }
  }

  function numSpacesAfterNewline (newlineNode) {
    // TODO: make this language neutral
    const x = newlineNode.text.split('\n')
    const lastX = arrayLast(x)
    return strLen(lastX)
  }

  // ---------------------------------------------------------------------------
  // Parse Namespace

  // parses a flat array of nodes and extracts ns information from it
  function parseNs (nodesArr) {
    let idx = 0
    const numNodes = arraySize(nodesArr)
    const result = {
      nsSymbol: null,
      requires: []
    }

    let parenNestingDepth = 0
    const parenStack = []
    let insideNsForm = false
    let insideRequireForm = false
    let insideImportForm = false

    while (idx < numNodes) {
      const node = nodesArr[idx]
      const nextTextNode = nextNodeWithText(nodesArr, inc(idx))

      if (parenNestingDepth === 1 && isNsNode(node)) {
        insideNsForm = true
      }
      if (insideNsForm && isRequireNode(node)) {
        insideRequireForm = true
      }
      if (insideNsForm && isImportNode(node)) {
        insideImportForm = true
      }

      const isOpener = isParenOpener(node)
      const isCloser = isParenCloser(node)

      if (isParenOpener(node)) {
        parenNestingDepth = inc(parenNestingDepth)

        parenStack.push(node) // TODO: abstract to language neutral
      } else if (isParenCloser(node)) {
        parenNestingDepth = dec(parenNestingDepth)
        parenStack.pop() // TODO: abstract to language neutral

        if (insideRequireForm && parenNestingDepth === 1) {
          insideRequireForm = false
        }
        if (insideImportForm && parenNestingDepth === 1) {
          insideImportForm = false
        }
        if (insideNsForm && parenNestingDepth === 0) {
          insideNsForm = false
        }
      }

      idx = inc(idx)
    }

    return result
  }

  // ---------------------------------------------------------------------------
  // Formatter

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
    let outputTxtContainsChars = false
    let lineIdx = 0
    let insideNsForm = false
    let insideRequireForm = false
    let insideImportForm = false

    // FIXME: need a running paren stack of openers (who are not closed)
    // use this on a newline to determine indentation level
    const parenStack = []

    let colIdx = 0
    while (idx < numNodes) {
      // let prevNode = null
      // if (i > 0) { prevNode = nodesArr[dec(i)] }
      const node = nodesArr[idx]
      if (parenNestingDepth === 1 && isNsNode(node)) {
        insideNsForm = true
      }
      if (insideNsForm && isRequireNode(node)) {
        insideRequireForm = true
      }
      if (insideNsForm && isImportNode(node)) {
        insideImportForm = true
      }
      const nextTextNode = nextNodeWithText(nodesArr, inc(idx))
      const isLastNode = inc(idx) >= numNodes

      const currentNodeIsWhitespace = isWhitespaceNode(node)
      const currentNodeIsNewline = isNewlineNode(node)
      let skipPrintingThisNode = false

      if (isParenOpener(node)) {
        parenNestingDepth = inc(parenNestingDepth)

        // how to ns: use vectors, not lists
        if (insideNsForm && parenNestingDepth === 2 && nextTextNode && isNsTopLevelRequireNode(nextTextNode) && node.text === '[') {
          node.text = '('
        }
        if (insideRequireForm && node.text === '(') {
          node.text = '['
        }
        if (insideImportForm && node.text === '[') {
          node.text = '('
        }

        // TODO: rename
        const nodeWithExtraInfo = node
        nodeWithExtraInfo._colIdx = colIdx
        nodeWithExtraInfo._nextWithText = nextTextNode
        nodeWithExtraInfo._parenOpenerLineIdx = lineIdx
        // an array of tokens on the first line of this parenStack
        // used to determine if Rule 3 indentation applies
        nodeWithExtraInfo._openingLineTokens = []
        nodeWithExtraInfo._rule3Active = false
        nodeWithExtraInfo._rule3NumSpaces = 0

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

        // how to ns: use vectors, not lists
        if (insideNsForm && parenNestingDepth === 1 && node.text === ']') {
          node.text = ')'
        }

        if (insideRequireForm && parenNestingDepth === 1) {
          insideRequireForm = false
        }
        if (insideImportForm && parenNestingDepth === 1) {
          insideImportForm = false
        }
        if (insideNsForm && parenNestingDepth === 0) {
          insideNsForm = false
        }

        // how to ns: use vectors for require
        if (insideRequireForm && node.text === ')') {
          node.text = ']'
        }
        if (insideImportForm && node.text === ']') {
          node.text = ')'
        }
      }

      // add token nodes to the top of the parenStack if we are on the opening line
      const topOfTheParenStack = stackPeek(parenStack, 0)
      if (topOfTheParenStack && isTokenNode(node)) {
        const onOpeningLineOfParenStack = lineIdx === topOfTheParenStack._parenOpenerLineIdx
        if (onOpeningLineOfParenStack) {
          node._colIdx = colIdx
          node._lineIdx = lineIdx
          topOfTheParenStack._openingLineTokens.push(node)
        }
      }

      // remove whitespace before a closer (remove-surrounding-whitespace?)
      if (currentNodeIsWhitespace && !isNewlineNode(node) && isParenCloser(nextTextNode)) {
        skipPrintingThisNode = true
      }

      // do not print any initial whitespace nodes
      if (currentNodeIsWhitespace && !outputTxtContainsChars) {
        skipPrintingThisNode = true
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

            if (insideRequireForm && parenNestingDepth === 1) {
              insideRequireForm = false
            }
            if (insideImportForm && parenNestingDepth === 1) {
              insideImportForm = false
            }
            if (insideNsForm && parenNestingDepth === 0) {
              insideNsForm = false
            }
          }
          closersIdx = inc(closersIdx)

          // increase the outer loop index as well (ie: skipping forward nodes)
          idx = inc(idx)
        }

        const isDoubleNewline = strIncludes(node.text, '\n\n')
        let newlineStr = '\n'
        if (isDoubleNewline) newlineStr = '\n\n'

        // print the newline and then the next line's indentation level
        // if we are not at the end of the nodes array
        if (inc(idx) < numNodes) {
          const topOfTheParenStack = stackPeek(parenStack, 0)
          const numSpacesOnNextLine = numSpacesAfterNewline(node)

          // are we inside of a parenStack that crosses into the next line?
          if (topOfTheParenStack && topOfTheParenStack._parenOpenerLineIdx === lineIdx) {
            // NOTE: we start this index at 1 in order to skip the first token on the paren opener line
            // ie: we want to look at tokens 2 or later for Rule 3 alignment
            let openingLineTokensIdx = 1
            const numOpeningLineTokens = arraySize(topOfTheParenStack._openingLineTokens)
            while (openingLineTokensIdx < numOpeningLineTokens) {
              const openingLineToken = topOfTheParenStack._openingLineTokens[openingLineTokensIdx]
              if (openingLineToken._colIdx === numSpacesOnNextLine) {
                // the first token on this line is vertically aligned with a first-line token:
                // Rule 3 is activated 👍
                topOfTheParenStack._rule3Active = true
                topOfTheParenStack._rule3NumSpaces = numSpacesOnNextLine

                // we can exit the loop now
                openingLineTokensIdx = inc(numOpeningLineTokens)
              }

              openingLineTokensIdx = inc(openingLineTokensIdx)
            }
          }

          let numSpaces = 0
          if (topOfTheParenStack && topOfTheParenStack._rule3Active) {
            numSpaces = topOfTheParenStack._rule3NumSpaces
          } else {
            numSpaces = numSpacesForIndentation(topOfTheParenStack)
          }

          const indentationStr = repeatString(' ', numSpaces)
          outTxt = strConcat(outTxt, strConcat(newlineStr, indentationStr))

          // reset the colIdx
          colIdx = strLen(indentationStr)

          // increment the lineIdx
          lineIdx = inc(lineIdx)
          if (isDoubleNewline) {
            lineIdx = inc(lineIdx)
          }
        }
      } else if (isNonEmptyTextNode(node)) {
        const isTokenFollowedByOpener = isTokenNode(node) && nextTextNode && isParenOpener(nextTextNode)
        const isParenCloserFollowedByText = isParenCloser(node) && nextTextNode && (isTokenNode(nextTextNode) || isParenOpener(nextTextNode))
        const addSpaceAfterThisNode = isTokenFollowedByOpener || isParenCloserFollowedByText

        if (isLastNode && isWhitespaceNode(node)) {
          skipPrintingThisNode = true
        }

        // how to ns: Use keywords, not symbols, for :refer-clojure, :require, and :import
        // https://stuartsierra.com/2016/clojure-how-to-ns.html#keywords-or-symbols
        if (insideNsForm && parenNestingDepth === 2 && isTokenNode(node)) {
          if (node.text === 'require') {
            node.text = ':require'
          } else if (node.text === 'import') {
            node.text = ':import'
          } else if (node.text === 'refer-clojure') {
            node.text = ':refer-clojure'
          }
        }

        // add the text of this node to the output String
        if (!skipPrintingThisNode) {
          outTxt = strConcat(outTxt, node.text)
          outputTxtContainsChars = true
        }

        if (addSpaceAfterThisNode) {
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

  // ---------------------------------------------------------------------------
  // Public API

  // parses inputTxt and returns an tree structure of the code
  function parse (inputTxt) {
    return getParser('source').parse(inputTxt, 0)
  }

  const API = {
    format,
    parse
  }

  // dev flag: toggle this in order to test the internal functions
  const exportInternalFnsForTesting = true

  if (exportInternalFnsForTesting) {
    API._charAt = charAt
    API._substr = substr

    API._AnyChar = AnyChar
    API._Char = Char
    API._Choice = Choice
    API._Regex = Regex
    API._Repeat = Repeat
    API._Seq = Seq

    API._flattenTree = flattenTree
    API._parseNs = parseNs
  }

  return API
})) // end module anonymous scope
