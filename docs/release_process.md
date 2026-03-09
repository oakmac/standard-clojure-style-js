# How to Publish a Release

This documents the release process for publishing a new version of Standard Clojure Style.

## Overview

There are two things that get published on each release, from this one repo:

1. **npm package** — the JS library + CLI, published to npmjs.com. Users install
   via `npm install` or `npx`.
2. **Pre-built binaries** — self-contained executables for macOS, Linux, and
   Windows. Built automatically by GitHub Actions using Bun's cross-compilation.
   Users install via Homebrew (`brew install oakmac/tap/standard-clj`) or by
   downloading from GitHub Releases.

Both are built from the same tagged commit.

## Prerequisites

- Node.js and Bun installed
- `npm` logged in (`npm whoami` should show your username)
- Push access to this repo and to [oakmac/homebrew-tap]

[oakmac/homebrew-tap]: https://github.com/oakmac/homebrew-tap

## Step-by-step

### 1. Make sure tests pass

```sh
bun test
bun run lint
```

### 2. Bump the version in package.json

Edit `package.json` and update the `"version"` field.

### 3. Commit and tag

```sh
git add package.json
git commit -m "v1.2.0"
git tag v1.2.0
```

The tag **must** match the version in `package.json` (with a `v` prefix).
`scripts/build-release.js` will refuse to run if they don't match.

### 4. Push (including tags)

```sh
git push
git push --tags
```

Pushing the tag triggers the **Release** workflow (`.github/workflows/release.yml`),
which will:
- Run lint + tests
- Inject the version and git hash into `cli.mjs`
- Cross-compile binaries for all 5 platforms using Bun
- Create a GitHub Release with the binaries attached and SHA256 checksums

### 5. Build for npm

While GitHub Actions is running, build the npm release locally:

```sh
node scripts/build-release.js
```

This script will:
- Verify your git working tree is clean
- Verify the current commit has a version tag
- Verify the tag matches `package.json`
- Create the `dist/` folder with the minified library
- Patch `cli.mjs` to import from `dist/` and inject the version + git hash

If any of these checks fail, the script exits with an error message telling you
what's wrong.

### 6. Publish to npm

```sh
npm publish
```

Your working tree will be dirty at this point (because `build-release.js`
modified `cli.mjs` and created `dist/`). That's expected — npm publishes
whatever is on disk.

### 7. Revert the build-release changes

```sh
git checkout cli.mjs
rm -rf dist/
```

These changes were only needed for the npm publish. The git repo stays clean.

### 8. Update the Homebrew formula

Wait for the GitHub Actions **Release** workflow to finish. Then:

1. Go to the new release on GitHub:
   `https://github.com/oakmac/standard-clojure-style-js/releases`
2. Copy the SHA256 checksums from the release notes
3. Edit `Formula/standard-clj.rb` in the [oakmac/homebrew-tap] repo:
   - Update the `version` line
   - Update the version in all 4 `url` lines (macOS arm64/x86_64, Linux arm64/x86_64)
   - Paste the corresponding SHA256 for each platform
4. Commit and push:

```sh
cd ~/path/to/homebrew-tap
# edit Formula/standard-clj.rb
git add Formula/standard-clj.rb
git commit -m "standard-clj v1.2.0"
git push
```

### 9. Test it

```sh
# test npm
npx @chrisoakman/standard-clojure-style --version

# test homebrew
brew update
brew upgrade standard-clj
standard-clj --version
```

Both should show the same version. The `--version` output includes the git
hash in brackets, like `v1.2.0 [a253951]`.

## What lives where

| Repo | Purpose |
|------|---------|
| [standard-clojure-style-js] (this repo) | Source of truth. Library, CLI, tests, CI, and binary release workflow. |
| [oakmac/homebrew-tap] | Homebrew formula. Points to pre-built binaries from this repo's GitHub Releases. Updated manually after each release. |
| [standard-clojure-style-binary] | Old C + Lua approach. Archived / reference only. |

[standard-clojure-style-js]: https://github.com/oakmac/standard-clojure-style-js
[oakmac/homebrew-tap]: https://github.com/oakmac/homebrew-tap
[standard-clojure-style-binary]: https://github.com/oakmac/standard-clojure-style-binary

## How the version string works

There are two version variables in `cli.mjs`:

- `programVersion` — shown in the header when running `check`, `fix`, or `list`
  commands (e.g. `standard-clj check v1.2.0`). Just the tag, no hash.
- `programVersionVerbose` — shown when running `standard-clj --version`
  (e.g. `v1.2.0 [a253951]`). Includes the short git hash for diagnostics.

Both are `'[dev]'` in the source. They get replaced in two different contexts:

- **npm publish:** `scripts/build-release.js` replaces both using the
  package.json version and `git rev-parse --short HEAD`.
- **Binary build:** `.github/workflows/release.yml` replaces both using `sed`
  with the git tag and commit hash.

The replacement lines are identified by UUID comments so the scripts can find
them reliably. Don't remove those UUIDs.

## Troubleshooting

**`build-release.js` says "git working tree is not clean"**
You have uncommitted changes. Commit or stash them first.

**`build-release.js` says "current commit has no version tag"**
You forgot `git tag v1.2.0` before running the script.

**`build-release.js` says "git tag does not match package.json"**
The tag says one version but `package.json` says another. Fix whichever is wrong.

**GitHub Actions Release workflow failed**
Check the Actions tab. Common causes: Bun version issue, or the `sed` version
injection didn't match (check the "Inject version" step output). Fix, re-tag,
re-push.

**Homebrew users get the old version**
Did you push the updated formula to homebrew-tap? Run `brew update` and check.
