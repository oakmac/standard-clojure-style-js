/* global afterEach beforeEach describe expect test */

const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const cliFile = path.join(__dirname, '..', 'cli.mjs')

let projectDir = null

function writeFile (relativeFilename, contents) {
  const absoluteFilename = path.join(projectDir, relativeFilename)
  fs.mkdirSync(path.dirname(absoluteFilename), { recursive: true })
  fs.writeFileSync(absoluteFilename, contents)
}

function createTestProject () {
  const files = {
    'dev/user.clj': '(ns user)\n',
    'resources/config.edn': '{:enabled true}\n',
    'src/browser.cljs': '(ns browser)\n',
    'src/core.clj': '(ns core)\n',
    'src/data.edn': '{:hello "world"}\n',
    'src/experimental.jank': '(ns experimental)\n',
    'src/generated/generated.clj': '(ns generated)\n',
    'src/generated/generated.cljs': '(ns generated-browser)\n',
    'src/nested/deep.clj': '(ns nested.deep)\n',
    'src/nested/deep.cljs': '(ns nested.deep-browser)\n',
    'src/nested/deep.cljc': '(ns nested.deep-shared)\n',
    'src/nested/notes.md': '# notes\n',
    'src/notes.txt': 'not Clojure\n',
    'src/shared.cljc': '(ns shared)\n',
    'test/core_test.clj': '(ns core-test)\n',
    'test/nested/browser_test.cljs': '(ns browser-test)\n'
  }

  Object.entries(files).forEach(([relativeFilename, contents]) => {
    writeFile(relativeFilename, contents)
  })
}

function absoluteFiles (...relativeFilenames) {
  return relativeFilenames
    .map(relativeFilename => path.join(projectDir, relativeFilename))
    .sort()
}

function runList (...args) {
  const result = childProcess.spawnSync(
    process.execPath,
    [cliFile, 'list', ...args, '--output', 'json'],
    {
      cwd: projectDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        FORCE_COLOR: '0'
      },
      windowsHide: true
    }
  )

  if (result.error) {
    throw result.error
  }

  expect(result.signal).toBeNull()
  expect(result.status).toBe(0)
  expect(result.stderr).toBe('')

  return JSON.parse(result.stdout)
}

// Like runList, but does not require an empty stderr or exit code 0.
// Used to test warning behavior. Returns { files, status, stderr }.
function runListCaptureStderr (...args) {
  const result = childProcess.spawnSync(
    process.execPath,
    [cliFile, 'list', ...args, '--output', 'json'],
    {
      cwd: projectDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        FORCE_COLOR: '0'
      },
      windowsHide: true
    }
  )

  if (result.error) {
    throw result.error
  }

  expect(result.signal).toBeNull()

  return {
    files: JSON.parse(result.stdout || '[]'),
    status: result.status,
    stderr: result.stderr
  }
}

function writeJSONConfig (config) {
  writeFile('.standard-clj.json', JSON.stringify(config, null, 2) + '\n')
}

function writeEDNConfig (configText) {
  writeFile('.standard-clj.edn', configText)
}

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'standard-clj-file-discovery-'))
  createTestProject()
})

afterEach(() => {
  fs.rmSync(projectDir, { force: true, recursive: true })
  projectDir = null
})

describe('direct file and directory arguments', () => {
  test('includes a directly named file', () => {
    expect(runList('src/core.clj')).toEqual(absoluteFiles('src/core.clj'))
  })

  test('allows a directly named file with a non-default extension', () => {
    expect(runList('src/notes.txt')).toEqual(absoluteFiles('src/notes.txt'))
  })

  test('recursively discovers supported files in a directory', () => {
    expect(runList('src')).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('uses --file-ext when discovering files from a directory', () => {
    expect(runList('src', '--file-ext', 'clj,cljs')).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs'
    ))
  })
})

