/* global test expect */

const fs = require('fs-plus')
const path = require('path')

const enolib = require('enolib')
const scsLib = require('../lib/standard-clojure-style.js')

const rootDir = path.join(__dirname, '../')

const isEnoFile = (f) => {
  return path.extname(f) === '.eno'
}

// returns an Array of all the .eno files in the test_parser/ folder
const enoFilesInTestParserDir = () => {
  const allFiles = fs.readdirSync(path.join(rootDir, 'test_parser/'))
  return allFiles.filter(isEnoFile)
}

let allTestCases = []

// parses a test .eno file and returns an Array of Objects like { input, expected, name }
const parseTestFile = (txt) => {
  const document = enolib.parse(txt)
  const sections = document.sections()

  const tests = []
  sections.forEach((s) => {
    tests.push({
      filename: s.filename,
      name: s._instruction.key,
      input: s.field('Input').requiredStringValue(),
      expected: s.field('Expected').requiredStringValue()
    })
  })
  return tests
}

enoFilesInTestParserDir().forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_parser', f), 'utf8')
  const testsInFile = parseTestFile(testFileContents)
  const testsWithFilename = testsInFile.map(t => {
    t.filename = f
    return t
  })
  allTestCases = allTestCases.concat(testsWithFilename)
})

function compareTestCases (testCaseA, testCaseB) {
  if (testCaseB.name > testCaseA.name) return -1
  else if (testCaseB.name < testCaseA.name) return 1
  else return 0
}

// sort the test cases by name
allTestCases.sort(compareTestCases)

// sanity-check that all of the test cases have unique names
const uniqueTestCaseNames = new Set()
allTestCases.forEach(testCase => {
  uniqueTestCaseNames.add(testCase.name)
})

test('All test_parser/ cases should have unique names', () => {
  expect(uniqueTestCaseNames.size).toBe(allTestCases.length)
})

const onlyRunCertainTests = false
const certainTests = new Set()
// certainTests.add('String with emoji')

const ignoreCertainTests = true
const ignoreTests = new Set()
ignoreTests.add('String with emoji')

allTestCases.forEach(testCase => {
  let runThisTest = true
  if (onlyRunCertainTests && !certainTests.has(testCase.name)) runThisTest = false
  if (ignoreCertainTests && ignoreTests.has(testCase.name)) runThisTest = false

  if (runThisTest) {
    test(testCase.filename + ': ' + testCase.name, () => {
      const tree = scsLib.parse(testCase.input)
      const treeStr = nodeToString(tree, 0)
      if (onlyRunCertainTests) {
        console.log(treeStr)
        console.log('--------------- tree ---------------')
      }
      expect(treeStr).toBe(testCase.expected)
    })
  }
})

// -----------------------------------------------------------------------------
// Print the node AST

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

// returns the length of an Array
function arraySize (a) {
  return a.length
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

// replaces all instances of findStr with replaceStr inside of String s
function strReplaceAll (s, findStr, replaceStr) {
  return s.replaceAll(findStr, replaceStr)
}

const numSpacesPerIndentLevel = 2

function isWhitespaceNode (n) {
  return n && isString(n.name) && (n.name === 'whitespace' || n.name === 'whitespace:newline')
}

// returns a String representation of an AST Node Object
function nodeToString (node, indentLevel) {
  // skip printing whitespace nodes for the parser test suite
  if (isWhitespaceNode(node)) {
    return ''
  } else {
    if (!isPositiveInt(indentLevel)) indentLevel = 0
    const indentationSpaces = repeatString(' ', indentLevel * numSpacesPerIndentLevel)

    let outTxt = ''
    if (node.name !== 'source') outTxt = '\n'

    outTxt = outTxt + indentationSpaces + '(' + node.name + ' ' + node.startIdx + '..' + node.endIdx

    if (node.text && node.text !== '') {
      const textWithNewlinesEscaped = strReplaceAll(node.text, '\n', '\\n')
      outTxt = outTxt + " '" + textWithNewlinesEscaped + "'"
    }

    if (node.children) {
      let i = 0
      const numChildren = arraySize(node.children)
      while (i < numChildren) {
        const childNode = node.children[i]
        outTxt = outTxt + nodeToString(childNode, indentLevel + 1)
        i = i + 1
      }
    }

    outTxt = outTxt + ')'
    return outTxt
  }
}
