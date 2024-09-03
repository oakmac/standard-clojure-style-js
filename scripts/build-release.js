#! /usr/bin/env node

// This file creates a release in the dist/ folder
//
// ISC License
// Copyright © 2024, Chris Oakman
// https://github.com/oakmac/standard-clojure-style-js/

const assert = require('assert')
const fs = require('fs-plus')
const path = require('path')
const terser = require('terser')

const rootDir = path.join(__dirname, '../')
const libFilename = path.join(rootDir, 'lib/standard-clojure-style.js')
const lib = require(libFilename)

// ensure the dev flags have been disabled
assert(lib, 'lib not found?')
assert(!isFunction(lib._charAt), 'please disable the dev flags before publishing')

const encoding = { encoding: 'utf8' }

const copyrightYear = '2023'
const packageJSON = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), encoding))
const version = packageJSON.version

// update cli.mjs to import from dist/ instead of lib/
const cliFilename = path.join(rootDir, 'cli.mjs')
const cliSrc = fs.readFileSync(cliFilename, 'utf8')
const updatedCliSrc = cliSrc.replace("import standardClj from './lib/standard-clojure-style.js'", "import standardClj from './dist/standard-clojure-style.js'")
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
