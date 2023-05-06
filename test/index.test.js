const fs = require('fs-plus')
const path = require('path')

const enolib = require('enolib')
  const clojurefmt = require('../lib/clojurefmt.js')

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

// const foo1 = require('../lib')

// test('test1', () => {
//   expect(foo1('aaa', 'bbb')).toBe('zzz')
// })

// console.log(allTestCases)

allTestCases.forEach(testCase => {
  test(testCase.name, () => {
    expect(clojurefmt(testCase.input)).toBe(testCase.expected)
  })
})
