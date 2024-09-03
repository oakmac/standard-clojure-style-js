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
assert(!isFunction(lib._charAt), 'please disable the exportInternalFnsForTesting flag before publishing')

const encoding = { encoding: 'utf8' }

const copyrightYear = '2023'
const packageJSON = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), encoding))
const version = packageJSON.version

// update cli.mjs to import from dist/ instead of lib/
const cliFilename = path.join(rootDir, 'cli.mjs')
const cliSrc = fs.readFileSync(cliFilename, 'utf8')

const importLineToReplace = "import standardClj from './lib/standard-clojure-style.js' // 7b323d1c-2984-4bd1-9304-d62d8dee9a1f"
const importFromDistLine = "import standardClj from './dist/standard-clojure-style.js'"

// fail if we do not see the import line we are expecting here
assert(cliSrc.includes(importLineToReplace), 'cli.mjs script is missing the import line we expect! something is off')

const updatedCliSrc = cliSrc.replace(importLineToReplace, importFromDistLine)
fs.writeFileSync(cliFilename, updatedCliSrc)
infoLog('Updated cli.mjs to import from dist/ instead of lib/')

const libSrc = fs.readFileSync(libFilename, 'utf8')
  .replace('/* global define */', '')
  .replace('@@VERSION@@', 'v' + version)
  .trim()

const terserResult = terser.minify_sync(libSrc)
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
fs.writeFileSync(distReadableFile, libSrc, encoding)
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
