#!/usr/bin/env node

// The purpose of this file is to generate test cases as JSON files for the other language ports.

const fs = require('fs-plus')
const path = require('path')
const enolib = require('enolib')

const rootDir = path.join(__dirname, '../')

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
      name: s._instruction.key,
      input: s.field('Input').requiredStringValue(),
      expected: s.field('Expected').requiredStringValue()
    })
  })
  return tests
}

enoFilesInDir('test_format/').forEach((f) => {
  const enoFileTxt = fs.readFileSync(path.join(rootDir, 'test_format', f), 'utf8')
  const testCases = parseTestFile(enoFileTxt)
  formatTestCases = formatTestCases.concat(testCases)
})

let parserTestCases = []

enoFilesInDir('test_parser/').forEach((f) => {
  const enoFileTxt = fs.readFileSync(path.join(rootDir, 'test_parser', f), 'utf8')
  const testCases = parseTestFile(enoFileTxt)
  parserTestCases = parserTestCases.concat(testCases)
})

let parseNsTestCases = []

enoFilesInDir('test_parse_ns/').forEach((f) => {
  const enoFileTxt = fs.readFileSync(path.join(rootDir, 'test_parse_ns', f), 'utf8')
  const testCases = parseTestFile(enoFileTxt)
  parseNsTestCases = parseNsTestCases.concat(testCases)
})

const writeFilesToLocalDir = false
if (writeFilesToLocalDir) {
  fs.removeSync('test_cases_json')
  fs.makeTreeSync('test_cases_json')
  fs.writeFileSync('test_cases_json/format_tests.json', JSON.stringify(formatTestCases, null, 2))
  fs.writeFileSync('test_cases_json/parser_tests.json', JSON.stringify(parserTestCases, null, 2))
  fs.writeFileSync('test_cases_json/parse_ns_tests.json', JSON.stringify(parseNsTestCases, null, 2))
}

// copy the files to standard-clojure-style-lua/test_cases if it exists
const luaTestFilesDir = path.join(rootDir, '../standard-clojure-style-lua/test_cases')
if (fs.isDirectorySync(luaTestFilesDir)) {
  fs.writeFileSync(path.join(luaTestFilesDir, 'format_tests.json'), JSON.stringify(formatTestCases, null, 2) + '\n')
  fs.writeFileSync(path.join(luaTestFilesDir, 'parser_tests.json'), JSON.stringify(parserTestCases, null, 2) + '\n')
  fs.writeFileSync(path.join(luaTestFilesDir, 'parse_ns_tests.json'), JSON.stringify(parseNsTestCases, null, 2) + '\n')
  console.log('Wrote test files to ' + luaTestFilesDir)
}

// -----------------------------------------------------------------------------
// Util

function isEnoFile (f) {
  return path.extname(f) === '.eno'
}
