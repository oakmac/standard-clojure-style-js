# CLI File Selection and Configuration

Most projects only need this:

```sh
standard-clj check src/ test/
standard-clj fix src/ test/
```

Directories are searched recursively for `.clj`, `.cljs`, `.cljc`, `.jank`,
and `.edn` files.

Use `standard-clj list` to preview the exact files selected by any command:

```sh
standard-clj list src/ test/
```

## Commands

### `list`

Print the files that `check` or `fix` would process:

```sh
standard-clj list src/
```

Machine-readable output is also available:

```sh
standard-clj list src/ --output json
standard-clj list src/ --output json-pretty
standard-clj list src/ --output edn
standard-clj list src/ --output edn-pretty
```

### `check`

Check formatting without changing files:

```sh
standard-clj check src/ test/
```

Exit code `0` means every selected file is formatted. Exit code `1` means at
least one file needs formatting or produced an error.

### `fix`

Format selected files in place:

```sh
standard-clj fix src/ test/
```

Use a clean git working tree before running `fix`.

Code can also be read from stdin:

```sh
echo '(ns my.company.core)' | standard-clj fix -
```

## Selecting Files

Files can be selected in three ways.

### Individual files

```sh
standard-clj check src/my_app/core.clj deps.edn
```

A file passed directly is explicit and is accepted regardless of its extension.

### Directories

```sh
standard-clj check src/ test/
```

Directories are searched recursively. Only files with the configured extensions
are selected.

### `--include`

`--include` accepts a file, directory, or glob pattern:

```sh
standard-clj check --include src/
standard-clj check --include "src/**/*.clj"
standard-clj check --include "src/**/*.{clj,cljs,cljc}"
```

The option can be repeated:

```sh
standard-clj check \
  --include src-clj/ \
  --include src-cljs/ \
  --include test/
```

Direct arguments and command-line `--include` values are combined and
deduplicated.

Files selected through `--include` must have one of the configured extensions.
This differs slightly from passing an individual file directly.

## Ignoring Files

`--ignore` accepts a file, directory, or glob pattern:

```sh
standard-clj check src/ \
  --ignore src/generated/ \
  --ignore "src/**/fixtures/**/*"
```

The option can be repeated. Ignored files are removed after all file-selection
inputs have been combined.

A directory passed literally to `--ignore` removes every selected file beneath
that directory.

## Supported Glob Syntax

Standard Clojure Style officially supports these pattern features:

- `*` matches within one path segment.
- `**` recursively matches directories.
- `{a,b,c}` matches one of several alternatives.

Examples:

```text
src/*.clj
src/**/*.clj
src/**/*.{clj,cljs,cljc}
{src,test}/**/*.{clj,cljs,cljc}
```

Quote glob patterns in your shell:

```sh
standard-clj check --include "src/**/*.{clj,cljs,cljc}"
```

Other syntax may happen to work through the underlying glob library, but it is
not part of Standard Clojure Style's documented compatibility contract. Prefer
relative glob patterns. Absolute literal files and directories are supported.

A literal directory is recursive:

```sh
standard-clj check --include src/
```

A wildcard pattern that happens to match a directory does not automatically
turn that directory into a recursive search. Use a literal directory or `**`
when recursion is intended.

## File Extensions

The default extensions are:

```text
.clj
.cljs
.cljc
.jank
.edn
```

Override them with `--file-ext`:

```sh
standard-clj check src/ --file-ext clj,cljc
```

The extension filter applies to files discovered through directories,
`--include`, and glob patterns.

A file passed directly as a positional argument is accepted regardless of its
extension.

## Project Configuration

By default, Standard Clojure Style looks in the current working directory for
one of these files:

```text
.standard-clj.edn
.standard-clj.json
```

Use one config file per project.

EDN example:

```clojure
{:include ["src/" "test/"]
 :ignore ["src/generated/"]}
```

JSON example:

```json
{
  "include": ["src/", "test/"],
  "ignore": ["src/generated/"]
}
```

The `include` and `ignore` values may be a single string or an array of strings.
Arrays are recommended because they are easy to extend.

Run the CLI without file arguments to use the configured selection:

```sh
standard-clj list
standard-clj check
standard-clj fix
```

Use a different config file with `--config` or `-c`:

```sh
standard-clj check --config ./config/standard-clj.edn
```

Relative files, directories, and patterns are resolved from the directory where
the command is run, not from the config file's directory.

Supported config keys are `include`, `ignore`, and `log-level`. The
`--file-ext` option is command-line only.

## Command-Line and Config Precedence

Command-line file selection replaces configured `include` values.

This means either of these causes config-file `include` values to be ignored:

```sh
standard-clj check src/
standard-clj check --include src/
```

Direct arguments and command-line `--include` values can still be used together:

```sh
standard-clj check dev/user.clj --include src/
```

A command-line `--ignore` replaces configured `ignore` values.

When file selection is supplied on the command line but `--ignore` is not, the
configured `ignore` values still apply.

Example config:

```clojure
{:include ["test/"]
 :ignore ["src/generated/"]}
```

This command replaces the configured `include`, selects `src/`, and still
excludes `src/generated/`:

```sh
standard-clj check src/
```

This command replaces both configured values:

```sh
standard-clj check src/ --ignore src/fixtures/
```

## Common Project Layouts

### Standard Clojure project

```clojure
{:include ["src/" "test/"]}
```

### Separate Clojure and ClojureScript directories

```clojure
{:include ["src-clj/" "src-cljs/" "test/"]}
```

### Ignore generated source

```clojure
{:include ["src/" "test/"]
 :ignore ["src/generated/"]}
```

### Select only common Clojure source extensions

```clojure
{:include ["src/**/*.{clj,cljs,cljc}"
           "test/**/*.{clj,cljs,cljc}"]}
```

### Include EDN resources

```clojure
{:include ["src/" "test/" "resources/**/*.edn"]}
```

## Missing Paths and Empty Matches

A missing direct file or directory prints a warning and does not stop other
valid inputs from being processed.

A missing literal `--ignore` path also prints a warning.

A glob pattern that matches nothing is valid and produces no files. This is
useful for configuration shared across projects where some directories may not
exist.

If no files are selected at all, `check` and `fix` exit with code 1.

## Other Options

### Logging

```sh
standard-clj check src/ --log-level everything
standard-clj check src/ --log-level ignore-already-formatted
standard-clj check src/ --log-level quiet
```

### Option aliases

```text
--config    -c
--include   -in
--ignore    -ig
--log-level -l
```

Run `standard-clj --help` for the complete command-line help.
