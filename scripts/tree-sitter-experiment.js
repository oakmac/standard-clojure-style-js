#! /usr/bin/env node

// ISC License
// Copyright © 2024, Chris Oakman
// https://github.com/oakmac/standard-clojure-style-js/
//
// This file creates a release in the dist/ folder, ready for publishing to npm.

const assert = require('assert')
const fs = require('fs-plus')
const path = require('path')
const terser = require('terser')





const Parser = require('tree-sitter');
const TreeSitterJSGrammer = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(TreeSitterJSGrammer);




const rootDir = path.join(__dirname, '../')
const libFilename = path.join(rootDir, 'lib/standard-clojure-style.js')
// const lib = require(libFilename)

// sanity-checks
// assert(lib, libFilename + ' source file not found?')
// assert(isFunction(lib._charAt), 'please ensure that exportInternalFnsForTesting = true before publishing')

const encoding = { encoding: 'utf8' }

const copyrightYear = '2023'
const packageJSON = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), encoding))
const version = packageJSON.version


const libSrc = fs.readFileSync(libFilename, 'utf8')

// assert(libSrc.includes('// standard-clojure-style @@VERSION@@'), '@@VERSION@@ template not found!')
// assert(libSrc.includes('const exportInternalFnsForTesting = true // 24d4533f-0f94-4d9c-85f9-048aca1e19b6'), 'exportInternalFnsForTesting flag not found!')

// console.log(libSrc)


const sourceCode = 'let x = 1; console.log(x);';
const tree = parser.parse(libSrc);

// const tree = parser.parse(libSrc);

const rootNode = tree.rootNode
const rootNodeChildren = rootNode.children

// for (var i = 0; i < rootNodeChildren.length; i++) {
//   const node = rootNodeChildren[i]
//   console.log(node.text)
//   console.log('9999999999999999999999999999999999')
// }

const yyyyyyyy = getAllNodes(rootNode)
yyyyyyyy.forEach((n) => {
  console.log('type:', n.type)
  console.log('text:', n.text)
  console.log('================================')
})

// console.log(yyyyyyyy)



// infoLog('Success 👍')
process.exit(0)

// ---------------------------------------------------------------------------
// Util

function banner () {
  return '/*! Standard Clojure Style v' + version + ' | (c) ' + copyrightYear + ' Chris Oakman | ISC License | https://github.com/oakmac/standard-clojure-style-js */\n'
}

function isString (s) {
  return typeof s === 'string'
}

function isFunction (f) {
  return typeof f === 'function'
}

function infoLog (msg) {
  console.log('[scripts/build-release.js] ' + msg)
}





function getAllNodes(tree) {
  const result = [];
  let visitedChildren = false;
  let cursor = tree.walk();
  while (true) {
    if (!visitedChildren) {
      result.push(cursor.currentNode);
      if (!cursor.gotoFirstChild()) {
        visitedChildren = true;
      }
    } else if (cursor.gotoNextSibling()) {
      visitedChildren = false;
    } else if (!cursor.gotoParent()) {
      break;
    }
  }
  return result;
}
