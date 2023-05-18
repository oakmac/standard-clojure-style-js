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

const onlyRunCertainTests = false
const certainTests = new Set()
// certainTests.add('Keyword')
// certainTests.add('Keyword with Prefix')
// certainTests.add('Autoresolving Keyword')
// certainTests.add('Autoresolving Aliased Keyword')
// certainTests.add('Simple Regular Expression')
// certainTests.add('Simple String')
certainTests.add('Empty Anonymous Function')

const ignoreCertainTests = false
const ignoreTests = new Set()
ignoreTests.add('Empty Anonymous Function')
// ignoreTests.add('Empty Anonymous Function Gap')
// ignoreTests.add('Simple Regular Expression')

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
