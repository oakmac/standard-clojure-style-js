# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2024-10-12

### Fixed
- [Issue #111] - print comments above `:require-macros` ([PR-115])
- [Issue #108] - fix anonymous function indentation ([PR-116])
- [Issue #112] - support `:rename` in `:require` forms ([PR-117])
- [Issue #110] - fix bug with tagged literal indentation ([PR-118])
- [Issue #114] - fix bug with `:refer-clojure` and reader conditionals ([PR-119])

### Changed
- [Issue #104] - trim eol commas as whitespace ([PR-107])

## [0.5.0] - 2024-09-28

### Fixed
- [Issue #97] - fix parser bug with `\ ` characters ([PR-98])
- [Issue #99] - fix bug with parens inside of String literals ([PR-100])

## [0.4.1] - 2024-09-21

### Fixed
- [Issue #93] - broader platform support for `objectForEach` function ([PR-95])
- [Issue #94] - bring back shebang line ([PR-96])

## [0.4.0] - 2024-09-21

### Added
- [Issue #86] - allow passing code via stdin with `standard-clj fix -` ([PR-91])

### Changed
- [Issue #62] - do not add a space after a paren opener for `;` comments ([PR-90])

### Fixed
- [Issue #60] - respect commas to hold closing paren trails ([PR-89])
- [Issue #71] - support --version, -v, -h flags on CLI ([PR-92])

## [0.3.0] - 2024-09-06

### Added
- [Issue #62] - add spaces around comments if necessary ([PR-85])

### Fixed
- [Issue #69] - support :require :as-alias ([PR-83])
- [Issue #48] - support :refer-clojure :rename with multiple reader conditionals ([PR-84])

## [0.2.0] - 2024-09-05

### Fixed
- [Issue #68] - support tag literals ([PR-72])
- [Issue #76] - bug with :require-macros wrapped in reader conditional ([PR-79])
- [Issue #74] - support :refer :exclude ([PR-80])
- [Issue #75] - fix bug with paren wrapping inside ns forms ([PR-82])

## [0.1.2] - 2024-09-04

### Fixed
- [Issue #67] - print the correct version number on the CLI tooling

## [0.1.1] - 2024-09-03

### Fixed
- fix CLI tooling to load from the `dist/` folder for published versions

## [0.1.0] - 2024-09-03

### Added
- initial alpha release

[Unreleased]:https://github.com/oakmac/standard-clojure-style-js/compare/v0.6.0...HEAD
[0.6.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.6.0
[0.5.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.5.0
[0.4.1]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.4.1
[0.4.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.4.0
[0.3.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.3.0
[0.2.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.2.0
[0.1.2]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.2
[0.1.1]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.1
[0.1.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.0

[Issue #48]:https://github.com/oakmac/standard-clojure-style-js/issues/48
[Issue #62]:https://github.com/oakmac/standard-clojure-style-js/issues/62
[Issue #67]:https://github.com/oakmac/standard-clojure-style-js/issues/67
[Issue #68]:https://github.com/oakmac/standard-clojure-style-js/issues/68
[Issue #69]:https://github.com/oakmac/standard-clojure-style-js/issues/69
[Issue #71]:https://github.com/oakmac/standard-clojure-style-js/issues/71
[Issue #74]:https://github.com/oakmac/standard-clojure-style-js/issues/74
[Issue #75]:https://github.com/oakmac/standard-clojure-style-js/issues/75
[Issue #76]:https://github.com/oakmac/standard-clojure-style-js/issues/76
[Issue #86]:https://github.com/oakmac/standard-clojure-style-js/issues/86
[Issue #93]:https://github.com/oakmac/standard-clojure-style-js/issues/93
[Issue #94]:https://github.com/oakmac/standard-clojure-style-js/issues/94
[Issue #97]:https://github.com/oakmac/standard-clojure-style-js/issues/97
[Issue #99]:https://github.com/oakmac/standard-clojure-style-js/issues/99
[Issue #104]:https://github.com/oakmac/standard-clojure-style-js/issues/104
[Issue #108]:https://github.com/oakmac/standard-clojure-style-js/issues/108
[Issue #110]:https://github.com/oakmac/standard-clojure-style-js/issues/110
[Issue #111]:https://github.com/oakmac/standard-clojure-style-js/issues/111
[Issue #112]:https://github.com/oakmac/standard-clojure-style-js/issues/112
[Issue #114]:https://github.com/oakmac/standard-clojure-style-js/issues/114

[PR-72]:https://github.com/oakmac/standard-clojure-style-js/pull/72
[PR-79]:https://github.com/oakmac/standard-clojure-style-js/pull/79
[PR-80]:https://github.com/oakmac/standard-clojure-style-js/pull/80
[PR-82]:https://github.com/oakmac/standard-clojure-style-js/pull/82
[PR-83]:https://github.com/oakmac/standard-clojure-style-js/pull/83
[PR-84]:https://github.com/oakmac/standard-clojure-style-js/pull/84
[PR-85]:https://github.com/oakmac/standard-clojure-style-js/pull/85
[PR-89]:https://github.com/oakmac/standard-clojure-style-js/pull/89
[PR-90]:https://github.com/oakmac/standard-clojure-style-js/pull/90
[PR-91]:https://github.com/oakmac/standard-clojure-style-js/pull/91
[PR-92]:https://github.com/oakmac/standard-clojure-style-js/pull/92
[PR-95]:https://github.com/oakmac/standard-clojure-style-js/pull/95
[PR-96]:https://github.com/oakmac/standard-clojure-style-js/pull/96
[PR-98]:https://github.com/oakmac/standard-clojure-style-js/pull/98
[PR-100]:https://github.com/oakmac/standard-clojure-style-js/pull/100
[PR-107]:https://github.com/oakmac/standard-clojure-style-js/pull/107
[PR-115]:https://github.com/oakmac/standard-clojure-style-js/pull/115
[PR-116]:https://github.com/oakmac/standard-clojure-style-js/pull/116
[PR-117]:https://github.com/oakmac/standard-clojure-style-js/pull/117
[PR-118]:https://github.com/oakmac/standard-clojure-style-js/pull/118
[PR-119]:https://github.com/oakmac/standard-clojure-style-js/pull/119
