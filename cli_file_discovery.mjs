// Filesystem-backed file discovery for the Standard Clojure Style CLI.
//
// This module owns the behavior of positional files/directories, --include
// patterns, and --ignore patterns. The glob library is an implementation
// detail; callers should only depend on discoverFiles().

import fs from 'fs-plus'
import path from 'path'
import { globSync } from 'glob'

function absolutePath (rootDir, filename) {
  if (path.isAbsolute(filename)) {
    return path.normalize(filename)
  }
  return path.resolve(rootDir, filename)
}

function hasAllowedExtension (filename, fileExtensions) {
  return fileExtensions.has(path.extname(filename))
}

function addFilesFromDirectory (files, directory, shouldIncludeFile) {
  fs.traverseTreeSync(directory, filename => {
    const absoluteFilename = path.resolve(filename)
    if (fs.isFileSync(absoluteFilename) && shouldIncludeFile(absoluteFilename)) {
      files.add(absoluteFilename)
    }
    return true
  }, () => true)
}

function filesFromGlob (rootDir, pattern) {
  return globSync(pattern, {
    absolute: true,
    cwd: rootDir,
    nodir: true
  })
    .map(filename => absolutePath(rootDir, filename))
    .filter(filename => fs.isFileSync(filename))
}

// This is intentionally narrower than every pattern understood by "glob".
// Its only purpose is deciding whether a no-match --ignore value should be
// treated as a harmless pattern or warned about as a missing literal path.
function containsGlobSyntax (pattern) {
  return pattern.includes('*') ||
         pattern.includes('?') ||
         pattern.includes('[') ||
         pattern.includes(']') ||
         pattern.includes('{') ||
         pattern.includes('}')
}

function addDirectArgument (files, rootDir, directArg, fileExtensions, onMissingPath) {
  const possibleFileOrDir = absolutePath(rootDir, directArg)

  if (fs.isFileSync(possibleFileOrDir)) {
    // A directly named file is explicit, so allow any extension.
    files.add(possibleFileOrDir)
  } else if (fs.isDirectorySync(possibleFileOrDir)) {
    addFilesFromDirectory(
      files,
      possibleFileOrDir,
      filename => hasAllowedExtension(filename, fileExtensions)
    )
  } else {
    onMissingPath('include', directArg)
  }
}

function addIncludePattern (files, rootDir, pattern, fileExtensions) {
  filesFromGlob(rootDir, pattern).forEach(filename => {
    if (hasAllowedExtension(filename, fileExtensions)) {
      files.add(filename)
    }
  })
}

function addIgnorePattern (files, rootDir, pattern, onMissingPath) {
  const possibleFileOrDir = absolutePath(rootDir, pattern)

  if (fs.isFileSync(possibleFileOrDir)) {
    files.add(possibleFileOrDir)
  } else if (fs.isDirectorySync(possibleFileOrDir)) {
    // Ignore every file beneath an explicitly named directory. Do not apply
    // the extension filter here: ignores should also be able to remove a
    // directly named file with a non-standard extension.
    addFilesFromDirectory(files, possibleFileOrDir, () => true)
  } else {
    const globFiles = filesFromGlob(rootDir, pattern)
    globFiles.forEach(filename => files.add(filename))

    // A glob pattern that matches nothing is valid and should be silent. Keep
    // the existing warning for a literal path that does not exist.
    if (globFiles.length === 0 && !containsGlobSyntax(pattern)) {
      onMissingPath('ignore', pattern)
    }
  }
}

function discoverFiles (opts) {
  const includeFiles = new Set()
  const ignoreFiles = new Set()
  const directArgs = opts.directArgs || []
  const includePatterns = opts.includePatterns || []
  const ignorePatterns = opts.ignorePatterns || []
  const onMissingPath = opts.onMissingPath || (() => {})

  directArgs.forEach(directArg => {
    addDirectArgument(
      includeFiles,
      opts.rootDir,
      directArg,
      opts.fileExtensions,
      onMissingPath
    )
  })

  includePatterns.forEach(pattern => {
    addIncludePattern(
      includeFiles,
      opts.rootDir,
      pattern,
      opts.fileExtensions
    )
  })

  ignorePatterns.forEach(pattern => {
    addIgnorePattern(ignoreFiles, opts.rootDir, pattern, onMissingPath)
  })

  const discoveredFiles = new Set()
  includeFiles.forEach(filename => {
    if (!ignoreFiles.has(filename)) {
      discoveredFiles.add(filename)
    }
  })
  return discoveredFiles
}

export default {
  discoverFiles
}
