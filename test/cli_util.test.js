/* global describe test expect */

const cli = require('../cli_util.js')

// =========================================================================
// normalizeLogLevel
// =========================================================================

describe('normalizeLogLevel', () => {
  test('returns "everything" by default', () => {
    expect(cli.normalizeLogLevel(undefined)).toBe('everything')
    expect(cli.normalizeLogLevel(null)).toBe('everything')
    expect(cli.normalizeLogLevel('')).toBe('everything')
    expect(cli.normalizeLogLevel('everything')).toBe('everything')
    expect(cli.normalizeLogLevel('junk')).toBe('everything')
    expect(cli.normalizeLogLevel(0)).toBe('everything')
  })

  test('recognises "ignore-already-formatted" and numeric alias "1"', () => {
    expect(cli.normalizeLogLevel('ignore-already-formatted')).toBe('ignore-already-formatted')
    expect(cli.normalizeLogLevel('1')).toBe('ignore-already-formatted')
    expect(cli.normalizeLogLevel(1)).toBe('ignore-already-formatted')
  })

  test('recognises "quiet" and numeric alias "5"', () => {
    expect(cli.normalizeLogLevel('quiet')).toBe('quiet')
    expect(cli.normalizeLogLevel('5')).toBe('quiet')
    expect(cli.normalizeLogLevel(5)).toBe('quiet')
  })
})

// =========================================================================
// classifyFormatResult
// =========================================================================

describe('classifyFormatResult', () => {
  test('detects file already formatted (trailing newline present)', () => {
    const original = '(def x 1)\n'
    const formatResult = { status: 'success', out: '(def x 1)' }

    const result = cli.classifyFormatResult(original, formatResult)

    expect(result.action).toBe('already-formatted')
    expect(result.outputText).toBe('(def x 1)\n')
  })

  test('detects file that needed formatting', () => {
    const original = '(def x   1)\n'
    const formatResult = { status: 'success', out: '(def x 1)' }

    const result = cli.classifyFormatResult(original, formatResult)

    expect(result.action).toBe('formatted')
    expect(result.outputText).toBe('(def x 1)\n')
  })

  test('detects file that is missing trailing newline', () => {
    const original = '(def x 1)'
    const formatResult = { status: 'success', out: '(def x 1)' }

    const result = cli.classifyFormatResult(original, formatResult)

    expect(result.action).toBe('formatted')
    expect(result.outputText).toBe('(def x 1)\n')
  })

  test('handles explicit error from formatter', () => {
    const result = cli.classifyFormatResult('(def )', { status: 'error', reason: 'Unexpected EOF' })

    expect(result.action).toBe('error')
    expect(result.errorMessage).toBe('Unexpected EOF')
  })

  test('handles null format result', () => {
    const result = cli.classifyFormatResult('(def x 1)', null)

    expect(result.action).toBe('error')
    expect(result.errorMessage).toContain('Unknown error')
  })

  test('handles undefined format result', () => {
    const result = cli.classifyFormatResult('(def x 1)', undefined)

    expect(result.action).toBe('error')
    expect(result.errorMessage).toContain('Unknown error')
  })

  test('handles error result with missing reason', () => {
    const result = cli.classifyFormatResult('(def x 1)', { status: 'error' })

    expect(result.action).toBe('error')
    expect(result.errorMessage).toContain('Unknown error')
  })

  test('handles error result with non-string reason', () => {
    const result = cli.classifyFormatResult('(def x 1)', { status: 'error', reason: 42 })

    expect(result.action).toBe('error')
    expect(result.errorMessage).toContain('Unknown error')
  })

  test('handles format result with unexpected status', () => {
    const result = cli.classifyFormatResult('(def x 1)', { status: 'wat' })
    expect(result.action).toBe('error')
  })

  test('always appends exactly one newline to formatter output', () => {
    const result = cli.classifyFormatResult('anything', { status: 'success', out: '(ns foo.core)' })

    expect(result.outputText).toBe('(ns foo.core)\n')
    expect(result.outputText.endsWith('\n\n')).toBe(false)
  })

  test('empty file that formats to empty string', () => {
    const result = cli.classifyFormatResult('\n', { status: 'success', out: '' })

    expect(result.action).toBe('already-formatted')
    expect(result.outputText).toBe('\n')
  })

  test('multiline ns form', () => {
    const formatted = '(ns foo.core\n  (:require\n    [clojure.string :as str]))'
    const original = formatted + '\n'

    const result = cli.classifyFormatResult(original, { status: 'success', out: formatted })
    expect(result.action).toBe('already-formatted')
  })
})

