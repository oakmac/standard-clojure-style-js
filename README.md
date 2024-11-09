# Standard Clojure Style [![npm](https://img.shields.io/npm/v/@chrisoakman/standard-clojure-style)](https://www.npmjs.com/package/@chrisoakman/standard-clojure-style) [![ISC License](https://img.shields.io/npm/l/@chrisoakman/standard-clojure-style)](https://github.com/oakmac/standard-clojure-style-js/blob/master/LICENSE.md)

A JavaScript library to format Clojure code according to Standard Clojure Style.

## Introduction and Demo

I gave a 10-minute lightning talk at [Clojure/conj 2024] about this project:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=VhjxvEabOX0
" target="_blank"><img src="http://img.youtube.com/vi/VhjxvEabOX0/0.jpg"
alt="Introduction to Standard Clojure Style video preview" width="260" height="195" border="10" /></a>

[Clojure/conj 2024]:https://2024.clojure-conj.org/

## Try it online for free right now!

[Try online using Squint playground.](https://tinyurl.com/43abayj2)

> No purchase necessary. Side effects may include formatted Clojure code, sudden
  urges to REPL, and a strange satisfaction of consistently formatted namespaces.
  Not responsible for increased productivity due to reduced bikeshedding with coworkers.

## I want YOU for testing :cowboy_hat_face:

Calling all adventurous Clojure developers! Please run this library on your codebase and report bugs.

```sh
# go to a Clojure project directory
cd your-clojure-project/

# IMPORTANT: check out a clean git branch so you can revert any changes made by the tool
git checkout -b standard-clj-testing

# run it!
# NOTE: your directory names may be different, please adjust accordingly
npx @chrisoakman/standard-clojure-style check src-clj/ src-cljs/ test/

npx @chrisoakman/standard-clojure-style fix src-clj/ src-cljs/ test/
```

See the **Command Line Usage** section below for more options.

Please [open an issue] when Standard Clojure Style breaks your code :upside_down_face:

[open an issue]:https://github.com/oakmac/standard-clojure-style-js/issues/new

## Project Background and Rationale

Please see [Issue #1] for an explanation of this project's genesis.

[Issue #1]:https://github.com/oakmac/standard-clojure-style-js/issues/1

## Editor Integrations and Other Implementations

It is a goal of Standard Clojure Style to "meet you where you are". ie: in
your editor, on the web, CLI tooling, etc.

- [Standard Clojure Style in Lua]
- Example Emacs usage [in this post](https://x.com/ovstoica/status/1854192289498706012)
- a Python port is planned as of Nov 2024

[Standard Clojure Style in Lua]:https://github.com/oakmac/standard-clojure-style-lua/tree/master

## Project Status and Stability

As of Nov 2024, I think this formatter is ready for **most** Clojure
codebases. There are still [some outstanding bugs] that I want to fix before
releasing v1.0.0, but I do not want this project to live in "pre-1.0"
forever.

[some outstanding bugs]:https://github.com/oakmac/standard-clojure-style-js/labels/v1%20blocker

## Command Line Usage

The `@chrisoakman/standard-clojure-style` npm package exposes a command-line
tool to help format your Clojure projects. You may wish to run this as a git
hook, via continuous integration, an editor integration, etc.

If you have Node.js installed on your system, you can try out Standard Clojure
Style with the `npx` command:

```sh
## NOTE: the "fix" command will change your files on disk!
## Please ensure a clean git working tree or new branch as necessary

# formats the file located at src/com/example/foo.clj
npx @chrisoakman/standard-clojure-style fix src/com/example/foo.clj

# formats all .clj, .cljs, .cljc, .edn files found in the src/ directory
# and subdirectories (ie: recursive)
npx @chrisoakman/standard-clojure-style fix src/
```

If you plan to use the library frequently you may wish to install it globally:

```sh
# Installs "standard-clj" globally onto your system via npm
npm install --global @chrisoakman/standard-clojure-style
```

#### Quick Reference

```sh
# use the "list" command to see which files standard-clj will analyze
standard-clj list src/

# use the "check" command to see which files need formatting
standard-clj check src-clj/ src-cljs/

## use the "fix" command to format files with Standard Clojure Style
standard-clj fix src/ test/ project.clj

## you can pass a glob pattern for more control over which files are formatted
standard-clj fix --include "src/**/*.{clj,cljs,cljc}"

## ignore files or folders with the --ignore flag
standard-clj fix --include "src/**/*.{clj,cljs,cljc}" --ignore "src/com/example/some_weird_file.clj"

## standard-clj will look for a .standard-clj.edn or .standard-clj.json file in the directory where
## the command is run from (likely the root directory for your project)
echo '{:include ["src-clj/**/*.clj" "src-cljs/**/*.cljs"]}' > .standard-clj.edn
standard-clj fix

## or pass a config file explicitly using the --config argument
standard-clj list --config /home/user1/my-project/my-standard-cfg.json

## pipe code directly to the fix command using "-"
echo '(ns my.company.core (:require [clojure.string :as str]))' | standard-clj fix -
```

#### `list` command

Use `standard-clj list` to see which files will be effected by the `check` and
`fix` commands. This command is useful in order to test your `--include`
glob patterns or `.standard-clj.edn` config files.

```sh
# prints each filename that will be effected by the "check" and "fix" commands
standard-clj list src/

# output the same file list in various data formats
standard-clj list src/ --output json
standard-clj list src/ --output json-pretty
standard-clj list src/ --output edn
standard-clj list src/ --output edn-pretty
```

#### `check` command

Use `standard-clj check` to see if files are already formatted with Standard
Clojure Style. Useful for continuous integration. This command will **not** write
to any files on disk.

Returns exit code 0 if all files are already formatted, 1 otherwise.

```sh
# check to see if files are already formatted with Standard Clojure Style
standard-clj check src-clj/ src-cljs/ test/
```

#### `fix` command

Use `standard-clj fix` to format files according to Standard Clojure Style.
This command **will** write to files on disk, so please ensure a clean git
working tree or new branch as necessary. The changes made by this command
cannot be undone by this program.

Returns exit code 0 if all files have been formatted, 1 otherwise.

```sh
# format files according to Standard Clojure Style
standard-clj fix src/ test/ deps.edn
```

#### `fix -` command (stdin / stdout)

Use `standard-clj fix -` to pipe code directly via stdin.

Prints the formatted code to stdout with error code 0 if successful. Prints an
error message to stderr with error code 1 otherwise.

```sh
echo '(ns my.company.core (:require [clojure.string :as str]))' | standard-clj fix -
```

#### Which files will be formatted?

`standard-clj` accepts several ways to know which files to format:

* pass filenames directly as arguments
* pass directories directly as arguments
* pass a [glob pattern] with the `--include` option

```sh
# will fix:
# - dev/user.clj (single file argument)
# - project.clj (single file argument)
# - all .clj, .cljs, .cljc, .edn files in the src-clj/ directory and subdirectories (directory argument)
# - all .edn files in the resources/ directory and subdirectories (glob pattern argument)
standard-clj fix dev/user.clj project.clj src-clj/ test/ --include "resources/**/*.edn"
```

`--include` or `--ignore` arguments passed via command line will supercede any
`--include` or `--ignore` arguments found via config file.

You can always use the `list` command to see which files will be formatted by `standard-clj`.

#### Other options

- `--config` or `-c` - pass a filepath of a config file to use for options to the `standard-clj` program.
- `--ignore` or `-ig` - exclude files from `list`, `check`, or `fix` commands. Accepts individual files or directories.
- `--include` or `-in` - include files for the `list`, `check`, or `fix` commands. Accepts a [glob pattern].
- `--log-level` or `-l` - specify a logging level
  - `"everything"` or `0` - prints everything to either stdout or stderr. This is the default.
  - `"ignore-already-formatted"` or `1`
    - For the `check` command, will only print files that need formatting.
    - For the `fix` command, will only print files that were formatted or have errors.
    - This option can be less noisy in your terminal if you have a project with many files and only
      want to see the ones that need formatting.
  - `"quiet"` or `5` - will not print anything to stdout or stderr for the `check` or `fix` commands

[glob pattern]:https://github.com/isaacs/node-glob?tab=readme-ov-file#glob-primer

#### Options via config file

By default, `standard-clj` will look for a `.standard-clj.edn` or
`.standard-clj.json` file located in the directory where the command is run.
Most projects that use `standard-clj` regularly will want to commit this file
to their git repo for convenience.

```sh
# create a .standard-clj.edn file
echo '{:include ["src-clj/**/*.clj" "src-cljs/**/*.cljs"]}' > .standard-clj.edn

# run the "fix" command with options from that file
standard-clj fix
```

You can use the `--config` or `-c` flag to specify a different file location:

```sh
# run the "fix" command with options from ./my-config-file.edn
standard-clj fix --config ./my-config-file.edn
```

## Ignore a file or form

You can instruct Standard Clojure Style to ignore the next form by using `#_:standard-clj/ignore`

```clj
#_:standard-clj/ignore
    [:the
:formatter
  :will    :ignore

 :me

]
```

Or ignore an entire file by placing `#_:standard-clj/ignore-file` before the `(ns)` form.

```clj
#_:standard-clj/ignore-file

(ns com.example.some-weird-file)

;; ...
```

Please note that `#_:standard-clj/ignore` will not work **inside** of the `ns` form, but it can be used
to tell Standard Clojure Style to "ignore the ns form entirely":

```clj
;; this will NOT work

(ns com.example.my-app
  (:require
    #_:standard-clj/ignore
          [clojure.string         :as   string]))
```

```clj
;; this WILL work

#_:standard-clj/ignore
(ns com.example.my-app
  (:require
          [clojure.string         :as   string]))
```

It is recommended to use `#_:standard-clj/ignore` sparingly, and ideally not
at all. However, there are always edge case exceptions where it makes sense
to ignore formatting.

I recommend ignoring whole forms at the top-level (ie: forms that start on
column 0, like `defn` or `ns`), instead of "some formatted outside, some ignored inside".

```clj
;; recommended, sparingly:

#_:standard-clj/ignore
(defn some-weird-fn []
  ...)
```

```clj
;; not recommended:

(defn some-weird-fn []
  (let [a "a"
        b "b"]
    #_:standard-clj/ignore ...))
```

## Creating a binary

[Bun] has a neat feature where you can [create an executable binary] from JavaScript source:

```sh
## create a binary for Standard Clojure Style
bun build ./cli.mjs --compile --outfile standard-clj

## run your binary
./standard-clj check /home/user1/my-project/src

## move the binary to somewhere on your path
mv standard-clj /usr/local/bin
```

[Bun]:https://bun.sh/
[create an executable binary]:https://bun.sh/docs/bundler/executables

## Formatting Rules

> NOTE: this is an incomplete list. I am working on a website that will document all of the formatting rules. 20 Sep 2024

- trim trailing whitespace (ie: `rtrim` every line)
- convert all `"\r\n"` to `"\n"`
- convert all tab characters to spaces (except tab characters inside of Strings)
- ensure a single newline character (`\n`) at the end of the file
- [cljfmt option] `:remove-surrounding-whitespace?` = true
- [cljfmt option] `:remove-trailing-whitespace?` = true
- [cljfmt option] `:insert-missing-whitespace?` = true
- [cljfmt option] `:remove-consecutive-blank-lines?` = true
- format and sort `ns` forms according to Stuart Sierra's [how to ns]
- indentation follows the guide from Niki Tonsky's [Better clojure formatting]
  - with the addition of [Rule 3](https://github.com/clj-commons/formatter/issues/9#issuecomment-446167649) as proposed by Shaun Lebron
- Use `#_ :standard-clj/ignore` or `#_ :standard-clj/ignore-file` to disable the formatter for certain special cases

[how to ns]:https://stuartsierra.com/2016/clojure-how-to-ns.html
[cljfmt option]:https://github.com/weavejester/cljfmt#formatting-options
[Better clojure formatting]:https://tonsky.me/blog/clojurefmt/

## Things that Standard Clojure Style does NOT do

- no config options
  - all projects using Standard Clojure Style follow the same rules
- From cljfmt:
  > "It is not the goal of the project to provide a one-to-one mapping between a Clojure syntax tree and formatted text; rather the intent is to correct formatting errors with minimal changes to the existing structure of the text.
  > If you want format completely unstructured Clojure code, the [zprint project](https://github.com/kkinnear/zprint) may be more suitable.
- no enforced max line length
  - text editors have the ability to wrap lines if you desire
- vertical alignment of `let` forms and map literals are allowed
  - the choice is up to the author
  - [cljfmt option] `:remove-multiple-non-indenting-spaces?` = false
  - I have seen too many code examples where vertical alignment adds clarity
- no configuration or special rules for indentation
  - the rules from [Better clojure formatting] are simple, easy to learn, and produce consistent-looking code
  - 100% compatible with [Parinfer] users
  - avoids the complexity of the [cljfmt `:indents` option]
  - avoids the complexity of different rules for different forms (ie: no [semantic indentation])

[Parinfer]:https://shaunlebron.github.io/parinfer/
[cljfmt `:indents` option]:https://github.com/weavejester/cljfmt/blob/master/docs/INDENTS.md
[semantic indentation]:https://guide.clojure.style/#body-indentation

## References

- https://clojureverse.org/t/clj-commons-building-a-formatter-like-gofmt-for-clojure/3240/95
- https://github.com/clj-commons/formatter/issues/9
- https://tonsky.me/blog/clojurefmt/
- https://github.com/parinfer/parindent
- [emoji length article](https://hsivonen.fi/string-length/)
- https://github.com/weavejester/cljfmt/issues/36
- https://github.com/weavejester/cljfmt/pull/251
- https://github.com/weavejester/cljfmt/commit/23daaf0020526aaaaab1cd6363288e79091a97ba

## Coding Style

The coding style for this library is intentionally very simple in order to make
porting the algorithm to multiple languages easier. This is informed by my
experience porting [parinfer.js] to multiple languages ([parinfer-lua], [parinfer.py],
and others).

Here are some rules to follow:

* each line should be one simple statement
* do not use ternary operators
* do not use variadic functions
* no `for` loops, only use `while`
* do not use `++` or `--` operators (wrap with function calls)
* wrap all String and Array methods with function calls
* do not early return from functions

Note: this should not be considered a definitive list. I will add to this as I come across additional cases.

[parinfer.js]:https://github.com/parinfer/parinfer.js
[parinfer.py]:https://github.com/oakmac/parinfer.py
[parinfer-lua]:https://github.com/oakmac/parinfer-lua

## Development

Make sure that either [Node.js] or [bun] are installed (both should work).

```sh
## run unit tests
bun test

## test a single file
bun run jest format.test.js

## lint JS
bun run lint
```

[Node.js]:https://nodejs.org/
[bun]:https://bun.sh/

## Notes / Misc

* ns order is:
  1. `:refer-clojure`
  1. `:require-macros`
  1. `:require`
  1. `:import`
* Note that [how to ns] does not include guidance for `:require-macros`
  * ClojureScript source ([1](https://github.com/clojure/clojurescript/blob/a53e163d9c495904389bd111665e93c4ff0c398e/src/main/cljs/cljs/pprint.cljs#L11), [2](https://github.com/clojure/clojurescript/blob/a53e163d9c495904389bd111665e93c4ff0c398e/src/main/cljs/cljs/repl.cljs#L10), [3](https://github.com/clojure/clojurescript/blob/a53e163d9c495904389bd111665e93c4ff0c398e/src/main/clojure/cljs/compiler.cljc#L12)) consistently places `:require-macros` above `:require`, so let's go with that
* reader conditionals are placed at the bottom of the relevant ns section
  * sorted alphabetically except for `:default` (if it exists), which is last

[how to ns]:https://stuartsierra.com/2016/clojure-how-to-ns.html

## License

[ISC License](LICENSE.md)
