// ISC License
// Copyright © 2024, Chris Oakman
// https://github.com/oakmac/standard-clojure-style-js/
//
// The purpose of this file is to handle everything related to running
// Standard Clojure Style via the command line.

// node.js imports
import fs from 'fs-plus'
import path from 'path'
import { performance } from 'node:perf_hooks'
import process from 'process'

// npm imports
import { parseEDNString, toEDNStringFromSimpleObject } from 'edn-data'
import { globSync } from 'glob'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import yocto from 'yoctocolors'

// import Standard Clojure Style
// NOTE: the line below (including the UUID) gets replaced by script/build-release.js
// script before publishing to npm
import standardClj from './lib/standard-clojure-style.js' // 7b323d1c-2984-4bd1-9304-d62d8dee9a1f

const scriptStartTime = performance.now()

// NOTE: the line below (including the UUID) gets replaced by script/build-release.js
// script before publishing to npm
const programVersion = '[dev]' // 6444ef98-c603-42ca-97e7-ebe5c60382de

const defaultFileExtensions = ['clj', 'cljs', 'cljc', 'edn']

let logLevel = 'everything'
let atLeastOneFilePrinted = false

// this is the directory where the script is being called from
// in most cases, this will be a project root
const rootDir = process.cwd()
const defaultConfigJSONFile = path.join(rootDir, '.standard-clj.json')
const defaultConfigEDNFile = path.join(rootDir, '.standard-clj.edn')

const parseEDNOptions = {
  keywordAs: 'string',
  mapAs: 'object'
}

// returns a Set of files from the args passed to the "list", "check", or "fix" commands
function getFilesFromArgv (argv, cmd) {
  // remove the first item, which is the command
  argv._.shift()
  const directArgs = argv._

  const fileExtensionsStr = argv['file-ext']

  let includeFiles = []

  // process the direct arguments
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
      const filesFromGlob = globSync(dirGlobStr)
      includeFiles = includeFiles.concat(filesFromGlob)
    } else {
      printToStderr(yocto.bold(yocto.yellow('WARN')) + ' Could not find a file or directory at "' + arg + '"')
    }
  })

  // process the --include glob patterns
  if (isArray(argv.include)) {
    argv.include.forEach(includeStr => {
      const filesFromGlob = globSync(includeStr)
      includeFiles = includeFiles.concat(filesFromGlob)
    })
  }

  // exclude files if necessary
  let ignoreFiles = []
  if (isArray(argv.ignore)) {
    argv.ignore.forEach(ignoreStr => {
      let possibleFileOrDir = ignoreStr
      if (!fs.isAbsolute(ignoreStr)) {
        // if the argument is not an absolute path, assume it is relative to the
        // directory where the script is being run from
        possibleFileOrDir = path.join(rootDir, ignoreStr)
      }

      if (fs.isFileSync(possibleFileOrDir)) {
        ignoreFiles.push(possibleFileOrDir)
      } else if (fs.isDirectorySync(possibleFileOrDir)) {
        const dirGlobStr = path.join(ignoreStr, '/**/*.{' + fileExtensionsStr + '}')
        const filesFromGlob = globSync(dirGlobStr)
        ignoreFiles = ignoreFiles.concat(filesFromGlob)
      } else {
        printToStderr(yocto.bold(yocto.yellow('WARN')) + ' Could not find a file or directory to ignore at "' + ignoreStr + '"')
      }
    })
  }

  const includeFilesSet = new Set(includeFiles)
  const ignoreFileSet = new Set(ignoreFiles)

  return setDifference(includeFilesSet, ignoreFileSet)
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

function setLogLevel (level) {
  level = '' + level
  if (level === 'ignore-already-formatted' || level === '1') logLevel = 'ignore-already-formatted'
  else if (level === 'quiet' || level === '5') logLevel = 'quiet'
  else logLevel = 'everything'
}

