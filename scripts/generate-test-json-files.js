#!/usr/bin/env node

const fs = require('fs-plus')
const path = require('path')

const enolib = require('enolib')
// const scsLib = require('../lib/standard-clojure-style.js')

const rootDir = path.join(__dirname, '../')

// // returns an Array of all the .eno files in the test_format/ folder
// const enoFilesInTestFormatDir = () => {
//   const allFiles = fs.readdirSync(path.join(rootDir, 'test_format/'))
//   return allFiles.filter(isEnoFile)
// }

function enoFilesInDir (dir) {
  const allFiles = fs.readdirSync(path.join(rootDir, dir))
  return allFiles.filter(isEnoFile)
}

let formatTestCases = []

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

enoFilesInDir('test_format/').forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_format', f), 'utf8')
  const testsInFile = parseTestFile(testFileContents)
  const testsWithFilename = testsInFile.map(t => {
    t.filename = f
    return t
  })
  formatTestCases = formatTestCases.concat(testsWithFilename)
})

let parserTestCases = []

enoFilesInDir('test_parser/').forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_parser', f), 'utf8')
  const testsInFile = parseTestFile(testFileContents)
  const testsWithFilename = testsInFile.map(t => {
    t.filename = f
    return t
  })
  parserTestCases = parserTestCases.concat(testsWithFilename)
})

let parseNsTestCases = []

enoFilesInDir('test_parse_ns/').forEach((f) => {
  const testFileContents = fs.readFileSync(path.join(rootDir, 'test_parse_ns', f), 'utf8')
  const testsInFile = parseTestFile(testFileContents)
  const testsWithFilename = testsInFile.map(t => {
    t.filename = f
    return t
  })
  parseNsTestCases = parseNsTestCases.concat(testsWithFilename)
})

fs.writeFileSync('test_cases_json/format_tests.json', JSON.stringify(formatTestCases, null, 2))
fs.writeFileSync('test_cases_json/parser_tests.json', JSON.stringify(parserTestCases, null, 2))
fs.writeFileSync('test_cases_json/parse_ns_tests.json', JSON.stringify(parseNsTestCases, null, 2))

// -----------------------------------------------------------------------------
// Util

function isEnoFile (f) {
  return path.extname(f) === '.eno'
}

// function compareTestCases (testCaseA, testCaseB) {
//   if (testCaseB.name > testCaseA.name) return -1
//   else if (testCaseB.name < testCaseA.name) return 1
//   else return 0
// }

// function isString (s) {
//   return typeof s === 'string'
// }
