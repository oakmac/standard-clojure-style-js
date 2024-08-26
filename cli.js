#!/usr/bin/env node

// The purpose of this file is to handle everything related to running
// Standard Clojure Style via the command line.
//
// ISC License
// Copyright © 2024, Chris Oakman
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

const scriptStartTime = performance.now()

const standardClj = require('./lib/standard-clojure-style.js')

const programVersion = 'v0.1.0'

const defaultFileExtensions = ['clj', 'cljs', 'cljc', 'edn']

let logLevel = 'everything'
let atLeastOneFilePrinted = false

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

// returns a Set of files from the args passed to the "list", "check", or "fix" commands
function getFilesFromArgv (argv, cmd) {
  // remove the first item, which is the command
  argv._.shift()
  const directArgs = argv._

  const fileExtensionsStr = argv['file-ext']

  let includeFiles = []

  directArgs.forEach(arg => {
    let possibleFileOrDir = arg
    if (!fs.isAbsolute(arg)) {
      // if the argument is not an absolute path, assume it is relative to the
      // directory where the script is being run from
      possibleFileOrDir = path.join(rootDir, arg)
    }

    if (fs.isFileSync(possibleFileOrDir)) {
      includeFiles.push(possibleFileOrDir)
    } else if (fs.isDirectorySync(possibleFileOrDir)) {
      const dirGlobStr = path.join(arg, '/**/*.{' + fileExtensionsStr + '}')
      const filesFromGlob = globLib.globSync(dirGlobStr)
      includeFiles = includeFiles.concat(filesFromGlob)
    } else {
      printToStderr(yocto.bold(yocto.yellow('WARN')) + ' Could not find a file or directory at "' + arg + '"')
    }
  })

  // convert the --include argument to an array
  if (isString(argv.include) && argv.include !== '') {
    argv.include = [argv.include]
  }

  if (isArray(argv.include)) {
    argv.include.forEach(includeStr => {
      const filesFromGlob = globLib.globSync(includeStr)
      includeFiles = includeFiles.concat(filesFromGlob)
    })
  }

  // convert the --ignore argument to an array
  if (isString(argv.ignore) && argv.ignore !== '') {
    argv.ignore = [argv.ignore]
  }

  // exclude files if necessary
  let ignoreFiles = new Set()
  if (isArray(argv.ignore)) {
    argv.ignore.forEach(ignoreStr => {
      let possibleFileOrDir = ignoreStr
      if (!fs.isAbsolute(ignoreStr)) {
      // if the argument is not an absolute path, assume it is relative to the
      // directory where the script is being run from
        possibleFileOrDir = path.join(rootDir, ignoreStr)
      }

      if (fs.isFileSync(possibleFileOrDir)) {
        ignoreFiles.add(possibleFileOrDir)
      } else if (fs.isDirectorySync(possibleFileOrDir)) {
        const dirGlobStr = path.join(ignoreStr, '/**/*.{' + fileExtensionsStr + '}')
        const filesFromGlob = globLib.globSync(dirGlobStr)
        ignoreFiles = ignoreFiles.union(new Set(filesFromGlob))
      } else {
        printToStderr(yocto.bold(yocto.yellow('WARN')) + ' Could not find a file or directory to ignore at "' + ignoreStr + '"')
      }
    })
  }

  return new Set(includeFiles).difference(ignoreFiles)
}