function injectConfigFile (argv) {
  let config = null

  // load the default config files
  try {
    config = JSON.parse(fs.readFileSync(defaultConfigJSONFile, 'utf8'))
  } catch (e) {}
  try {
    config = parseEDNString(fs.readFileSync(defaultConfigEDNFile, 'utf8'), parseEDNOptions)
  } catch (e) {}

  // try to read their custom config file
  if (isString(argv.config) && argv.config !== '') {
    const isJSON = argv.config.endsWith('.json')
    const isEDN = argv.config.endsWith('.edn')

    if (isJSON) {
      try {
        config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
      } catch (e) {}
    } else if (isEDN) {
      try {
        config = parseEDNString(fs.readFileSync(argv.config, 'utf8'), parseEDNOptions)
      } catch (e) {}
    }

    if (!config) {
      printToStderr('Unable to load config file: ' + argv.config)
    }
  }

  // apply the config options if found
  if (config) {
    // log level
    if (!argv['log-level']) {
      if (config['log-level']) {
        argv['log-level'] = config['log-level']
      }
    }

    // include
    if (!argv.include) {
      if (isString(config.include)) {
        argv.include = [config.include]
      } else if (isArray(config.include)) {
        argv.include = config.include
      }
    }

    // ignores
    if (!argv.ignore) {
      if (isString(config.ignore)) {
        argv.ignore = [config.ignore]
      } else if (isArray(config.ignore)) {
        argv.ignore = config.ignore
      }
    }
  }

  return argv
}

// convert String arguments into Arrays
function convertStringsToArrays (argv) {
  if (isString(argv.ignore)) {
    argv.ignore = [argv.ignore]
  }

  if (isString(argv.include)) {
    argv.include = [argv.include]
  }

  return argv
}

// -----------------------------------------------------------------------------
// yargs commands

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

// this is the fix command when not reading input from stdin
function processFixCmdNotStdin (argv) {
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

// fix command when reading input from stdin
async function processFixCmdStdin (argv) {
  const stdinStr = await readStream(process.stdin)

  if (!isString(stdinStr) || stdinStr === '') {
    exitSad('Nothing found on stdin. Please pipe some Clojure code to stdin when using "standard-clj fix -"')
  } else {
    let formatResult = null
    try {
      formatResult = standardClj.format(stdinStr)
    } catch (e) {}

    if (formatResult && formatResult.status === 'success') {
      console.log(formatResult.out)
      exitHappy()
    } else if (formatResult && formatResult.status === 'error' && isString(formatResult.reason)) {
      exitSad('Failed to format code: ' + formatResult.reason)
    } else {
      exitSad('Failed to format your code due to unknown error with the format() function. Please help the standard-clj project by opening an issue to report this 🙏')
    }
  }
}

function processFixCmd (argv) {
  const lastArg = getLastItemInArray(argv._)
  if (lastArg === '-') {
    processFixCmdStdin(argv)
  } else {
    processFixCmdNotStdin(argv)
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
    printToStdout(toEDNStringFromSimpleObject(sortedFiles))
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

yargs(hideBin(process.argv))
  .scriptName('standard-clj')
  .usage('$0 <cmd> [args]')

  .command(yargsCheckCommand)
  .command(yargsFixCommand)
  .command(yargsListCommand)

  .middleware([injectConfigFile, convertStringsToArrays])

  .alias('c', 'config')
  .alias('ig', 'ignore')
  .alias('in', 'include')
  .alias('l', 'log-level')
  .alias('v', 'version')

  .default('file-ext', defaultFileExtensions.join(','))

  .demandCommand() // show them --help if they do not pass a valid command
  .version(programVersion)

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

// returns the last item in an Array, or null if the Array is empty
function getLastItemInArray (a) {
  const size = a.length
  if (size === 0) {
    return null
  } else {
    return a[size - 1]
  }
}

// some older versions of node.js do not have Set.difference
function setDifference (setA, setB) {
  if (typeof Set.prototype.difference === 'function') {
    return setA.difference(setB)
  } else {
    const returnSet = new Set()

    setA.forEach(itm => {
      if (!setB.has(itm)) {
        returnSet.add(itm)
      }
    })

    return returnSet
  }
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

// https://stackoverflow.com/a/54565854
async function readStream (stream) {
  const chunks = []
  for await (const chunk of stream) { chunks.push(chunk) }
  return Buffer.concat(chunks).toString('utf8')
}
