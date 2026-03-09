#! /usr/bin/env node

// ISC License
// Copyright © 2024, Chris Oakman
// https://github.com/oakmac/standard-clojure-style-js/
//
// This file creates a release in the dist/ folder, ready for publishing to npm.

const assert = require('assert')
const { execSync } = require('child_process')
const fs = require('fs-plus')
const path = require('path')
const terser = require('terser')

const rootDir = path.join(__dirname, '../')

// ---------------------------------------------------------------------------
// Git safety checks
// These exist so you don't accidentally publish a bad release.
// ---------------------------------------------------------------------------

function git (cmd) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8' }).trim()
}

// 1. Working tree must be clean (no uncommitted changes)
const gitStatus = git('git status --porcelain')
if (gitStatus !== '') {
  console.error('[scripts/build-release.js] ERROR: git working tree is not clean!')
  console.error('Uncommitted changes:')
  console.error(gitStatus)
  console.error('')
  console.error('Please commit or stash your changes before building a release.')
  process.exit(1)
}

// 2. Current commit must have a version tag (like v1.0.0)
const tagsAtHead = git('git tag --points-at HEAD')
const versionTag = tagsAtHead.split('\n').find(t => t.startsWith('v'))
if (!versionTag) {
  console.error('[scripts/build-release.js] ERROR: current commit has no version tag!')
  console.error('Tags at HEAD: ' + (tagsAtHead || '(none)'))
  console.error('')
  console.error('Please tag the current commit before building a release:')
  console.error('  git tag v1.0.0')
  process.exit(1)
}

// 3. Extract the short git hash for the verbose version string
const shortHash = git('git rev-parse --short HEAD')

infoLog('Git tag: ' + versionTag)
infoLog('Git hash: ' + shortHash)
infoLog('Git working tree: clean ✓')

const libFilename = path.join(rootDir, 'lib/standard-clojure-style.js')
const lib = require(libFilename)

// sanity-checks
assert(lib, libFilename + ' source file not found?')
assert(isFunction(lib._charAt), 'please ensure that exportInternalFnsForTesting = true before publishing')

const encoding = { encoding: 'utf8' }

const copyrightYear = '2023'
const packageJSON = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), encoding))
const version = packageJSON.version

// 4. Verify that the git tag matches package.json version
const expectedTag = 'v' + version
if (versionTag !== expectedTag) {
  console.error('[scripts/build-release.js] ERROR: git tag does not match package.json version!')
  console.error('  git tag:         ' + versionTag)
  console.error('  package.json:    v' + version)
  console.error('')
  console.error('Please make sure these match before building a release.')
  process.exit(1)
}

infoLog('package.json version matches git tag ✓')

// update cli.mjs to import from dist/ instead of lib/ and inject the version number
const cliFilename = path.join(rootDir, 'cli.mjs')
const cliSrc = fs.readFileSync(cliFilename, 'utf8')

const importLineToReplace = "import standardClj from './lib/standard-clojure-style.js' // 7b323d1c-2984-4bd1-9304-d62d8dee9a1f"
const importFromDistLine = "import standardClj from './dist/standard-clojure-style.js'"

const versionLineToReplace = "const programVersion = '[dev]' // 6444ef98-c603-42ca-97e7-ebe5c60382de"
const distVersionLine = "const programVersion = 'v" + version + "'"

const verboseVersionLineToReplace = "const programVersionVerbose = '[dev]' // 890d2c4a-b7e1-4f3a-9c56-8a1d3e5f7b92"
const distVerboseVersionLine = "const programVersionVerbose = 'v" + version + ' [' + shortHash + "]'"

// fail if we do not see the lines we expect
assert(cliSrc.includes(importLineToReplace), 'cli.mjs script is missing the import line we expect! something is off')
assert(cliSrc.includes(versionLineToReplace), 'cli.mjs script is missing the version line we expect! something is off')
assert(cliSrc.includes(verboseVersionLineToReplace), 'cli.mjs script is missing the verbose version line we expect! something is off')

const updatedCliSrc = cliSrc.replace(importLineToReplace, importFromDistLine)
  .replace(versionLineToReplace, distVersionLine)
  .replace(verboseVersionLineToReplace, distVerboseVersionLine)
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
