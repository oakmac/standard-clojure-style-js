/* global afterEach beforeEach describe expect test */

const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const standardClj = require('../lib/standard-clojure-style.js')

const cliFile = path.join(__dirname, '..', 'cli.mjs')

let tempDir = null

function runCli (args, opts = {}) {
  const result = childProcess.spawnSync(
    process.execPath,
    [cliFile, ...args],
    {
      cwd: opts.cwd || tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        FORCE_COLOR: '0'
      },
      input: opts.input,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    }
  )

  if (result.error) {
    throw result.error
  }

  expect(result.signal).toBeNull()

  return result
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'standard-clj-cli-'))
})

afterEach(() => {
  fs.rmSync(tempDir, { force: true, recursive: true })
  tempDir = null
})

describe('fix command stdin/stdout mode', () => {
  test('writes complete output when stdout is a pipe', () => {
    const source = Array.from(
      { length: 10000 },
      (_, i) => '(defn func-' + i + ' [x] (+ x ' + i + '))'
    ).join('\n')

    const formatResult = standardClj.format(source)

    expect(formatResult.status).toBe('success')
    expect(Buffer.byteLength(formatResult.out)).toBeGreaterThan(256 * 1024)

    // spawnSync captures stdout through a pipe, which reproduces the
    // process.exit() truncation behavior reported in Issue #213.
    const result = runCli(['fix', '-'], {
      input: source
    })

    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(result.stdout).toBe(formatResult.out + '\n')
  })
})
