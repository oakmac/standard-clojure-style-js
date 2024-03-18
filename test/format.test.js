/* global test expect */

const fs = require('fs-plus')
const path = require('path')

const enolib = require('enolib')
const clojurefmtLib = require('../lib/clojurefmt.js')

const rootDir = path.join(__dirname, '../')

const isEnoFile = (f) => {
  return path.extname(f) === '.eno'
}

// returns an Array of all the .eno files in the test_format/ folder
const enoFilesInTestFormatDir = () => {
  const allFiles = fs.readdirSync(path.join(rootDir, 'test_format/'))
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

enoFilesInTestFormatDir().forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_format', f), 'utf8')
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

test('All test_format/ cases should have unique names', () => {
  expect(uniqueTestCaseNames.size).toBe(allTestCases.length)
})

// dev convenience: set this to true and add specific test cases
// only those cases will run
const onlyRunCertainTests = true
const certainTests = new Set()
certainTests.add('how to ns: sort refer-clojure, require, import')

const ignoreSomeTests = false
const ignoreTests = new Set()
ignoreTests.add('Rule 3 Indentation')

allTestCases.forEach(testCase => {
  let runThisTest = true
  if (onlyRunCertainTests && !certainTests.has(testCase.name)) runThisTest = false
  else if (ignoreSomeTests && ignoreTests.has(testCase.name)) runThisTest = false

  if (runThisTest) {
    test(testCase.filename + ': ' + testCase.name, () => {
      const result = clojurefmtLib.format(testCase.input)

      if (onlyRunCertainTests) {
        console.log(result.out)
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
      }

      expect(result.status).toBe('success')
      expect(result.out).toBe(testCase.expected)
    })

    // add one-off tests for trailing whitespace
    // NOTE: my editor keeps trimming trailing whitespace on the format.eno file, so
    // this test case catches when that happens
    if (testCase.name === 'Trim trailing whitespace 1') {
      test('Trim trailing whitespace test case should not be trimmed', () => {
        expect(testCase.input.endsWith(')   ')).toBe(true)
      })
    }
    if (testCase.name === 'Trim trailing whitespace 2') {
      test('Trim trailing whitespace test case should not be trimmed', () => {
        expect(testCase.input.includes('"aaa"   \n)(def')).toBe(true)
      })
    }
  }
})
