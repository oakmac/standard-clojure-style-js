/* global test expect */

const fs = require('fs-plus')
const path = require('path')

const enolib = require('enolib')
const clojurefmtLib = require('../lib/clojurefmt.js')

const rootDir = path.join(__dirname, '../')

const isEnoFile = (f) => {
  return path.extname(f) === '.eno'
}

// returns an Array of all the .eno files in the test_printer/ folder
const enoFilesInTestPrinterDir = () => {
  const allFiles = fs.readdirSync(path.join(rootDir, 'test_printer/'))
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

enoFilesInTestPrinterDir().forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_printer', f), 'utf8')
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

test('All test_printer/ cases should have unique names', () => {
  expect(uniqueTestCaseNames.size).toBe(allTestCases.length)
})

const onlyRunCertainTests = true
const certainTests = new Set()
// certainTests.add('Simple Indentation')
// certainTests.add('Multiple Indentation Levels')
// certainTests.add('Close Wrapping Parens')
// certainTests.add('Close Wrapping Parens 2')
certainTests.add('Do not cross previous line last opener')

const ignoreCertainTests = true
const ignoreTests = new Set()
ignoreTests.add('String with emoji')

allTestCases.forEach(testCase => {
  let runThisTest = true
  if (onlyRunCertainTests && !certainTests.has(testCase.name)) runThisTest = false
  if (ignoreCertainTests && ignoreTests.has(testCase.name)) runThisTest = false

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
  }
})
