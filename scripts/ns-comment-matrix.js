// Comment placement matrix for the ns form.
//
// Generates every combination of:
//   - section:  :refer-clojure, :require, :require-macros, :import, :gen-class
//   - position: comment above the section, after the keyword, after an item,
//               after the last item (closing paren on the next line),
//               after the section's closing paren, after the ns form's closing paren
//   - kind:     line comment (;; c1) or discard form (#_ :c1)
//   - whether the section is the last main form in the input
//
// and checks each cell with four oracles that need no hand-written expected output:
//   1. format() succeeds
//   2. the output is idempotent (formatting it again changes nothing)
//   3. the comment appears in the output exactly once
//   4. the output has balanced brackets (checked with the formatter's own parser)
//
// Usage:
//   node scripts/ns-comment-matrix.js          report every cell: clean / problem, and
//                                              whether it is already in the .eno file
//   node scripts/ns-comment-matrix.js --eno    print .eno test cases for the clean cells
//                                              that are not yet in the .eno file, ready
//                                              to review and append
//
// The test cases live in test_format/ns_comment_matrix.eno. Cells with a problem
// belong to an open issue and should be added there once the issue is fixed.
// https://github.com/oakmac/standard-clojure-style-js/issues/237

const fs = require('fs')
const path = require('path')
const scs = require('../lib/standard-clojure-style.js')

const enoFilePath = path.join(__dirname, '../test_format/ns_comment_matrix.eno')

// returns the text of one section with comment c placed at pos
const sections = {
  'refer-clojure': (pos, c) => {
    if (pos === 'above') return c + '\n  (:refer-clojure :exclude [get assoc])'
    if (pos === 'afterKeyword') return '(:refer-clojure ' + c + '\n    :exclude [get assoc])'
    if (pos === 'afterItem') return '(:refer-clojure :exclude [get ' + c + '\n                            assoc])'
    if (pos === 'afterLastItem') return '(:refer-clojure :exclude [get assoc ' + c + '\n                            ])'
    if (pos === 'afterClose') return '(:refer-clojure :exclude [get assoc]) ' + c
    return '(:refer-clojure :exclude [get assoc])'
  },
  require: (pos, c) => {
    if (pos === 'above') return c + '\n  (:require [a.b] [c.d])'
    if (pos === 'afterKeyword') return '(:require ' + c + '\n    [a.b] [c.d])'
    if (pos === 'afterItem') return '(:require [a.b] ' + c + '\n            [c.d])'
    if (pos === 'afterLastItem') return '(:require [a.b] [c.d] ' + c + '\n            )'
    if (pos === 'afterClose') return '(:require [a.b] [c.d]) ' + c
    return '(:require [a.b] [c.d])'
  },
  'require-macros': (pos, c) => {
    if (pos === 'above') return c + '\n  (:require-macros [m.a] [m.b])'
    if (pos === 'afterKeyword') return '(:require-macros ' + c + '\n    [m.a] [m.b])'
    if (pos === 'afterItem') return '(:require-macros [m.a] ' + c + '\n                   [m.b])'
    if (pos === 'afterLastItem') return '(:require-macros [m.a] [m.b] ' + c + '\n                   )'
    if (pos === 'afterClose') return '(:require-macros [m.a] [m.b]) ' + c
    return '(:require-macros [m.a] [m.b])'
  },
  import: (pos, c) => {
    if (pos === 'above') return c + '\n  (:import (java.util Date) (java.io File))'
    if (pos === 'afterKeyword') return '(:import ' + c + '\n    (java.util Date) (java.io File))'
    if (pos === 'afterItem') return '(:import (java.util Date) ' + c + '\n           (java.io File))'
    if (pos === 'afterLastItem') return '(:import (java.util Date) (java.io File) ' + c + '\n           )'
    if (pos === 'afterClose') return '(:import (java.util Date) (java.io File)) ' + c
    return '(:import (java.util Date) (java.io File))'
  },
  'gen-class': (pos, c) => {
    if (pos === 'above') return c + '\n  (:gen-class :name foo.Bar :extends Object)'
    if (pos === 'afterKeyword') return '(:gen-class ' + c + '\n    :name foo.Bar :extends Object)'
    if (pos === 'afterItem') return '(:gen-class :name foo.Bar ' + c + '\n              :extends Object)'
    if (pos === 'afterLastItem') return '(:gen-class :name foo.Bar :extends Object ' + c + '\n              )'
    if (pos === 'afterClose') return '(:gen-class :name foo.Bar :extends Object) ' + c
    return '(:gen-class :name foo.Bar :extends Object)'
  }
}

// the section that follows, to make the commented section "not last" in the input
const followers = {
  'refer-clojure': '(:require [z.z])',
  require: '(:import (java.net URI))',
  'require-macros': '(:require [z.z])',
  import: '(:gen-class :name foo.Baz)',
  'gen-class': '(:import (java.net URI))'
}

const positions = ['above', 'afterKeyword', 'afterItem', 'afterLastItem', 'afterClose', 'afterNsClose']

const positionLabels = {
  above: 'comment above',
  afterKeyword: 'comment after keyword',
  afterItem: 'comment after item',
  afterLastItem: 'comment after last item',
  afterClose: 'comment after closing paren',
  afterNsClose: 'comment after ns closing paren'
}

const kinds = {
  comment: ';; c1',
  discard: '#_ :c1'
}