describe('--include files and directories', () => {
  test('includes a directly named file with a supported extension', () => {
    expect(runList(
      '--include', 'src/core.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj'
    ))
  })

  test('filters a directly named file with a non-default extension', () => {
    expect(runList(
      '--include', 'src/notes.txt'
    )).toEqual([])
  })

  test('recursively discovers supported files in a literal directory', () => {
    expect(runList(
      '--include', 'src'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('accepts a trailing slash on a literal directory', () => {
    expect(runList(
      '--include', 'src/'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('recursively discovers files from a nested literal directory', () => {
    expect(runList(
      '--include', 'src/nested'
    )).toEqual(absoluteFiles(
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc'
    ))
  })

  test('supports an absolute literal directory', () => {
    expect(runList(
      '--include', path.join(projectDir, 'src/nested')
    )).toEqual(absoluteFiles(
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc'
    ))
  })

  test('combines multiple literal directories', () => {
    expect(runList(
      '--include', 'dev',
      '--include', 'test'
    )).toEqual(absoluteFiles(
      'dev/user.clj',
      'test/core_test.clj',
      'test/nested/browser_test.cljs'
    ))
  })

  test('combines a literal directory with a glob pattern', () => {
    expect(runList(
      '--include', 'dev',
      '--include', 'src/**/*.cljc'
    )).toEqual(absoluteFiles(
      'dev/user.clj',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('deduplicates a literal directory and an overlapping glob pattern', () => {
    expect(runList(
      '--include', 'src',
      '--include', 'src/**/*.clj'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('uses --file-ext when discovering files from a literal directory', () => {
    expect(runList(
      '--include', 'src',
      '--file-ext', 'clj,cljc'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj',
      'src/nested/deep.clj',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('applies literal directory ignores to a literal include directory', () => {
    expect(runList(
      '--include', 'src',
      '--ignore', 'src/generated'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('applies ignore globs to a literal include directory', () => {
    expect(runList(
      '--include', 'src',
      '--ignore', 'src/{generated,nested}/**/*'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/shared.cljc'
    ))
  })

  test('recursively discovers supported files from the current directory', () => {
    expect(runList(
      '--include', '.'
    )).toEqual(absoluteFiles(
      'dev/user.clj',
      'resources/config.edn',
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc',
      'test/core_test.clj',
      'test/nested/browser_test.cljs'
    ))
  })

  test('returns an empty list for an empty literal directory', () => {
    fs.mkdirSync(path.join(projectDir, 'empty'))

    expect(runList(
      '--include', 'empty'
    )).toEqual([])
  })
})

describe('--include patterns', () => {
  test('* matches files in one directory level', () => {
    expect(runList('--include', 'src/*.clj')).toEqual(absoluteFiles(
      'src/core.clj'
    ))
  })

  test('** recursively matches nested directories', () => {
    expect(runList('--include', 'src/**/*.clj')).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj',
      'src/nested/deep.clj'
    ))
  })

  test('supports brace expansion for file extensions', () => {
    expect(runList('--include', 'src/**/*.{clj,cljs,cljc}')).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('supports brace expansion for directory names', () => {
    expect(runList('--include', '{src,test}/**/*.clj')).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj',
      'src/nested/deep.clj',
      'test/core_test.clj'
    ))
  })

  test('combines multiple include patterns', () => {
    expect(runList(
      '--include', 'src/**/*.clj',
      '--include', 'test/**/*.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj',
      'src/nested/deep.clj',
      'test/core_test.clj'
    ))
  })

  test('deduplicates files matched by multiple include patterns', () => {
    expect(runList(
      '--include', 'src/**/*.clj',
      '--include', 'src/core.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj',
      'src/nested/deep.clj'
    ))
  })

  test('combines direct arguments with command-line include patterns', () => {
    expect(runList(
      'dev/user.clj',
      '--include', 'src/*.clj'
    )).toEqual(absoluteFiles(
      'dev/user.clj',
      'src/core.clj'
    ))
  })

  test('broad include patterns return only regular files with supported extensions', () => {
    expect(runList('--include', 'src/**/*')).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('uses --file-ext to filter files discovered by include patterns', () => {
    expect(runList(
      '--include', 'src/**/*',
      '--file-ext', 'clj,cljc'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj',
      'src/nested/deep.clj',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('returns an empty list when no include pattern matches', () => {
    expect(runList('--include', 'does-not-exist/**/*.clj')).toEqual([])
  })
})

describe('--ignore patterns', () => {
  test('ignores a relative filename selected by an include pattern', () => {
    expect(runList(
      '--include', 'src/**/*.clj',
      '--ignore', 'src/nested/deep.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj'
    ))
  })

  test('ignores all supported files beneath a directory', () => {
    expect(runList(
      '--include', 'src/**/*.{clj,cljs,cljc}',
      '--ignore', 'src/generated'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('supports recursive ignore glob patterns', () => {
    expect(runList(
      '--include', 'src/**/*.{clj,cljs,cljc}',
      '--ignore', 'src/generated/**/*'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('supports brace expansion in ignore patterns', () => {
    expect(runList(
      '--include', 'src/**/*.{clj,cljs,cljc}',
      '--ignore', 'src/{generated,nested}/**/*.{clj,cljs,cljc}'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/shared.cljc'
    ))
  })

  test('combines multiple ignore patterns', () => {
    expect(runList(
      '--include', 'src/**/*.clj',
      '--ignore', 'src/generated/**/*.clj',
      '--ignore', 'src/nested/**/*.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj'
    ))
  })

  test('applies ignore patterns to files discovered from a directory argument', () => {
    expect(runList(
      'src',
      '--ignore', 'src/{generated,nested}/**/*'
    )).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/shared.cljc'
    ))
  })
})

describe('configuration files and command-line precedence', () => {
  test('loads a literal include directory from .standard-clj.json', () => {
    writeJSONConfig({
      include: ['src']
    })

    expect(runList()).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('loads a literal include directory with a trailing slash from .standard-clj.edn', () => {
    writeEDNConfig(
      '{:include ["src/"]}\n'
    )

    expect(runList()).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/generated/generated.clj',
      'src/generated/generated.cljs',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('loads multiple literal include directories from configuration', () => {
    writeJSONConfig({
      include: ['dev', 'test']
    })

    expect(runList()).toEqual(absoluteFiles(
      'dev/user.clj',
      'test/core_test.clj',
      'test/nested/browser_test.cljs'
    ))
  })

  test('applies configured ignore patterns to a configured literal directory', () => {
    writeJSONConfig({
      include: ['src'],
      ignore: ['src/{generated,nested}/**/*']
    })

    expect(runList()).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/data.edn',
      'src/experimental.jank',
      'src/shared.cljc'
    ))
  })

  test('command-line literal directories replace configured include patterns', () => {
    writeJSONConfig({
      include: ['test/**/*.clj']
    })

    expect(runList(
      '--include', 'src/nested'
    )).toEqual(absoluteFiles(
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc'
    ))
  })

  test('loads include and ignore patterns from .standard-clj.json', () => {
    writeJSONConfig({
      include: ['src/**/*.{clj,cljs,cljc}'],
      ignore: ['src/generated/**/*']
    })

    expect(runList()).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('loads include and ignore patterns from .standard-clj.edn', () => {
    writeEDNConfig(
      '{:include ["src/**/*.{clj,cljs,cljc}"]\n' +
      ' :ignore ["src/generated/**/*"]}\n'
    )

    expect(runList()).toEqual(absoluteFiles(
      'src/browser.cljs',
      'src/core.clj',
      'src/nested/deep.clj',
      'src/nested/deep.cljs',
      'src/nested/deep.cljc',
      'src/shared.cljc'
    ))
  })

  test('command-line include patterns replace configured include patterns', () => {
    writeJSONConfig({
      include: ['test/**/*.clj']
    })

    expect(runList(
      '--include', 'src/*.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj'
    ))
  })

  test('direct file arguments replace configured include patterns', () => {
    writeJSONConfig({
      include: ['test/**/*.clj']
    })

    expect(runList('dev/user.clj')).toEqual(absoluteFiles(
      'dev/user.clj'
    ))
  })

  test('configured ignore patterns still apply when include is supplied on the command line', () => {
    writeJSONConfig({
      include: ['test/**/*.clj'],
      ignore: ['src/generated/**/*']
    })

    expect(runList(
      '--include', 'src/**/*.clj'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/nested/deep.clj'
    ))
  })

  test('command-line ignore patterns replace configured ignore patterns', () => {
    writeJSONConfig({
      include: ['src/**/*.clj'],
      ignore: ['src/generated/**/*']
    })

    expect(runList(
      '--ignore', 'src/nested/**/*'
    )).toEqual(absoluteFiles(
      'src/core.clj',
      'src/generated/generated.clj'
    ))
  })
})

describe('warnings for missing paths', () => {
  test('warns on stderr when a direct argument does not exist', () => {
    const result = runListCaptureStderr('does-not-exist.clj', 'src/core.clj')

    expect(result.status).toBe(0)
    expect(result.stderr).toContain('WARN')
    expect(result.stderr).toContain('does-not-exist.clj')
    expect(result.stderr).not.toContain('to ignore')
    expect(result.files).toEqual(absoluteFiles('src/core.clj'))
  })

  test('warns on stderr when a literal --ignore path does not exist', () => {
    const result = runListCaptureStderr(
      'src/core.clj',
      '--ignore', 'no-such-path'
    )

    expect(result.status).toBe(0)
    expect(result.stderr).toContain('WARN')
    expect(result.stderr).toContain('no-such-path')
    expect(result.stderr).toContain('to ignore')
    expect(result.files).toEqual(absoluteFiles('src/core.clj'))
  })

  test('an --ignore glob pattern that matches nothing is silent', () => {
    // NOTE: runList itself asserts stderr === '' and exit code 0,
    // which is exactly the contract this test exists to pin
    expect(runList(
      '--include', 'src/*.clj',
      '--ignore', 'does-not-exist/**/*'
    )).toEqual(absoluteFiles(
      'src/core.clj'
    ))
  })
})

describe('ignoring explicitly named files', () => {
  test('ignores a directly named file with a non-default extension', () => {
    expect(runList(
      'src/notes.txt',
      '--ignore', 'src/notes.txt'
    )).toEqual([])
  })

  test('a directory ignore removes a directly named file with a non-default extension', () => {
    // the ignore side intentionally applies no extension filter when
    // traversing an ignored directory
    expect(runList(
      'src/notes.txt',
      '--ignore', 'src'
    )).toEqual([])
  })
})

describe('glob library edge cases', () => {
  test('a pattern matching only a directory yields no files', () => {
    // "src*" is not a literal path, so it falls through to the glob library,
    // where it matches the src/ directory itself. With nodir (glob) or
    // onlyFiles (tinyglobby) semantics this must yield no files -- it must
    // NOT silently expand into the directory's contents. When swapping to
    // tinyglobby, pass expandDirectories: false to preserve this.
    expect(runList('--include', 'src*')).toEqual([])
  })

  test('a pattern matching a directory does not shadow sibling file matches', () => {
    writeFile('srcfile.clj', '(ns srcfile)\n')

    expect(runList('--include', 'src*')).toEqual(absoluteFiles(
      'srcfile.clj'
    ))
  })
})
