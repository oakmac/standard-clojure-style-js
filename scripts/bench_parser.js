#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const rootDir = path.join(__dirname, '../')

const scsLib = require('../lib/standard-clojure-style.js')

console.log('Parsing clojure.core …')

const clojureCoreTxt = fs.readFileSync(path.join(rootDir, 'test_perf', 'core.clj'), 'utf8')

const t0 = performance.now()
scsLib.parse(clojureCoreTxt)
const t1 = performance.now()

console.log(`Parsed clojure.core in ${t1 - t0} milliseconds.`)
