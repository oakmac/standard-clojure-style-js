#!/usr/bin/env node

// The purpose of this file is to handle everything related to running
// Standard Clojure Style via the command line.
//
// Copyright 2023 © Chris Oakman
// ISC License
// https://github.com/oakmac/standard-clojure-style-js/

// const yocto = require('yoctocolors')
import yocto from 'yoctocolors'
const fs = require('fs-plus')
const path = require('path')
const { performance } = require('node:perf_hooks')
const process = require('process')

const ednLib = require('edn-data')
const globLib = require('glob')
const yargs = require('yargs')

const standardClj = require('./lib/standard-clojure-style.js')

const programVersion = 'v0.1.0'

//
// --verbose, --chatty-kathy
// provide lots of information about what the script is doing
//
// command: format
// formats the files "in-place"
//

const defaultFileExtensions = ['clj', 'cljs', 'cljc', 'edn']

// this is the directory where the script is being called from
// in most cases, this will be a project root
const rootDir = process.cwd()
// const cfgJSONFile = path.join(rootDir, '.standard-clj.json')
// const cfgEDNFile = path.join(rootDir, '.standard-clj.edn')

// look for a .standard-clj.json or .standard-clj.edn file
// function readConfigFile (filename) {

// }

// let configFile = null
// try {
//   configFile = JSON.parse(fs.readFileSync(cfgJSONFile, 'utf8'))
// } catch (e) {}
// try {
//   const parseEDNOptions = {
//     keywordAs: 'string',
//     mapAs: 'object'
//   }
//   configFile = ednLib.parseEDNString(fs.readFileSync(cfgEDNFile, 'utf8'), parseEDNOptions)
// } catch (e) {}

// returns a Set of files from the args passed to the "list" or "format" commands
function getFilesFromArgv (argv, cmd) {
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
      printToStderr('Please pass a filename or a directory to the ' + cmd + ' command: ' + arg)
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
  let fileTxt = null
  try {
    fileTxt = fs.readFileSync(filename, 'utf8')
  } catch (e) {
    printToStderr('Unable to read file: ' + filename)
    return null
  }

  const result = standardClj.format(fileTxt)

  if (result && result.status === 'success') {
    // FIXME: should we do this here or upstream in the format() function?
    // add a single newline to the end of the file
    const outTxtWithNewline = result.out + '\n'
    fs.writeFileSync(filename, outTxtWithNewline)
  } else if (result && result.status === 'error') {
    const errMsg = 'Failed to format file ' + filename + ': ' + result.reason
    printToStderr(errMsg)
  } else {
    printToStderr('Unknown error when formatting file ' + filename)
    printToStderr('Please report this upstream to the standard-clj project:')
    printToStderr(result)
    dieSad()
  }
}

// FIXME: write an async version of this that returns a Promise
// function formatFileAsync (filename) {}

function relativeFilename (filename) {
  return filename.replace(rootDir, '')
}

function formatDuration (durationMs) {
  const roundedDuration = Math.round(durationMs * 100)
  return yocto.dim('[' + (roundedDuration / 100) + 'ms]')
}

function checkFileSync (checkResult, filename) {
  const checkStartTime = performance.now()

  let fileTxt = null
  try {
    fileTxt = fs.readFileSync(filename, 'utf8')
  } catch (e) {
    printToStderr('Unable to read file: ' + filename)
    checkResult.filesWithErrors.push(filename)
    return checkResult
  }

  const result = standardClj.format(fileTxt)

  const checkEndTime = performance.now()
  const durationMs = checkEndTime - checkStartTime

  if (result && result.status === 'success') {
    // FIXME: should we do this here or upstream in the format() function?
    // add a single newline to the end of the file
    const outTxtWithNewline = result.out + '\n'

    if (isString(fileTxt) && fileTxt === outTxtWithNewline) {
      printToStdout(yocto.green('✓') + ' ' + yocto.bold(relativeFilename(filename)) + ' ' + formatDuration(durationMs))

      checkResult.filesThatDidNotRequireFormatting.push(filename)
    } else {
      printToStderr(yocto.red('✗') + ' ' + yocto.bold(relativeFilename(filename)) + ' ' + formatDuration(durationMs))
      checkResult.filesThatDidRequireFormatting.push(filename)
    }
  } else if (result && result.status === 'error') {
    const errMsg = 'Failed to format file ' + filename + ': ' + result.reason
    printToStderr(errMsg)

    checkResult.filesWithErrors.push(filename)
  } else {
    printToStderr('Unknown error when formatting file ' + filename)
    printToStderr('Please report this upstream to the standard-clj project:')
    printToStderr(result)

    checkResult.filesWithErrors.push(filename)
  }

  return checkResult
}

