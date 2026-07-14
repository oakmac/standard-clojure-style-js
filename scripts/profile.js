#!/usr/bin/env node

// Runs the formatter on test_perf/core.clj under the V8 sampling profiler
// and prints a report of where time is being spent.
//
// Usage:
//   node script/profile.js            <-- profile format()
//   node script/profile.js parse      <-- profile parse() only
//
// Also writes profile.cpuprofile to the repo root, which you can load into
// Chrome DevTools (Performance tab -> load profile) or https://speedscope.app
// for a flamegraph.

const fs = require('fs')
const path = require('path')
const inspector = require('inspector')

const rootDir = path.join(__dirname, '../')
const libPath = path.join(rootDir, 'lib', 'standard-clojure-style.js')
const scsLib = require(libPath)

const mode = process.argv[2] === 'parse' ? 'parse' : 'format'
const numRuns = 3 // more runs = more samples = better report

const clojureCoreTxt = fs.readFileSync(path.join(rootDir, 'test_perf', 'core.clj'), 'utf8')
const libSourceLines = fs.readFileSync(libPath, 'utf8').split('\n')

// ---------------------------------------------------------------------------
// inspector session plumbing

const session = new inspector.Session()
session.connect()

function post (method, params) {
  return new Promise((resolve, reject) => {
    session.post(method, params, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

// ---------------------------------------------------------------------------
// report helpers

// Many of the hot functions in the lib are anonymous arrow functions
// (the .parse methods created inside Regex, Seq, Choice, etc), so a bare
// functionName is often useless. Map each frame's line number back to the
// enclosing top-level `function Foo (...)` in the lib source so the report
// reads as "Regex > parse" instead of "parse L400".
const enclosingFns = [] // [{ line: <0-indexed>, name: 'Regex' }, ...] sorted
for (let i = 0; i < libSourceLines.length; i++) {
  const m = libSourceLines[i].match(/^\s*function ([A-Za-z0-9_]+) ?\(/)
  if (m) enclosingFns.push({ line: i, name: m[1] })
}

function enclosingFnName (lineNumber) {
  let found = null
  for (const fn of enclosingFns) {
    if (fn.line <= lineNumber) found = fn.name
    else break
  }
  return found
}

function frameLabel (callFrame) {
  const isLibFrame = callFrame.url.endsWith('standard-clojure-style.js')
  const name = callFrame.functionName || '(anonymous)'

  if (isLibFrame) {
    // lineNumber is 0-indexed
    const lineNo = callFrame.lineNumber + 1
    const enclosing = enclosingFnName(callFrame.lineNumber)
    if (enclosing && enclosing !== name) {
      return enclosing + ' > ' + name + '  (L' + lineNo + ')'
    }
    return name + '  (L' + lineNo + ')'
  }

  // frames outside the lib (GC, native regex, node internals, etc)
  if (callFrame.url === '') return '(V8/native) ' + name
  return name + '  [' + path.basename(callFrame.url) + ']'
}

function pct (part, whole) {
  return ((100 * part) / whole).toFixed(1).padStart(5) + '%'
}

function ms (micros) {
  return (micros / 1000).toFixed(1).padStart(8) + ' ms'
}

// ---------------------------------------------------------------------------
// main

async function main () {
  // warm up the JIT so we profile steady-state performance
  scsLib.format(clojureCoreTxt.substring(0, 40000))

  await post('Profiler.enable')
  await post('Profiler.setSamplingInterval', { interval: 100 }) // microseconds

  await post('Profiler.start')
  const t0 = performance.now()
  for (let i = 0; i < numRuns; i++) {
    if (mode === 'parse') {
      scsLib.parse(clojureCoreTxt)
    } else {
      const result = scsLib.format(clojureCoreTxt)
      if (result.status !== 'success') {
        throw new Error('format() failed: ' + result.reason)
      }
    }
  }
  const t1 = performance.now()
  const { profile } = await post('Profiler.stop')

  const wallMs = t1 - t0

  // -------------------------------------------------------------------------
  // 1. Self time per function (where the CPU actually was)

  const totalMicros = profile.endTime - profile.startTime
  const nodeById = new Map()
  for (const node of profile.nodes) nodeById.set(node.id, node)

  // hitCount on a node = number of samples where that frame was on top of
  // the stack. Convert to time using the sampling interval implied by the
  // profile itself.
  let totalHits = 0
  for (const node of profile.nodes) totalHits += node.hitCount || 0
  const microsPerHit = totalMicros / totalHits

  const selfByLabel = new Map()
  for (const node of profile.nodes) {
    if (!node.hitCount) continue
    const label = frameLabel(node.callFrame)
    selfByLabel.set(label, (selfByLabel.get(label) || 0) + node.hitCount * microsPerHit)
  }

  // -------------------------------------------------------------------------
  // 2. Total (inclusive) time per function: for each sample, credit every
  //    distinct function on the stack once. This tells you which functions
  //    are expensive *including* everything they call.

  // build the stack (chain of labels to the root) for every node, memoized
  const parentOf = new Map()
  for (const node of profile.nodes) {
    if (node.children) {
      for (const childId of node.children) parentOf.set(childId, node.id)
    }
  }

  const labelSetCache = new Map()
  function labelSetFor (nodeId) {
    if (labelSetCache.has(nodeId)) return labelSetCache.get(nodeId)
    const node = nodeById.get(nodeId)
    const parentId = parentOf.get(nodeId)
    const set = new Set(parentId ? labelSetFor(parentId) : [])
    set.add(frameLabel(node.callFrame))
    labelSetCache.set(nodeId, set)
    return set
  }

  const totalByLabel = new Map()
  for (const node of profile.nodes) {
    if (!node.hitCount) continue
    const micros = node.hitCount * microsPerHit
    for (const label of labelSetFor(node.id)) {
      totalByLabel.set(label, (totalByLabel.get(label) || 0) + micros)
    }
  }

  // -------------------------------------------------------------------------
  // print the report

  const line = '-'.repeat(100)

  console.log('')
  console.log('standard-clojure-style perf report')
  console.log(line)
  console.log('mode:        ' + mode + '()')
  console.log('input:       test_perf/core.clj (' + clojureCoreTxt.length + ' chars)')
  console.log('runs:        ' + numRuns)
  console.log('wall time:   ' + wallMs.toFixed(0) + ' ms total, ' + (wallMs / numRuns).toFixed(0) + ' ms per run')
  console.log('samples:     ' + totalHits + ' (~' + Math.round(microsPerHit) + 'µs each)')
  console.log('')

  const topN = 30

  console.log('TOP ' + topN + ' BY SELF TIME (time spent in the function body itself)')
  console.log(line)
  const selfSorted = [...selfByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN)
  for (const [label, micros] of selfSorted) {
    console.log(pct(micros, totalMicros) + '  ' + ms(micros) + '  ' + label)
  }

  console.log('')
  console.log('TOP ' + topN + ' BY TOTAL TIME (function + everything it calls)')
  console.log(line)
  const totalSorted = [...totalByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN)
  for (const [label, micros] of totalSorted) {
    console.log(pct(micros, totalMicros) + '  ' + ms(micros) + '  ' + label)
  }

  // -------------------------------------------------------------------------
  // dump the raw profile for flamegraph inspection

  const outFile = path.join(rootDir, mode + '.cpuprofile')
  fs.writeFileSync(outFile, JSON.stringify(profile))
  console.log('')
  console.log(line)
  console.log('Raw profile written to ' + path.basename(outFile))
  console.log('Open it in Chrome DevTools (Performance tab -> load) or https://speedscope.app for a flamegraph.')

  session.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