function formatFileSync (formatResult, filename) {
  const formatSingleFileStartTime = performance.now()

  let fileTxt = null
  try {
    fileTxt = fs.readFileSync(filename, 'utf8')
  } catch (e) {
    // FIXME: this should match the error format below
    printToStderr('Unable to read file: ' + filename)
    atLeastOneFilePrinted = true
    formatResult.filesWithErrors.push(filename)
    return formatResult
  }

  const result = standardClj.format(fileTxt)

  if (result && result.status === 'success') {
    // add a single newline to the end of the file
    // FIXME: should we do this here or upstream in the format() function?
    const outTxtWithNewline = result.out + '\n'

    // write the file to disk if necessary
    let statusEmoji = '✓'
    if (outTxtWithNewline !== fileTxt) {
      fs.writeFileSync(filename, outTxtWithNewline)
      formatResult.filesThatWereFormatted.push(filename)
      statusEmoji = 'F'
    } else {
      formatResult.filesThatDidNotRequireFormatting.push(filename)
    }

    const formatSingleFileEndTime = performance.now()
    const formatDurationMs = formatSingleFileEndTime - formatSingleFileStartTime

    if (statusEmoji === 'F') {
      printToStdout(yocto.green(statusEmoji) + ' ' + yocto.bold(relativeFilename(filename)) + ' ' + formatDuration(formatDurationMs))
      atLeastOneFilePrinted = true
    } else {
      if (logLevel !== 'ignore-already-formatted') {
        printToStdout(yocto.green(statusEmoji) + ' ' + yocto.bold(relativeFilename(filename)) + ' ' + formatDuration(formatDurationMs))
        atLeastOneFilePrinted = true
      }
    }
    return formatResult
  } else {
    formatResult.filesWithErrors.push(filename)

    let errMsg = 'Unknown error! Please help the standard-clj project by opening an issue to report this 🙏'
    if (result && result.status === 'error' && isString(result.reason)) {
      errMsg = result.reason
    }

    const formatSingleFileEndTime = performance.now()
    const formatDurationMs = formatSingleFileEndTime - formatSingleFileStartTime

    printToStderr(yocto.red('E') + ' ' + yocto.bold(yocto.red(relativeFilename(filename))) + ' - ' + errMsg + ' ' + formatDuration(formatDurationMs))
    atLeastOneFilePrinted = true
    return formatResult
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
    // FIXME: this should match the error format below
    printToStderr('Unable to read file: ' + filename)
    atLeastOneFilePrinted = true
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
      if (logLevel !== 'ignore-already-formatted') {
        printToStdout(yocto.green('✓') + ' ' + yocto.bold(relativeFilename(filename)) + ' ' + formatDuration(durationMs))
        atLeastOneFilePrinted = true
      }
      checkResult.filesThatDidNotRequireFormatting.push(filename)
    } else {
      printToStderr(yocto.red('✗') + ' ' + yocto.bold(relativeFilename(filename)) + ' ' + formatDuration(durationMs))
      atLeastOneFilePrinted = true
      checkResult.filesThatDidRequireFormatting.push(filename)
    }
  } else if (result && result.status === 'error') {
    const errMsg = 'Failed to format file ' + filename + ': ' + result.reason
    printToStderr(errMsg)
    atLeastOneFilePrinted = true

    checkResult.filesWithErrors.push(filename)
  } else {
    printToStderr('Unknown error when formatting file ' + filename)
    printToStderr('Please report this upstream to the standard-clj project:')
    printToStderr(result)
    atLeastOneFilePrinted = true

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

function setLogLevel (level) {
  level = '' + level
  if (level === 'ignore-already-formatted' || level === '1') logLevel = 'ignore-already-formatted'
  else if (level === 'quiet' || level === '5') logLevel = 'quiet'
  else logLevel = 'everything'
}

function processCheckCmd (argv) {
  setLogLevel(argv['log-level'])

  printProgramInfo({ command: 'check' })

  const filesToProcess = getFilesFromArgv(argv, 'check')

  if (filesToProcess.size === 0) {
    exitSad('No files were passed to the "check" command. Please pass a filename, directory, or --include glob pattern.')
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

    const allFilesFormatted = checkResult.filesThatDidNotRequireFormatting.length === sortedFiles.length

    const checkCommandEndTime = performance.now()
    const scriptDurationMs = checkCommandEndTime - scriptStartTime

    if (atLeastOneFilePrinted) printToStdout('')

    if (allFilesFormatted) {
      printToStdout(yocto.green('All ' + sortedFiles.length + ' ' + fileStr(sortedFiles.length) + ' formatted with Standard Clojure Style 👍') + ' ' + formatDuration(scriptDurationMs))
    } else {
      printToStdout(yocto.green(checkResult.filesThatDidNotRequireFormatting.length + ' ' + fileStr(checkResult.filesThatDidNotRequireFormatting.length) + ' formatted with Standard Clojure Style'))
      printToStdout(yocto.red(checkResult.filesThatDidRequireFormatting.length + ' ' + fileStr(checkResult.filesThatDidRequireFormatting.length) + ' require formatting'))
      printToStdout('Checked ' + numFilesProcessed + ' ' + fileStr(numFilesProcessed) + '. ' + formatDuration(scriptDurationMs))
    }

    if (checkResult.filesThatDidNotRequireFormatting.length === sortedFiles.length) {
      exitHappy()
    } else {
      exitSad()
    }
  }
}

function processFixCmd (argv) {
  setLogLevel(argv['log-level'])

  printProgramInfo({ command: 'fix' })

  const filesToProcess = getFilesFromArgv(argv, 'fix')

  if (filesToProcess.size === 0) {
    exitSad('No files were passed to the "fix" command. Please pass a filename, directory, or --include glob pattern.')
  } else {
    const sortedFiles = setToArray(filesToProcess).sort()

    const initialResult = {
      filesThatDidNotRequireFormatting: [],
      filesThatWereFormatted: [],
      filesWithErrors: [],
      numFilesTotal: sortedFiles.length
    }
    const formatResult = sortedFiles.reduce(formatFileSync, initialResult)
    const numFormattedFiles = formatResult.filesThatDidNotRequireFormatting.length + formatResult.filesThatWereFormatted.length
    const allFilesFormatted = numFormattedFiles === sortedFiles.length

    const formatCommandEndTime = performance.now()
    const scriptDurationMs = formatCommandEndTime - scriptStartTime

    if (atLeastOneFilePrinted) printToStdout('')

    if (allFilesFormatted) {
      printToStdout(yocto.green('All ' + sortedFiles.length + ' files formatted with Standard Clojure Style 👍') + ' ' + formatDuration(scriptDurationMs))
    } else {
      printToStdout(yocto.green(numFormattedFiles + ' files formatted with Standard Clojure Style'))
      printToStdout(yocto.red(formatResult.filesWithErrors.length + ' files with errors'))
      printToStdout('Checked ' + sortedFiles.length + ' files. ' + formatDuration(scriptDurationMs))
    }

    if (allFilesFormatted) {
      exitHappy()
    } else {
      exitSad()
    }
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

  exitHappy()
}

const yargsCheckCommand = {
  command: 'check',
  describe: 'Checks if files are formatted according to Standard Clojure Style. ' +
            'This command does not modify files. ' +
            'Returns exit code 0 if all files are formatted, 1 otherwise.',
  handler: processCheckCmd
}

const yargsFixCommand = {
  command: 'fix',
  describe: 'Formats files according to Standard Clojure Style. ' +
            'This command will modify your files on disk. ' +
            'Returns exit code 0 if all files are formatted, 1 otherwise.',
  handler: processFixCmd
}

const yargsListCommand = {
  command: 'list',
  describe: 'Prints a list of files that will be used by the "check" or "fix" commands. ' +
            'Useful for debugging your .standard-clj.edn file or glob patterns.',
  handler: processListCmd
}

yargs.scriptName('standard-clj')
  .usage('$0 <cmd> [args]')

  .command(yargsCheckCommand)
  .command(yargsFixCommand)
  .command(yargsListCommand)

  .alias('c', 'config')
  .alias('ig', 'ignore')
  .alias('in', 'include')
  .alias('l', 'log-level')

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
  if (logLevel !== 'quiet') {
    console.log(s)
  }
}

function printToStderr (s) {
  if (logLevel !== 'quiet') {
    console.error(s)
  }
}

function exitHappy (s) {
  if (isString(s)) {
    printToStdout(s)
  }
  process.exit(0)
}

function exitSad (s) {
  if (isString(s)) {
    printToStderr(s)
  }
  process.exit(1)
}

function fileStr (numFiles) {
  if (numFiles === 1) return 'file'
  else return 'files'
}