// =========================================================================
// fileStr
// =========================================================================

describe('fileStr', () => {
  test('returns "file" for 1', () => {
    expect(cli.fileStr(1)).toBe('file')
  })

  test('returns "files" for 0, 2, and larger numbers', () => {
    expect(cli.fileStr(0)).toBe('files')
    expect(cli.fileStr(2)).toBe('files')
    expect(cli.fileStr(100)).toBe('files')
  })
})

// =========================================================================
// addPeriodPrefix
// =========================================================================

describe('addPeriodPrefix', () => {
  test('adds period to extension without one', () => {
    expect(cli.addPeriodPrefix('clj')).toBe('.clj')
    expect(cli.addPeriodPrefix('cljs')).toBe('.cljs')
  })

  test('does not double-add period', () => {
    expect(cli.addPeriodPrefix('.clj')).toBe('.clj')
    expect(cli.addPeriodPrefix('.edn')).toBe('.edn')
  })

  test('returns non-string values as-is', () => {
    expect(cli.addPeriodPrefix(null)).toBe(null)
    expect(cli.addPeriodPrefix(undefined)).toBe(undefined)
    expect(cli.addPeriodPrefix(42)).toBe(42)
  })
})

// =========================================================================
// relativeFilename
// =========================================================================

describe('relativeFilename', () => {
  test('strips root directory prefix', () => {
    expect(cli.relativeFilename('/home/user/project/src/foo.clj', '/home/user/project'))
      .toBe('/src/foo.clj')
  })

  test('returns unchanged if root is not a prefix', () => {
    expect(cli.relativeFilename('/other/path/foo.clj', '/home/user/project'))
      .toBe('/other/path/foo.clj')
  })

  test('handles root being empty string', () => {
    expect(cli.relativeFilename('/src/foo.clj', '')).toBe('/src/foo.clj')
  })
})

// =========================================================================
// convertStringsToArrays
// =========================================================================

describe('convertStringsToArrays', () => {
  test('wraps string ignore in array', () => {
    const argv = { ignore: 'src/ignore-me.clj' }
    const result = cli.convertStringsToArrays(argv)

    expect(Array.isArray(result.ignore)).toBe(true)
    expect(result.ignore[0]).toBe('src/ignore-me.clj')
  })

  test('wraps string include in array', () => {
    const argv = { include: 'src/**/*.clj' }
    const result = cli.convertStringsToArrays(argv)

    expect(Array.isArray(result.include)).toBe(true)
    expect(result.include[0]).toBe('src/**/*.clj')
  })

  test('converts both at once', () => {
    const argv = { ignore: 'a', include: 'b' }
    const result = cli.convertStringsToArrays(argv)

    expect(result.ignore).toEqual(['a'])
    expect(result.include).toEqual(['b'])
  })

  test('leaves existing arrays untouched', () => {
    const argv = { ignore: ['a', 'b'], include: ['c', 'd'] }
    const result = cli.convertStringsToArrays(argv)

    expect(result.ignore).toEqual(['a', 'b'])
    expect(result.include).toEqual(['c', 'd'])
  })

  test('leaves missing properties as undefined', () => {
    const argv = { other: 'prop' }
    const result = cli.convertStringsToArrays(argv)

    expect(result.ignore).toBeUndefined()
    expect(result.include).toBeUndefined()
  })
})

// =========================================================================
// convertFileExt
// =========================================================================

describe('convertFileExt', () => {
  test('converts comma-separated string to Set with leading periods', () => {
    const argv = { 'file-ext': 'clj,cljs,.edn' }
    const result = cli.convertFileExt(argv)

    expect(result['file-ext'] instanceof Set).toBe(true)
    expect(result['file-ext'].has('.clj')).toBe(true)
    expect(result['file-ext'].has('.cljs')).toBe(true)
    expect(result['file-ext'].has('.edn')).toBe(true)
    expect(result['file-ext'].size).toBe(3)
  })

  test('handles single extension', () => {
    const argv = { 'file-ext': 'clj' }
    const result = cli.convertFileExt(argv)

    expect(result['file-ext'] instanceof Set).toBe(true)
    expect(result['file-ext'].has('.clj')).toBe(true)
    expect(result['file-ext'].size).toBe(1)
  })

  test('leaves existing Set untouched', () => {
    const extSet = new Set(['.clj'])
    const argv = { 'file-ext': extSet }
    const result = cli.convertFileExt(argv)

    expect(result['file-ext']).toBe(extSet)
  })

  test('leaves empty string untouched', () => {
    const argv = { 'file-ext': '' }
    const result = cli.convertFileExt(argv)

    expect(result['file-ext']).toBe('')
  })

  test('handles missing file-ext property', () => {
    const argv = {}
    const result = cli.convertFileExt(argv)

    expect(result['file-ext']).toBeUndefined()
  })
})

