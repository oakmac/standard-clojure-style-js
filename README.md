# Standard Clojure Style [![npm](https://img.shields.io/npm/v/@chrisoakman/standard-clojure-style)](https://www.npmjs.com/package/@chrisoakman/standard-clojure-style) [![ISC License](https://img.shields.io/npm/l/@chrisoakman/standard-clojure-style)](https://github.com/oakmac/standard-clojure-style-js/blob/master/LICENSE.md)

A JavaScript library to format Clojure code according to Standard Clojure Style.

## Introduction and Demo

I gave a 10-minute lightning talk at [Clojure/conj 2024] about this project:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=VhjxvEabOX0
" target="_blank"><img src="http://img.youtube.com/vi/VhjxvEabOX0/0.jpg"
alt="Introduction to Standard Clojure Style video preview" width="260" height="195" border="10" /></a>

[Clojure/conj 2024]: https://2024.clojure-conj.org/

## Install via Homebrew

```sh
brew tap oakmac/tap
brew install standard-clj
```

This installs a self-contained binary. No Node.js or Bun install required.

## Project Background and Rationale

Please see [Issue #1] for an explanation of this project's genesis.

Standard Clojure Style aspires to be the obvious, [boring choice] for formatting Clojure source code.

* No config options
  * All projects using Standard Clojure Style follow the same rules and should have a similar look and feel
* Produces idiomatic-looking Clojure code while not impairing the unique expressiveness of Lisp syntax
  * Follows the rules from Niki Tonsky's [Better clojure formatting]
  * With the addition of ["Rule 3"] to allow vertical alignment of forms
* All `ns` forms are pretty-printed from scratch and have a consistent format
* Easy to use and integrate with existing tooling
  * continuous integration systems, text editors, web browsers, etc
* Single-file implementation in under 5,000 lines of code
  * requires no external libraries
  * works everywhere (node.js, web browsers, etc)
* Fast!
  * can format [~100,000 lines of code in under 2 seconds](https://youtu.be/VhjxvEabOX0?t=60)

[Issue #1]: https://github.com/oakmac/standard-clojure-style-js/issues/1
[boring choice]: https://boringtechnology.club/
["Rule 3"]: https://github.com/clj-commons/formatter/issues/9#issuecomment-446167649

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

Please [open an issue] if Standard Clojure Style breaks your code :upside_down_face:

[open an issue]:https://github.com/oakmac/standard-clojure-style-js/issues/new

## Editor Integrations and Other Implementations

It is a goal of Standard Clojure Style to "meet you where you are". ie: in
your editor, on the web, CLI tooling, etc.

### Editor Integrations

- Example Emacs usage [in this post](https://x.com/ovstoica/status/1854192289498706012)
- [Neovim plugin](https://git.sr.ht/~ioiojo/standard-clojure-style.nvim)
- [Cursive for JetBrains IntelliJ IDEA](https://cursive-ide.com/)

### Implementations in Other Programming Languages

- [Standard Clojure Style in Lua]
- a port in pure Java is almost ready as of Feb 2025
- a Python port is planned as of Nov 2024

[Standard Clojure Style in Lua]:https://github.com/oakmac/standard-clojure-style-lua/tree/master

## Project Status and Stability

As of April 2025, this formatter is ready for **most** Clojure codebases. There
are still [some outstanding bugs] that I want to fix before releasing v1.0.0,
but I do not want this project to live in "pre-1.0" forever.

[some outstanding bugs]:https://github.com/oakmac/standard-clojure-style-js/labels/v1%20blocker

## Command Line Usage

Use `list` to preview files, `check` to verify formatting, and `fix` to format
files in place. `check` does not modify files; `fix` does.

```sh
standard-clj list src/ test/
standard-clj check src/ test/

# NOTE: "fix" writes to your files on disk and cannot undo its changes.
# Please ensure a clean git working tree or new branch as necessary.
standard-clj fix src/ test/
```

Directories are searched recursively. By default, Standard Clojure Style finds
`.clj`, `.cljs`, `.cljc`, `.jank`, and `.edn` files. You can also pass individual
files:

```sh
standard-clj fix src/my_app/core.clj deps.edn
```

For more control, use `--include` and `--ignore`:

```sh
standard-clj check \
  --include "src/**/*.{clj,cljs,cljc}" \
  --ignore "src/generated/**/*"
```

Most projects that use Standard Clojure Style regularly should commit a
`.standard-clj.edn` file:

```clojure
{:include ["src/" "test/"]
 :ignore ["src/generated/"]}
```

Then run:

```sh
standard-clj check
```

Use `standard-clj list` whenever you want to confirm which files were selected.

Run the package without installation:

```sh
npx @chrisoakman/standard-clojure-style check src/ test/
```

Or install the CLI globally:

```sh
npm install --global @chrisoakman/standard-clojure-style
```

The `fix` command also supports stdin:

```sh
echo '(ns my.company.core)' | standard-clj fix -
```

See the [CLI docs] for config-file formats, glob syntax, option precedence,
custom file extensions, and additional examples.

[CLI docs]:https://github.com/oakmac/standard-clojure-style-js/blob/master/docs/cli.md

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
