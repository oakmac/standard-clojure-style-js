const fs = require('fs')
const path = require('path')
const rootDir = path.join(__dirname, '../')

const clojurefmtLib = require('../lib/clojurefmt.js')

console.log('Parsing clojure.core …')

const t0 = performance.now()

const coreContent = fs.readFileSync(path.join(rootDir, 'test_perf', 'core.clj'), 'utf8')
const parsed = clojurefmtLib.parseAst(coreContent)

const t1 = performance.now()

console.log(`Parsed clojure.core in ${t1 - t0} milliseconds.`)