function printProgramInfo (opts) {
  printToStdout(yocto.bold('standard-clj ' + opts.command) + ' ' + yocto.dim(programVersion))
  printToStdout('')
}

// -----------------------------------------------------------------------------
// yargs commands

function processCheckCmd (argv) {
  const checkCommandStartTime = performance.now()

  printProgramInfo({ command: 'check' })

  const filesToProcess = getFilesFromArgv(argv, 'format')

  if (filesToProcess.size === 0) {
    dieSad('No files were passed to the "check" command. Please pass a filename, directory, or --include glob string.')
  } else {
    const sortedFiles = setToArray(filesToProcess).sort()

    const initialResult = {
      filesThatDidNotRequireFormatting: [],
      filesThatDidRequireFormatting: [],
      filesWithErrors: [],
      numFilesTotal: sortedFiles.length
    }
    const checkResult = sortedFiles.reduce(checkFileSync, initialResult)

    // sanity-check the result
    const numFilesProcessed = checkResult.filesThatDidRequireFormatting.length +
                              checkResult.filesThatDidNotRequireFormatting.length +
                              checkResult.filesWithErrors.length
    console.assert(sortedFiles.length === numFilesProcessed, 'checkFileSync missed a file?')

    const checkCommandEndTime = performance.now()
    const checkCommandDurationMs = checkCommandEndTime - checkCommandStartTime

    printToStdout('')
    printToStdout(yocto.green(checkResult.filesThatDidNotRequireFormatting.length + ' pass'))
    printToStdout(yocto.red(checkResult.filesThatDidRequireFormatting.length + ' fail'))
    printToStdout('Checked ' + numFilesProcessed + ' files. ' + formatDuration(checkCommandDurationMs))

    if (checkResult.filesThatDidNotRequireFormatting.length === sortedFiles.length) {
      // dieHappy('Checked ' + sortedFiles.length + ' files. All formatted according to Standard Clojure Style 👍')
      dieHappy()
    } else {
      dieSad()
    }
  }
}

function processFormatCmd (argv) {
  printProgramInfo({ command: 'format' })

  const filesToProcess = getFilesFromArgv(argv, 'format')

  if (filesToProcess.size === 0) {
    dieSad('No files were passed to the "format" command. Please pass a filename, directory, or --include glob string.')
  } else {
    const sortedFiles = setToArray(filesToProcess).sort()
    sortedFiles.forEach(formatFileSync)
    dieHappy()
  }
}

function processListCmd (argv) {
  const filesSet = getFilesFromArgv(argv, 'list')
  const sortedFiles = setToArray(filesSet).sort()

  if (argv.output === 'json') {
    printToStdout(JSON.stringify(sortedFiles))
  } else if (argv.output === 'json-pretty') {
    printToStdout(JSON.stringify(sortedFiles, null, 2))
  } else if (argv.output === 'edn') {
    printToStdout(ednLib.toEDNStringFromSimpleObject(sortedFiles))
  } else if (argv.output === 'edn-pretty') {
    // NOTE: this is hacky, but it works 🤷‍♂️
    const jsonOutput = JSON.stringify(sortedFiles)
    printToStdout(jsonOutput.replaceAll(/","/g, '"\n "'))
  } else {
    sortedFiles.forEach(printToStdout)
  }

  dieHappy()
}

const yargsCheckCommand = {
  command: 'check',
  describe: 'Checks that your files are formatted according to Standard Clojure Style. This command will not modify your files, it only checks them.',
  handler: processCheckCmd
}

const yargsFormatCommand = {
  command: 'format',
  describe: 'Formats files according to Standard Clojure Style. This command will modify your files on disk.',
  handler: processFormatCmd
}

const yargsListCommand = {
  command: 'list',
  describe: 'Prints a list of files that will be formatted. Useful for debugging your .standard-clj.edn file or glob patterns.',
  handler: processListCmd
}

yargs.scriptName('standard-clj')
  .usage('$0 <cmd> [args]')

  .command(yargsCheckCommand)
  .command(yargsFormatCommand)
  .command(yargsListCommand)

  .alias('i', 'include')
  .alias('e', 'exclude')

  .default('file-ext', defaultFileExtensions.join(','))

  .demandCommand() // show them --help if they do not pass a valid command

  .help()
  .parse()

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

function printToStdout (s) {
  console.log(s)
}

function printToStderr (s) {
  console.error(s)
}

function dieHappy (s) {
  if (isString(s)) {
    printToStdout(s)
  }
  process.exit(0)
}

function dieSad (s) {
  if (isString(s)) {
    printToStderr(s)
  }
  process.exit(1)
}
