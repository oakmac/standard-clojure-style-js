/* global test expect */

const enolib = require('enolib')
const fs = require('fs-plus')
const immutable = require('immutable')
const path = require('path')
const scsLib = require('../lib/standard-clojure-style.js')

const rootDir = path.join(__dirname, '../')

const isEnoFile = (f) => {
  return path.extname(f) === '.eno'
}

// returns an Array of all the .eno files in the test_parse_ns/ folder
const enoFilesInTestFormatDir = () => {
  const allFiles = fs.readdirSync(path.join(rootDir, 'test_parse_ns/'))
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
      expected: JSON.parse(s.field('Expected').requiredStringValue())
    })
  })
  return tests
}

enoFilesInTestFormatDir().forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_parse_ns', f), 'utf8')
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

test('All test_parse_ns/ cases should have unique names', () => {
  expect(uniqueTestCaseNames.size).toBe(allTestCases.length)
})

// dev convenience: set this to true and add specific test cases
// only those cases will run
const onlyRunSpecificTests = false
const specificTests = new Set()
specificTests.add('refer-clojure with reader conditionals 1')

const ignoreSomeTests = false
const ignoreTests = new Set()
ignoreTests.add('gen-class with name and main')

// only run these tests if the _parseNs function is exposed
if (isFn(scsLib._parseNs)) {
  allTestCases.forEach(testCase => {
    // FIXME: input should parse without errors
    // FIXME: Expected should be valid JSON

    let runThisTest = true
    if (onlyRunSpecificTests && !specificTests.has(testCase.name)) runThisTest = false
    else if (ignoreSomeTests && ignoreTests.has(testCase.name)) runThisTest = false

    if (runThisTest) {
      test(testCase.filename + ': ' + testCase.name, () => {
        const inputNodes = scsLib.parse(testCase.input)
        const flatNodes = scsLib._flattenTree(inputNodes)
        const nsParsed1 = scsLib._parseNs(flatNodes)

        const nsParsed2 = immutable.fromJS(nsParsed1)
        const nsExpected = immutable.fromJS(testCase.expected)
        const resultIsTheSame = immutable.is(nsParsed2, nsExpected)

        if (!resultIsTheSame) {
          console.log('ns parsed:', JSON.stringify(nsParsed1, null, 2))
        }

        expect(resultIsTheSame).toBe(true)
      })
    }
  })
}

// -----------------------------------------------------------------------------
// Util

function isFn (f) {
  return typeof f === 'function'
}
