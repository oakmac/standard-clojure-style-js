# Standard Clojure Style in JavaScript

A library to format Clojure code according to Standard Clojure Style.

## Project Status (August 2024)

This project is under active development and I do not recommend using it for
your codebase at this time unless you are very adventurous. I will publish a
release to npm when the project is stable enough for Alpha usage.

## Project Background and Rationale

Please see [Issue #1] for an explanation of this project's genesis.

[Issue #1]:https://github.com/oakmac/standard-clojure-style-js/issues/1

## Command Line Usage

This npm package exposes a command-line tool to help format your Clojure
projects. You may wish to run this as a git hook, via continuous integration,
an editor integration, etc.

If you have Node.js installed on your system, you can try out Standard Clojure
Style with the `npx` command:

```sh
## formats the file located at src/com/example/foo.clj
npx @chrisoakman/standard-clojure-style format src/com/example/foo.clj

## formats all .clj, .cljs, .cljc, .edn files found in the src/ directory
## and subdirectories (ie: recursive)
npx @chrisoakman/standard-clojure-style format src/
```

If you plan to use the library more frequently you may wish to install it globally:

```sh
## Installs "standard-clj" globally onto your system via npm
npm install --global @chrisoakman/standard-clojure-style

## use the "list" command to see which files standard-clj will format
standard-clj list src/

standard-clj list src/ --output json
standard-clj list src/ --output json-pretty
standard-clj list src/ --output edn
standard-clj list src/ --output edn-pretty

## use the "format" command to format files on disk
## NOTE: this will change your files! so please ensure a clean git working tree or branch as needed
standard-clj format src/

## you can pass a glob pattern for more control over which files are formatted
standard-clj format --include "src/**/*.clj"

## standard-clj will look for a .standard-clojure-style.json or .standard-clojure-style.edn file
## in the project root
standard-clj format



## format files using

## TODO:
## --include ""
## -i ""

## --exclude ""
## -e ""

## --file-ext="clj,cljs,cljc,edn"

## TODO: document --output
## --output json, json-pretty, edn, edn-pretty

## create a "check" command that just checks file syntax, does no formatting
## useful for a fast CI check
```

#### cli todo

- [ ] passing a glob argument
- [ ] creating a `.standard-clojure-style.edn` file in the project root

## Formatting Rules

- trim trailing whitespace (ie: `rtrim` every line)
- ensure a single newline character (`\n`) at the end of the file
- convert all tab characters to spaces (except tab characters inside of Strings)
- [cljfmt option] `:remove-surrounding-whitespace?` = true
- [cljfmt option] `:remove-trailing-whitespace?` = true
- [cljfmt option] `:insert-missing-whitespace?` = true
- [cljfmt option] `:remove-consecutive-blank-lines?` = true
- format and sort `ns` forms according to Stuart Sierra's [how to ns]
- indentation follows the guide from Niki Tonsky's [Better clojure formatting]
- comments that contain the String `standard-clojure-style:ignore` cause the next form to be ignored by the formatter

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

## TODO

- [ ] need to add additional cases for namespace maps (what is allowed?)
- [ ] PR upstream to Clojure-Sublimed the option map for Repeat (can remove Repeat1)
- [ ] chat with Nikita about what he wants to do about emoji length inside of Strings
- [ ] add a test case for every rule

## License

[ISC License](LICENSE.md)