// =========================================================================
// setDifference
// =========================================================================

describe('setDifference', () => {
  test('returns elements in A but not in B', () => {
    const a = new Set([1, 2, 3, 4])
    const b = new Set([2, 4])

    expect(cli.setDifference(a, b)).toEqual(new Set([1, 3]))
  })

  test('returns all of A when B is empty', () => {
    expect(cli.setDifference(new Set(['x', 'y']), new Set())).toEqual(new Set(['x', 'y']))
  })

  test('returns empty when A is empty', () => {
    expect(cli.setDifference(new Set(), new Set([1, 2]))).toEqual(new Set())
  })

  test('returns empty when A and B are identical', () => {
    expect(cli.setDifference(new Set(['a', 'b']), new Set(['a', 'b']))).toEqual(new Set())
  })

  test('works with file path strings', () => {
    const include = new Set(['/src/a.clj', '/src/b.clj', '/src/c.clj'])
    const ignore = new Set(['/src/b.clj'])

    const diff = cli.setDifference(include, ignore)

    expect(diff.has('/src/a.clj')).toBe(true)
    expect(diff.has('/src/c.clj')).toBe(true)
    expect(diff.has('/src/b.clj')).toBe(false)
  })
})

// =========================================================================
// mergeConfigIntoArgv
// =========================================================================

describe('mergeConfigIntoArgv', () => {
  test('returns argv unchanged when config is null', () => {
    const argv = { foo: 'bar' }
    const result = cli.mergeConfigIntoArgv(argv, null)

    expect(result).toBe(argv)
    expect(result._optionsLoadedViaConfigFile).toBeUndefined()
  })

  test('returns argv unchanged when config is undefined', () => {
    const argv = { foo: 'bar' }
    const result = cli.mergeConfigIntoArgv(argv, undefined)

    expect(result).toBe(argv)
  })

  test('sets _optionsLoadedViaConfigFile flag', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, {})

    expect(argv._optionsLoadedViaConfigFile).toBe(true)
  })

  test('applies log-level from config when CLI did not set one', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { 'log-level': 'quiet' })

    expect(argv['log-level']).toBe('quiet')
  })

  test('CLI log-level takes precedence over config', () => {
    const argv = { 'log-level': 'everything' }
    cli.mergeConfigIntoArgv(argv, { 'log-level': 'quiet' })

    expect(argv['log-level']).toBe('everything')
  })

  test('wraps config string include in array', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { include: 'src/**/*.clj' })

    expect(argv.includeFromConfig).toEqual(['src/**/*.clj'])
  })

  test('passes config array include through', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { include: ['src/**/*.clj', 'test/**/*.clj'] })

    expect(argv.includeFromConfig).toEqual(['src/**/*.clj', 'test/**/*.clj'])
  })

  test('wraps config string ignore in array', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { ignore: 'src/vendor' })

    expect(argv.ignoreFromConfig).toEqual(['src/vendor'])
  })

  test('passes config array ignore through', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { ignore: ['a', 'b'] })

    expect(argv.ignoreFromConfig).toEqual(['a', 'b'])
  })

  test('does not create includeFromConfig when config has no include', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { 'log-level': 'quiet' })

    expect(argv.includeFromConfig).toBeUndefined()
  })

  test('does not create ignoreFromConfig when config has no ignore', () => {
    const argv = {}
    cli.mergeConfigIntoArgv(argv, { 'log-level': 'quiet' })

    expect(argv.ignoreFromConfig).toBeUndefined()
  })

  test('full integration: merges all fields', () => {
    const argv = { 'log-level': 'everything' }
    const config = {
      'log-level': 'quiet',
      include: ['src/**/*.clj'],
      ignore: 'vendor/'
    }
    const result = cli.mergeConfigIntoArgv(argv, config)

    expect(result['log-level']).toBe('everything')
    expect(result.includeFromConfig).toEqual(['src/**/*.clj'])
    expect(result.ignoreFromConfig).toEqual(['vendor/'])
    expect(result._optionsLoadedViaConfigFile).toBe(true)
  })
})

