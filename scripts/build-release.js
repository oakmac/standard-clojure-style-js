#! /usr/bin/env node

// ISC License
// Copyright © 2024, Chris Oakman
// https://github.com/oakmac/standard-clojure-style-js/
//
// This file creates a release in the dist/ folder, ready for publishing to npm.

const assert = require('assert')
const fs = require('fs-plus')
const path = require('path')
const terser = require('terser')

const rootDir = path.join(__dirname, '../')
const libFilename = path.join(rootDir, 'lib/standard-clojure-style.js')
const lib = require(libFilename)

// sanity-checks
assert(lib, libFilename + ' source file not found?')
assert(isFunction(lib._charAt), 'please ensure that exportInternalFnsForTesting = true before publishing')

const encoding = { encoding: 'utf8' }

const copyrightYear = '2023'
const packageJSON = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), encoding))
const version = packageJSON.version

// update cli.mjs to import from dist/ instead of lib/ and inject the version number
const cliFilename = path.join(rootDir, 'cli.mjs')
const cliSrc = fs.readFileSync(cliFilename, 'utf8')

const importLineToReplace = "import standardClj from './lib/standard-clojure-style.js' // 7b323d1c-2984-4bd1-9304-d62d8dee9a1f"
const importFromDistLine = "import standardClj from './dist/standard-clojure-style.js'"

const versionLineToReplace = "const programVersion = '[dev]' // 6444ef98-c603-42ca-97e7-ebe5c60382de"
const distVersionLine = "const programVersion = 'v" + version + "'"

// fail if we do not see the lines we expect
assert(cliSrc.includes(importLineToReplace), 'cli.mjs script is missing the import line we expect! something is off')
assert(cliSrc.includes(versionLineToReplace), 'cli.mjs script is missing the version line we expect! something is off')

const updatedCliSrc = cliSrc.replace(importLineToReplace, importFromDistLine)
  .replace(versionLineToReplace, distVersionLine)
fs.writeFileSync(cliFilename, updatedCliSrc)
infoLog('Updated cli.mjs to import from dist/ instead of lib/')

const libSrc = fs.readFileSync(libFilename, 'utf8')

assert(libSrc.includes('// standard-clojure-style @@VERSION@@'), '@@VERSION@@ template not found!')
assert(libSrc.includes('const exportInternalFnsForTesting = true // 24d4533f-0f94-4d9c-85f9-048aca1e19b6'), 'exportInternalFnsForTesting flag not found!')

const adjustedLibSrc = libSrc.replace('/* global define */', '')
  .replace('@@VERSION@@', 'v' + version)
  .replace('const exportInternalFnsForTesting = true // 24d4533f-0f94-4d9c-85f9-048aca1e19b6', 'const exportInternalFnsForTesting = false')
  .trim()

const terserResult = terser.minify_sync(adjustedLibSrc)
const minifiedSrc = terserResult.code

// sanity-check that minification succeeded
assert(isString(minifiedSrc), 'minification failed!')
assert(minifiedSrc !== '', 'minification failed!')

fs.removeSync('dist')
fs.makeTreeSync('dist')
infoLog('Creating dist/ folder for version ' + version)

// add license to the top of minified files
const minifiedJSWithBanner = banner() + minifiedSrc

const distReadableFile = path.join(rootDir, 'dist/standard-clojure-style.js')
fs.writeFileSync(distReadableFile, adjustedLibSrc, encoding)
infoLog('Wrote ' + distReadableFile)

const distMinifiedFile = path.join(rootDir, 'dist/standard-clojure-style.min.js')
fs.writeFileSync(distMinifiedFile, minifiedJSWithBanner, encoding)
infoLog('Wrote ' + distMinifiedFile)

infoLog('Success 👍')
process.exit(0)

// ---------------------------------------------------------------------------
// Util

function banner () {
  return '/*! Standard Clojure Style v' + version + ' | (c) ' + copyrightYear + ' Chris Oakman | ISC License | https://github.com/oakmac/standard-clojure-style-js */\n'
}

function isString (s) {
  return typeof s === 'string'
}

function isFunction (f) {
  return typeof f === 'function'
}

function infoLog (msg) {
  console.log('[scripts/build-release.js] ' + msg)
}
