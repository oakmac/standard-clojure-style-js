#!/usr/bin/env node

// The purpose of this file is to handle everything related to running
// Standard Clojure Style via the command line.
//
// Copyright 2023 © Chris Oakman
// ISC License
// https://github.com/oakmac/standard-clojure-style-js/

const fs = require('fs-plus')
const path = require('path')
const process = require('process')

const globLib = require('glob')
const yargs = require('yargs')

const standardClj = require('./lib/standard-clojure-style.js')

// https://clig.dev/#the-basics
// Return zero exit code on success, non-zero on failure. Exit codes are how scripts determine whether a program succeeded or failed, so you should report this correctly. Map the non-zero exit codes to the most important failure modes.

// command: list
// lists the files that would be formatted
// --json or --edn option
//
// --verbose, --chatty-kathy
// provide lots of information about what the script is doing
//
// command: format
// formats the files "in-place"
//

const defaultFileExtensions = ['clj', 'cljs', 'cljc', 'edn']

// FIXME: write an async version of this that returns a Promise
// function formatFileAsync (filename) {
//   const fileTxt = fs.readFileSync(filename, 'utf8')
//   const result = standardClj.format(fileTxt)

//   if (result.status === 'success') {
//     fs.writeFileSync(filename, result.out)
//   } else {
//     console.error('FIXME: format() returned error, need to handle this case')
//   }
// }

// this is the directory where the script is being called from
// in most cases, this will be a project root
const rootDir = process.cwd()

// returns a Set of files from the args passed to the "list" or "format" commands
function getFilesFromArgv (argv) {
  // remove the first item, which is the command
  argv._.shift()
  const directArgs = argv._

  const fileExtensionsStr = argv['file-ext']

  let files = []

  directArgs.forEach(arg => {
    let possibleFileOrDir = arg
    if (!fs.isAbsolute(arg)) {
      // if the argument is not an absolute path, assume it is relative to the
      // directory where the script is being run from
      possibleFileOrDir = path.join(rootDir, arg)
    }

    if (fs.isFileSync(possibleFileOrDir)) {
      files.push(possibleFileOrDir)
    } else if (fs.isDirectorySync(possibleFileOrDir)) {
      const dirGlobStr = path.join(arg, '/**/*.{' + fileExtensionsStr + '}')
      const filesFromGlob = globLib.globSync(dirGlobStr)
      files = files.concat(filesFromGlob)
    } else {
      // FIXME: better warning verbiage here
      console.warn('Invalid argument to "list" command:', arg)
    }
  })

  // convert the .include argument to an array
  if (isString(argv.include) && argv.include !== '') {
    argv.include = [argv.include]
  }

  if (isArray(argv.include) && argv.include.length > 0) {
    argv.include.forEach(includeStr => {
      const filesFromGlob = globLib.globSync(includeStr)
      files = files.concat(filesFromGlob)
    })
  }

  // FIXME: handle --exclude files here

  // return the files as a Set
  return new Set(files)
}

function formatFileSync (filename) {
  // FIXME: wrap this in try/catch
  const fileTxt = fs.readFileSync(filename, 'utf8')
  const result = standardClj.format(fileTxt)

  if (result.status === 'success') {
    fs.writeFileSync(filename, result.out)
  } else {
    console.error('FIXME: format() returned error, need to handle this case', filename)
  }
}

// -----------------------------------------------------------------------------
// yargs commands

function processListCmd (argv) {
  const filesSet = getFilesFromArgv(argv)
  const sortedFiles = setToArray(filesSet).sort()

  if (argv.output === 'json') {
    console.log(JSON.stringify(sortedFiles))
  } else if (argv.output === 'json-pretty') {
    console.log(JSON.stringify(sortedFiles, null, 2))
  } else if (argv.output === 'edn') {
    const jsonOutput = JSON.stringify(sortedFiles)
    console.log(jsonOutput.replaceAll(/","/g, '" "'))
  } else if (argv.output === 'edn-pretty') {
    // NOTE: this is hacky, but it works 🤷‍♂️
    const jsonOutput = JSON.stringify(sortedFiles)
    console.log(jsonOutput.replaceAll(/","/g, '"\n "'))
  } else {
    sortedFiles.forEach(f => console.log(f))
  }

  process.exit(0)
}

function processFormatCmd (argv) {
  // console.log('format command:', argv)

  const filesToProcess = getFilesFromArgv(argv)
  const sortedFiles = setToArray(filesToProcess).sort()
  sortedFiles.forEach(formatFileSync)

  // FIXME: log output
}

const yargsFormatCommand = {
  command: 'format',
  describe: 'FIXME: describe the format command here',
  handler: processFormatCmd
}

const yargsListCommand = {
  command: 'list',
  describe: 'Prints a list of files that will be formatted. Useful for debugging your .standard-clojure-style.edn file or glob patterns.',
  handler: processListCmd
}

yargs.scriptName('standard-clj')
  .usage('$0 <cmd> [args]')
  .command(yargsFormatCommand)
  .command(yargsListCommand)

  .alias('i', 'include')
  .alias('e', 'exclude')

  .default('file-ext', defaultFileExtensions.join(','))

// .nargs('f', 1)
// .describe('f', 'Load a file')

  // .command('format [name]', 'welcome ter yargs!', (yargs) => {
  //   yargs.positional('name', {
  //     type: 'string',
  //     default: 'Cambi',
  //     describe: 'the name to say hello to'
  //   })
  // }, function (argv) {
  //   console.log('hello', argv.name, 'welcome to yargs!')
  // })
  .demandCommand() // show them --help if they do not pass a valid command
  .help()
  .parse()

// if they pass in multiple files, then those should be formatted
// if they pass in multiple directories, then those should be recursively formatted

// -----------------------------------------------------------------------------
// Util

function isString (s) {
  return typeof s === 'string'
}

function isArray (a) {
  return Array.isArray(a)
}

function setToArray (s) {
  return Array.from(s)
}