// =========================================================================
// buildCheckSummary
// =========================================================================

describe('buildCheckSummary', () => {
  test('all files already formatted', () => {
    const result = cli.buildCheckSummary({
      filesThatDidNotRequireFormatting: ['a.clj', 'b.clj', 'c.clj'],
      filesThatDidRequireFormatting: [],
      filesWithErrors: []
    })

    expect(result.total).toBe(3)
    expect(result.numAlreadyFormatted).toBe(3)
    expect(result.numNeedFormatting).toBe(0)
    expect(result.numErrors).toBe(0)
    expect(result.allFormatted).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  test('single file already formatted', () => {
    const result = cli.buildCheckSummary({
      filesThatDidNotRequireFormatting: ['a.clj'],
      filesThatDidRequireFormatting: [],
      filesWithErrors: []
    })

    expect(result.total).toBe(1)
    expect(result.allFormatted).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  test('some files need formatting', () => {
    const result = cli.buildCheckSummary({
      filesThatDidNotRequireFormatting: ['a.clj'],
      filesThatDidRequireFormatting: ['b.clj', 'c.clj'],
      filesWithErrors: []
    })

    expect(result.total).toBe(3)
    expect(result.numAlreadyFormatted).toBe(1)
    expect(result.numNeedFormatting).toBe(2)
    expect(result.allFormatted).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  test('files with errors cause exit code 1', () => {
    const result = cli.buildCheckSummary({
      filesThatDidNotRequireFormatting: ['a.clj'],
      filesThatDidRequireFormatting: [],
      filesWithErrors: ['bad.clj']
    })

    expect(result.numErrors).toBe(1)
    expect(result.allFormatted).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  test('empty input (no files processed)', () => {
    const result = cli.buildCheckSummary({
      filesThatDidNotRequireFormatting: [],
      filesThatDidRequireFormatting: [],
      filesWithErrors: []
    })

    expect(result.total).toBe(0)
    expect(result.allFormatted).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  test('mix of all three categories', () => {
    const result = cli.buildCheckSummary({
      filesThatDidNotRequireFormatting: ['ok.clj'],
      filesThatDidRequireFormatting: ['messy.clj'],
      filesWithErrors: ['broken.clj']
    })

    expect(result.total).toBe(3)
    expect(result.numAlreadyFormatted).toBe(1)
    expect(result.numNeedFormatting).toBe(1)
    expect(result.numErrors).toBe(1)
    expect(result.allFormatted).toBe(false)
    expect(result.exitCode).toBe(1)
  })
})

// =========================================================================
// buildFixSummary
// =========================================================================

describe('buildFixSummary', () => {
  test('all files already formatted (no writes needed)', () => {
    const result = cli.buildFixSummary({
      filesThatDidNotRequireFormatting: ['a.clj', 'b.clj'],
      filesThatWereFormatted: [],
      filesWithErrors: []
    })

    expect(result.total).toBe(2)
    expect(result.numAlreadyFormatted).toBe(2)
    expect(result.numWereFormatted).toBe(0)
    expect(result.numErrors).toBe(0)
    expect(result.allSuccess).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  test('some files were formatted successfully', () => {
    const result = cli.buildFixSummary({
      filesThatDidNotRequireFormatting: ['a.clj'],
      filesThatWereFormatted: ['b.clj', 'c.clj'],
      filesWithErrors: []
    })

    expect(result.total).toBe(3)
    expect(result.numAlreadyFormatted).toBe(1)
    expect(result.numWereFormatted).toBe(2)
    expect(result.allSuccess).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  test('errors cause exit code 1 even if some files succeeded', () => {
    const result = cli.buildFixSummary({
      filesThatDidNotRequireFormatting: ['a.clj'],
      filesThatWereFormatted: ['b.clj'],
      filesWithErrors: ['bad.clj']
    })

    expect(result.total).toBe(3)
    expect(result.numErrors).toBe(1)
    expect(result.allSuccess).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  test('all files have errors', () => {
    const result = cli.buildFixSummary({
      filesThatDidNotRequireFormatting: [],
      filesThatWereFormatted: [],
      filesWithErrors: ['a.clj', 'b.clj']
    })

    expect(result.total).toBe(2)
    expect(result.allSuccess).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  test('empty input (no files processed)', () => {
    const result = cli.buildFixSummary({
      filesThatDidNotRequireFormatting: [],
      filesThatWereFormatted: [],
      filesWithErrors: []
    })

    expect(result.total).toBe(0)
    expect(result.allSuccess).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  test('single file formatted', () => {
    const result = cli.buildFixSummary({
      filesThatDidNotRequireFormatting: [],
      filesThatWereFormatted: ['only.clj'],
      filesWithErrors: []
    })

    expect(result.total).toBe(1)
    expect(result.allSuccess).toBe(true)
    expect(result.exitCode).toBe(0)
  })
})

// =========================================================================
// Cross-function integration scenarios
// =========================================================================

describe('integration: classifyFormatResult → buildCheckSummary', () => {
  test('three files: one clean, one messy, one error', () => {
    const files = [
      { original: '(ns foo)\n', formatResult: { status: 'success', out: '(ns foo)' } },
      { original: '(ns  bar)\n', formatResult: { status: 'success', out: '(ns bar)' } },
      { original: '(ns baz', formatResult: { status: 'error', reason: 'Unexpected EOF' } }
    ]

    const checkResult = {
      filesThatDidNotRequireFormatting: [],
      filesThatDidRequireFormatting: [],
      filesWithErrors: []
    }

    files.forEach((f, i) => {
      const classification = cli.classifyFormatResult(f.original, f.formatResult)
      const name = 'file' + i + '.clj'

      if (classification.action === 'already-formatted') {
        checkResult.filesThatDidNotRequireFormatting.push(name)
      } else if (classification.action === 'formatted') {
        checkResult.filesThatDidRequireFormatting.push(name)
      } else {
        checkResult.filesWithErrors.push(name)
      }
    })

    const summary = cli.buildCheckSummary(checkResult)

    expect(summary.numAlreadyFormatted).toBe(1)
    expect(summary.numNeedFormatting).toBe(1)
    expect(summary.numErrors).toBe(1)
    expect(summary.allFormatted).toBe(false)
    expect(summary.exitCode).toBe(1)
  })
})

describe('integration: classifyFormatResult → buildFixSummary', () => {
  test('two files: one already formatted, one formatted by fix', () => {
    const files = [
      { original: '(ns foo)\n', formatResult: { status: 'success', out: '(ns foo)' } },
      { original: '(ns  bar)\n', formatResult: { status: 'success', out: '(ns bar)' } }
    ]

    const fixResult = {
      filesThatDidNotRequireFormatting: [],
      filesThatWereFormatted: [],
      filesWithErrors: []
    }

    files.forEach((f, i) => {
      const classification = cli.classifyFormatResult(f.original, f.formatResult)
      const name = 'file' + i + '.clj'

      if (classification.action === 'already-formatted') {
        fixResult.filesThatDidNotRequireFormatting.push(name)
      } else if (classification.action === 'formatted') {
        fixResult.filesThatWereFormatted.push(name)
      } else {
        fixResult.filesWithErrors.push(name)
      }
    })

    const summary = cli.buildFixSummary(fixResult)

    expect(summary.numAlreadyFormatted).toBe(1)
    expect(summary.numWereFormatted).toBe(1)
    expect(summary.allSuccess).toBe(true)
    expect(summary.exitCode).toBe(0)
  })
})

describe('integration: mergeConfigIntoArgv → convertStringsToArrays', () => {
  test('config values flow through the pipeline correctly', () => {
    let argv = { include: 'cli-override.clj' }
    const config = {
      include: ['src/**/*.clj'],
      ignore: 'vendor/',
      'log-level': 'quiet'
    }

    argv = cli.mergeConfigIntoArgv(argv, config)
    argv = cli.convertStringsToArrays(argv)

    expect(argv.include).toEqual(['cli-override.clj'])
    expect(argv.includeFromConfig).toEqual(['src/**/*.clj'])
    expect(argv.ignoreFromConfig).toEqual(['vendor/'])
    expect(argv['log-level']).toBe('quiet')
  })
})
