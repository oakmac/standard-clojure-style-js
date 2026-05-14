#! /usr/bin/env node

// Dump codebase files into a single text file for easy LLM consumption
const fs = require('fs')
const { globSync } = require('glob')

// ====================== FILE LIST ======================
const patterns = [
  'README.md',
  'lib/standard-clojure-style.js',

  // 'cli.mjs',
  // 'cli_util.js',
  // 'test/cli_util.test.js',

  'test/format.test.js',
  'test/internals.test.js',
  'test/parse_ns.test.js',
  'test/parser.test.js',

  'test_format/*.eno',
  'test_parse_ns/*.eno'

  // 'test_parser/*.eno'
]
// ======================================================

const files = patterns.flatMap((p) => globSync(p, { nodir: true }).sort()).filter(
  (f, i, arr) => arr.indexOf(f) === i // dedupe
)

let outTxt = ''
files.forEach((f) => {
  const fileContents = fs.readFileSync(f, 'utf8')
  outTxt += '\n<DUMP:FILE path="' + f + '">\n'
  outTxt += fileContents + '\n'
  outTxt += '</DUMP:FILE>\n'
  console.log('Dumping:', f)
})

fs.writeFileSync('code_dump.txt', outTxt)
console.log(`\nDone! ${files.length} files written to code_dump.txt`)
