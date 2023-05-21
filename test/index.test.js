/* global test expect */

const fs = require('fs-plus')
const path = require('path')

const enolib = require('enolib')
const clojurefmtLib = require('../lib/clojurefmt.js')

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
  allTestCases = allTestCases.concat(testsInFile)
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

test('All test cases should have unique names', () => {
  expect(uniqueTestCaseNames.size).toBe(allTestCases.length)
})

const onlyRunCertainTests = false
const certainTests = new Set()
// certainTests.add('Division Symbol followed by delimiter')
certainTests.add('Map Lookup')

const ignoreCertainTests = true
const ignoreTests = new Set()
ignoreTests.add('Vector with Different Types')

const logOutput = false

allTestCases.forEach(testCase => {
  let runThisTest = true
  if (onlyRunCertainTests && !certainTests.has(testCase.name)) runThisTest = false
  if (ignoreCertainTests && ignoreTests.has(testCase.name)) runThisTest = false

  if (runThisTest) {
    test(testCase.name, () => {
      const ast = clojurefmtLib.parseAst(testCase.input)
      const treeStr = clojurefmtLib.astToString(ast)
      if (logOutput) {
        console.log(treeStr)
        console.log('ttttttttttttttttttttttttttttttttttttttttttttttttttt')
      }
      expect(treeStr).toBe(testCase.expected)
    })
  }
})