function buildInput (sectionName, pos, commentTxt, isLast) {
  let body = '  ' + sections[sectionName](pos, commentTxt)
  if (!isLast) body += '\n  ' + followers[sectionName]

  // NOTE: a line comment after the closing paren of the last section would swallow
  // the ns form's closing paren, so put that paren on its own line
  let input = null
  if (pos === 'afterClose' && isLast) {
    input = '(ns foo\n' + body + '\n  )'
  } else {
    input = '(ns foo\n' + body + ')'
  }

  if (pos === 'afterNsClose') input += ' ' + commentTxt

  // some code after the ns form, so the line that closes the ns form is exercised too
  input += '\n\n(def x 1)'

  return input
}

function countOccurrences (s, needle) {
  return s.split(needle).length - 1
}

// Returns an Object describing the bracket balance of txt, using the formatter's own
// parser so that brackets inside strings, regex literals, character literals and
// comments are not counted. A missing closer leaves an unmatched .open node, so
// numOpen !== numClose. A stray closer becomes an error node, listed in strayClosers.
// Same check as the "balanced brackets" assertion in test/format.test.js
// https://github.com/oakmac/standard-clojure-style-js/issues/256
function bracketBalance (txt) {
  const nodes = scs._flattenTree(scs.parse(txt))
  let numOpen = 0
  let numClose = 0
  const strayClosers = []
  nodes.forEach(node => {
    if (node.name === '.open') numOpen = numOpen + 1
    else if (node.name === '.close') numClose = numClose + 1
    else if (node.name === 'error') strayClosers.push(node.text)
  })
  return { numOpen, numClose, strayClosers }
}

// returns an Array of problems with this cell (empty when the cell is clean)
function checkCell (input, commentTxt) {
  const result = scs.format(input)
  if (result.status !== 'success') return ['ERROR: ' + result.reason]

  const problems = []
  const secondPass = scs.format(result.out)
  if (secondPass.out !== result.out) problems.push('not idempotent')

  const numComments = countOccurrences(result.out, commentTxt)
  if (numComments === 0) problems.push('comment dropped')
  else if (numComments > 1) problems.push('comment duplicated x' + numComments)

  const balance = bracketBalance(result.out)
  if (balance.numOpen !== balance.numClose) {
    problems.push('unbalanced brackets (' + balance.numOpen + ' open, ' + balance.numClose + ' close)')
  }
  if (balance.strayClosers.length > 0) {
    problems.push('stray closing bracket: ' + balance.strayClosers.join(' '))
  }

  return problems
}

function buildCells () {
  const cells = []
  Object.keys(sections).forEach(sectionName => {
    positions.forEach(pos => {
      Object.keys(kinds).forEach(kindName => {
        [true, false].forEach(isLast => {
          const commentTxt = kinds[kindName]
          const input = buildInput(sectionName, pos, commentTxt, isLast)
          const lastLabel = isLast ? 'last main form' : 'not last main form'
          cells.push({
            name: 'ns comment matrix: ' + positionLabels[pos] + ' - ' + sectionName + ' - ' + kindName + ' - ' + lastLabel,
            input,
            output: scs.format(input).out,
            problems: checkCell(input, commentTxt)
          })
        })
      })
    })
  })
  return cells
}

// returns a Set of the test case names already in the .eno file
function namesInEnoFile () {
  const names = new Set()
  if (!fs.existsSync(enoFilePath)) return names
  const txt = fs.readFileSync(enoFilePath, 'utf8')
  txt.split('\n').forEach(line => {
    if (line.startsWith('# ')) names.add(line.substring(2).trim())
  })
  return names
}

function toEnoCase (cell) {
  return '\n# ' + cell.name + '\n\n' +
    '--Input\n' + cell.input + '\n--Input\n\n' +
    '--Expected\n' + cell.output + '\n--Expected\n'
}

function printReport (cells, existingNames) {
  let numClean = 0
  let numInFile = 0
  const problemCells = []
  const cleanButMissing = []
  const inFileWithProblem = []

  cells.forEach(cell => {
    const inFile = existingNames.has(cell.name)
    if (inFile) numInFile = numInFile + 1
    if (cell.problems.length === 0) {
      numClean = numClean + 1
      if (!inFile) cleanButMissing.push(cell)
    } else {
      problemCells.push(cell)
      if (inFile) inFileWithProblem.push(cell)
    }
  })

  console.log(cells.length + ' cells, ' + numClean + ' clean, ' + problemCells.length + ' with problems, ' + numInFile + ' in ' + path.basename(enoFilePath))

  if (problemCells.length > 0) {
    console.log('\nCells with problems:')
    problemCells.forEach(cell => console.log('  ' + cell.name + '  [' + cell.problems.join(', ') + ']'))
  }

  if (inFileWithProblem.length > 0) {
    console.log('\nWARNING: cells in the .eno file that now have a problem:')
    inFileWithProblem.forEach(cell => console.log('  ' + cell.name + '  [' + cell.problems.join(', ') + ']'))
  }

  if (cleanButMissing.length > 0) {
    console.log('\nClean cells not yet in the .eno file (review their output, then add with --eno):')
    cleanButMissing.forEach(cell => console.log('  ' + cell.name))
  }
}

function printEnoForMissingCleanCells (cells, existingNames) {
  cells.forEach(cell => {
    if (cell.problems.length === 0 && !existingNames.has(cell.name)) {
      process.stdout.write(toEnoCase(cell))
    }
  })
}

const cells = buildCells()
const existingNames = namesInEnoFile()

if (process.argv.includes('--eno')) {
  printEnoForMissingCleanCells(cells, existingNames)
} else {
  printReport(cells, existingNames)
}
