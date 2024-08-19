#!/usr/bin/env node

// The purpose of this file is to handle everything related to running
// Standard Clojure Style via the command line.
//
// Copyright 2023 © Chris Oakman
// ISC License
// https://github.com/oakmac/standard-clojure-style-js/

const fs = require('fs-plus')
// const path = require('path')

const yargs = require('yargs')

const standardClj = require('./lib/standard-clojure-style.js')

// https://clig.dev/#the-basics
// Return zero exit code on success, non-zero on failure. Exit codes are how scripts determine whether a program succeeded or failed, so you should report this correctly. Map the non-zero exit codes to the most important failure modes.

// command: list
// lists the files that would be formatted
// --json or --edn option
//
// --verbose, --chatty-kathy
// provide lots of information about what the script is doing
//
// command: format
// formats the files "in-place"
//

function formatFileSync (filename) {
  const fileTxt = fs.readFileSync(filename, 'utf8')
  const result = standardClj.format(fileTxt)

  if (result.status === 'success') {
    fs.writeFileSync(filename, result.out)
  } else {
    console.error('FIXME: format() returned error, need to handle this case')
  }
}

function processFormatCmd (argv) {
  console.log('processFormatCmd!!!!!')
  console.log(argv)

  // TODO: get this via argv, glob pattern?
  const filesToFormat = [

    './test.clj'
  ]

  filesToFormat.forEach(formatFileSync)
}

const yargsFormatCommand = {
  command: 'format',
  describe: 'FIXME: describe the format command here',
  handler: processFormatCmd
}

yargs.scriptName('standard-clj')
  .usage('$0 <cmd> [args]')
  .command(yargsFormatCommand)
  .alias('f', 'file')
  .nargs('f', 1)
  .describe('f', 'Load a file')

  // .command('format [name]', 'welcome ter yargs!', (yargs) => {
  //   yargs.positional('name', {
  //     type: 'string',
  //     default: 'Cambi',
  //     describe: 'the name to say hello to'
  //   })
  // }, function (argv) {
  //   console.log('hello', argv.name, 'welcome to yargs!')
  // })
  .demandCommand() // show them --help if they do not pass a valid command
  .help()
  .argv

// if they pass in multiple files, then those should be formatted
// if they pass in multiple directories, then those should be recurisvely formatted
