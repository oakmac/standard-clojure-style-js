// Pure functions used by cli.mjs.
// Every function here is side-effect free: no filesystem, no console, no globals.
//
// This file exists to make testing easy (just require() it from Jest) and to
// serve as the reference specification for porting the CLI logic to Lua.

function isString (s) {
  return typeof s === 'string'
}

function isArray (a) {
  return Array.isArray(a)
}

// Converts a raw --log-level value (string or number) into one of three
// canonical strings: 'everything', 'ignore-already-formatted', or 'quiet'.
function normalizeLogLevel (level) {
  const s = '' + (level == null ? '' : level)
  if (s === 'ignore-already-formatted' || s === '1') return 'ignore-already-formatted'
  if (s === 'quiet' || s === '5') return 'quiet'
  return 'everything'
}

// Given the original file text and the result object from standardClj.format(),
// return a classification:
//
//   { action: 'already-formatted', outputText }
//   { action: 'formatted',         outputText }
//   { action: 'error',             errorMessage }
//
// This encapsulates the "append trailing newline and compare" logic that
// both formatFileSync and checkFileSync need.
function classifyFormatResult (originalText, formatResult) {
  if (formatResult && formatResult.status === 'success') {
    const outputText = formatResult.out + '\n'

    if (isString(originalText) && outputText === originalText) {
      return { action: 'already-formatted', outputText }
    }
    return { action: 'formatted', outputText }
  }

  if (formatResult && formatResult.status === 'error' && isString(formatResult.reason)) {
    return { action: 'error', errorMessage: formatResult.reason }
  }

  return {
    action: 'error',
    errorMessage: 'Unknown error! Please help the standard-clj project by opening an issue to report this 🙏'
  }
}

function fileStr (numFiles) {
  if (numFiles === 1) return 'file'
  return 'files'
}

function addPeriodPrefix (f) {
  if (isString(f) && !f.startsWith('.')) {
    return '.' + f
  }
  return f
}

function relativeFilename (filename, rootDir) {
  return filename.replace(rootDir, '')
}

// Returns a new Set with elements in setA that are not in setB.
function setDifference (setA, setB) {
  if (typeof Set.prototype.difference === 'function') {
    return setA.difference(setB)
  }

  const returnSet = new Set()
  setA.forEach(itm => {
    if (!setB.has(itm)) {
      returnSet.add(itm)
    }
  })
  return returnSet
}

// If argv.ignore or argv.include are strings, wrap them in arrays.
function convertStringsToArrays (argv) {
  if (isString(argv.ignore)) {
    argv.ignore = [argv.ignore]
  }
  if (isString(argv.include)) {
    argv.include = [argv.include]
  }
  return argv
}

// Convert a comma-separated --file-ext string into a Set with leading periods.
function convertFileExt (argv) {
  if (isString(argv['file-ext']) && argv['file-ext'] !== '') {
    let fileExtsArr = argv['file-ext'].split(',')
    fileExtsArr = fileExtsArr.map(addPeriodPrefix)
    argv['file-ext'] = new Set(fileExtsArr)
  }
  return argv
}

// Given argv and a parsed config object (from .standard-clj.json / .edn),
// merge config values into argv. CLI flags take precedence.
// Returns argv. If config is null/undefined, returns argv unchanged.
function mergeConfigIntoArgv (argv, config) {
  if (!config) return argv

  argv._optionsLoadedViaConfigFile = true

  if (!argv['log-level'] && config['log-level']) {
    argv['log-level'] = config['log-level']
  }

  if (isString(config.include)) {
    argv.includeFromConfig = [config.include]
  } else if (isArray(config.include)) {
    argv.includeFromConfig = config.include
  }

  if (isString(config.ignore)) {
    argv.ignoreFromConfig = [config.ignore]
  } else if (isArray(config.ignore)) {
    argv.ignoreFromConfig = config.ignore
  }

  return argv
}

// Produces counts and exit code from a check result accumulator.
function buildCheckSummary (checkResult) {
  const numAlreadyFormatted = checkResult.filesThatDidNotRequireFormatting.length
  const numNeedFormatting = checkResult.filesThatDidRequireFormatting.length
  const numErrors = checkResult.filesWithErrors.length
  const total = numAlreadyFormatted + numNeedFormatting + numErrors
  const allFormatted = numAlreadyFormatted === total && total > 0

  return {
    total,
    numAlreadyFormatted,
    numNeedFormatting,
    numErrors,
    allFormatted,
    exitCode: allFormatted ? 0 : 1
  }
}

// Produces counts and exit code from a fix result accumulator.
function buildFixSummary (fixResult) {
  const numAlreadyFormatted = fixResult.filesThatDidNotRequireFormatting.length
  const numWereFormatted = fixResult.filesThatWereFormatted.length
  const numErrors = fixResult.filesWithErrors.length
  const total = numAlreadyFormatted + numWereFormatted + numErrors
  const allSuccess = numErrors === 0 && total > 0

  return {
    total,
    numAlreadyFormatted,
    numWereFormatted,
    numErrors,
    allSuccess,
    exitCode: allSuccess ? 0 : 1
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  isString,
  isArray,
  normalizeLogLevel,
  classifyFormatResult,
  fileStr,
  addPeriodPrefix,
  relativeFilename,
  setDifference,
  convertStringsToArrays,
  convertFileExt,
  mergeConfigIntoArgv,
  buildCheckSummary,
  buildFixSummary
}
