#! /usr/bin/env node

// This file creates a release in the dist/ folder
//
// ISC License
// Copyright © 2024, Chris Oakman
// https://github.com/oakmac/standard-clojure-style-js/

const assert = require('assert')
const fs = require('fs-plus')
const terser = require('terser')

const encoding = { encoding: 'utf8' }

const copyrightYear = '2024'
const packageJSON = JSON.parse(fs.readFileSync('package.json', encoding))
const version = packageJSON.version

const libSrc = fs.readFileSync('lib/standard-clojure-style.js', 'utf8')
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

const distReadableFile = 'dist/standard-clojure-style.js'
fs.writeFileSync(distReadableFile, libSrc, encoding)
infoLog('Wrote ' + distReadableFile)

const distMinifiedFile = 'dist/standard-clojure-style.min.js'
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

function infoLog (msg) {
  console.log('[scripts/build-release.js] ' + msg)
}
