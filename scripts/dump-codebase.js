#! /usr/bin/env node
// Dump the essential codebase files into a single text file for LLM consumption.

const fs = require('fs')
const { globSync } = require('tinyglobby')

// ====================== FILE LIST ======================
const patterns = [
  'README.md',
  // 'lib/standard-clojure-style.js',
  'cli.mjs',
  'cli_file_discovery.mjs',
  'cli_util.js',

  // 'test/cli_file_discovery.test.js',
  // 'test/cli_util.test.js',
  // 'test/format.test.js',
  // 'test/internals.test.js',
  // 'test/parse_ns.test.js',
  // 'test/parser.test.js',

  'test/*.js'

  // 'test_format/*.eno',
  // 'test_parse_ns/*.eno',
  // 'test_parser/*.eno'
]
// ======================================================

// Never dump secrets, even if a pattern above would match them.
const DENYLIST = []
const DENY_EXT = /\.(pem|key)$/

// Rough token estimate. Real tokenizers vary by model, but ~4 chars/token
// is a decent ballpark for gauging whether you'll blow past a context limit.
const estimateTokens = (str) => Math.ceil(str.length / 4)
const fmt = (n) => n.toLocaleString('en-US')

// ---- collect files ----
const globOpts = {
  expandDirectories: false,
  onlyFiles: true
}

const files = patterns
  .flatMap((p) => globSync(p, globOpts).sort())
  .filter((f, i, arr) => arr.indexOf(f) === i) // dedupe
  .filter((f) => !DENYLIST.includes(f)) // strip secrets
  .filter((f) => !DENY_EXT.test(f)) // strip key files

// ---- gather per-file stats ----
const stats = files.map((f) => {
  const contents = fs.readFileSync(f, 'utf8')
  return {
    path: f,
    contents,
    lines: contents.split('\n').length,
    tokens: estimateTokens(contents)
  }
})

const totalLines = stats.reduce((sum, s) => sum + s.lines, 0)
const totalTokens = stats.reduce((sum, s) => sum + s.tokens, 0)

// ---- build an indented file tree from the matched paths ----
function buildTree (paths) {
  const root = {}
  for (const p of paths) {
    let node = root
    for (const part of p.split('/')) {
      node[part] = node[part] || {}
      node = node[part]
    }
  }
  return root
}

// Map "dir/file" -> stats so we can annotate leaves with counts.
const statByPath = Object.fromEntries(stats.map((s) => [s.path, s]))

function renderTree (node, prefix = '', trail = '') {
  const keys = Object.keys(node).sort((a, b) => {
    // directories (have children) first, then files, each alphabetical
    const aDir = Object.keys(node[a]).length > 0
    const bDir = Object.keys(node[b]).length > 0
    if (aDir !== bDir) return aDir ? -1 : 1
    return a.localeCompare(b)
  })

  let out = ''
  keys.forEach((key, i) => {
    const isLast = i === keys.length - 1
    const branch = isLast ? '└── ' : '├── '
    const fullPath = trail ? `${trail}/${key}` : key
    const isFile = Object.keys(node[key]).length === 0

    if (isFile) {
      const s = statByPath[fullPath]
      const annotation = s ? `  (${fmt(s.lines)} lines, ~${fmt(s.tokens)} tok)` : ''
      out += `${prefix}${branch}${key}${annotation}\n`
    } else {
      out += `${prefix}${branch}${key}/\n`
      const childPrefix = prefix + (isLast ? '    ' : '│   ')
      out += renderTree(node[key], childPrefix, fullPath)
    }
  })
  return out
}

// ---- assemble the summary header ----
let summary = ''
summary += '========================================\n'
summary += ' CODEBASE DUMP\n'
summary += '========================================\n'
summary += `Generated: ${new Date().toISOString()}\n`
summary += `Files:     ${fmt(files.length)}\n`
summary += `Lines:     ${fmt(totalLines)}\n`
summary += `Est tokens: ~${fmt(totalTokens)}   (rough, ~4 chars/token)\n`
summary += '\n'
summary += 'FILE TREE\n'
summary += '---------\n'
summary += renderTree(buildTree(files))
summary += '\n'
summary += '========================================\n'
summary += ' FILE CONTENTS\n'
summary += '========================================\n'

// ---- assemble the body ----
let body = ''
stats.forEach((s) => {
  body += `\n<DUMP:FILE path="${s.path}">\n`
  body += s.contents + '\n'
  body += '</DUMP:FILE>\n'
  console.log('Dumping:', s.path)
})

fs.writeFileSync('code_dump.txt', summary + body)

console.log(`\nDone! ${files.length} files written to code_dump.txt`)
console.log(`Total lines: ${fmt(totalLines)}`)
console.log(`Est. tokens: ~${fmt(totalTokens)}`)
