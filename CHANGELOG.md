# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.21.0] - 2025-02-26

### Fixed
- [Issue #181] - fix bug with quoted values in `ns` metadata ([PR-182])

## [0.20.0] - 2025-02-01

### Fixed
- [Issue #178] - fix bug with `ns` symbols that are not the main `ns` form ([PR-179])

## [0.19.0] - 2025-01-29

### Added
- [Issue #158] - add `.jank` to the list of default file extensions ([PR-177])

### Fixed
- [Issue #152] - error when encountering `:use` in the `ns` form instead of silently failing ([PR-171])

## [0.18.0] - 2024-12-02

### Fixed
- [Issue #165] - fix bug with tag literal alignment ([PR-168])

## [0.17.0] - 2024-12-02

### Fixed
- [Issue #162] - fix bugs related to commas at the end of lines ([PR-164])
- [Issue #166] - fix bug with `:refer :all :rename` ([PR-167])

## [0.16.0] - 2024-11-27

### Fixed
- [Issue #161] - correctly align namespaced map literals ([PR-163])

## [0.15.0] - 2024-11-18

### Added
- [Issue #158] - add support for `:require` `:default` ([PR-160])

## [0.14.0] - 2024-11-09

### Fixed
- [Issue #153] - fix CLI bug with traversing directories on Windows ([commit #db857ff4])

## [0.13.0] - 2024-11-08

### Added
- [Issue #140] - better support for comments around the `:refer-clojure` ns form ([PR-141])

### Changed
- [Issue #145] - tweak CLI verbiage when only one file is checked or formatted ([PR-148])
- refactorings and added unit tests for internals

### Fixed
- [Issue #142] - fix ns parsing bug with paren nesting levels ([PR-147])

## [0.12.0] - 2024-10-22

### Fixed
- [Issue #137] - only process the first `ns` form ([PR-138])

## [0.11.0] - 2024-10-21

### Fixed
- [Issue #135] - fix bug with `:import` and multiple reader conditionals ([PR-134])

## [0.10.0] - 2024-10-19

### Added
- [Issue #53] - improve CLI help output ([PR-131])

### Changed
- [Issue #87] - adjust `ns` indentation to match common community style ([PR-130])

### Fixed
- [Issue #103] - convert CRLF to LF line endings ([PR-133])

## [0.9.0] - 2024-10-18

### Changed
- [Issue #52] - `--include` and `--ignore` arguments pass via command line supercede config file ([PR-128])

### Fixed
- [Issue #123] - do not remove eol commas inside comments ([PR-124])
- [Issue #126] - fix bug with parsing ns metadata ([PR-127])

## [0.8.0] - 2024-10-16

### Added
- [Issue #6] - add ability to ignore a form using `:standard-clj/ignore` ([PR-120])
- [Issue #6] - add ability to ignore a file using `:standard-clj/ignore-file` ([PR-122])

## [0.7.0] - 2024-10-14

### Fixed
- [Issue #55] and [Issue #113] - support metadata in ns ([PR-110])

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

[Unreleased]:https://github.com/oakmac/standard-clojure-style-js/compare/v0.21.0...HEAD
[0.21.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.21.0
[0.20.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.20.0
[0.19.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.19.0
[0.18.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.18.0
[0.17.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.17.0
[0.16.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.16.0
[0.15.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.15.0
[0.14.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.14.0
[0.13.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.13.0
[0.12.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.12.0
[0.11.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.11.0
[0.10.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.10.0
[0.9.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.9.0
[0.8.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.8.0
[0.7.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.7.0
[0.6.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.6.0
[0.5.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.5.0
[0.4.1]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.4.1
[0.4.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.4.0
[0.3.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.3.0
[0.2.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.2.0
[0.1.2]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.2
[0.1.1]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.1
[0.1.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.0

[Issue #6]:https://github.com/oakmac/standard-clojure-style-js/issues/6
[Issue #48]:https://github.com/oakmac/standard-clojure-style-js/issues/48
[Issue #52]:https://github.com/oakmac/standard-clojure-style-js/issues/52
[Issue #53]:https://github.com/oakmac/standard-clojure-style-js/issues/53
[Issue #55]:https://github.com/oakmac/standard-clojure-style-js/issues/55
[Issue #62]:https://github.com/oakmac/standard-clojure-style-js/issues/62
[Issue #67]:https://github.com/oakmac/standard-clojure-style-js/issues/67
[Issue #68]:https://github.com/oakmac/standard-clojure-style-js/issues/68
[Issue #69]:https://github.com/oakmac/standard-clojure-style-js/issues/69
[Issue #71]:https://github.com/oakmac/standard-clojure-style-js/issues/71
[Issue #74]:https://github.com/oakmac/standard-clojure-style-js/issues/74
[Issue #75]:https://github.com/oakmac/standard-clojure-style-js/issues/75
[Issue #76]:https://github.com/oakmac/standard-clojure-style-js/issues/76
[Issue #86]:https://github.com/oakmac/standard-clojure-style-js/issues/86
[Issue #87]:https://github.com/oakmac/standard-clojure-style-js/issues/87
[Issue #93]:https://github.com/oakmac/standard-clojure-style-js/issues/93
[Issue #94]:https://github.com/oakmac/standard-clojure-style-js/issues/94
[Issue #97]:https://github.com/oakmac/standard-clojure-style-js/issues/97
[Issue #99]:https://github.com/oakmac/standard-clojure-style-js/issues/99
[Issue #103]:https://github.com/oakmac/standard-clojure-style-js/issues/103
[Issue #104]:https://github.com/oakmac/standard-clojure-style-js/issues/104
[Issue #108]:https://github.com/oakmac/standard-clojure-style-js/issues/108
[Issue #110]:https://github.com/oakmac/standard-clojure-style-js/issues/110
[Issue #111]:https://github.com/oakmac/standard-clojure-style-js/issues/111
[Issue #112]:https://github.com/oakmac/standard-clojure-style-js/issues/112
[Issue #113]:https://github.com/oakmac/standard-clojure-style-js/issues/113
[Issue #114]:https://github.com/oakmac/standard-clojure-style-js/issues/114
[Issue #123]:https://github.com/oakmac/standard-clojure-style-js/issues/123
[Issue #126]:https://github.com/oakmac/standard-clojure-style-js/issues/126
[Issue #135]:https://github.com/oakmac/standard-clojure-style-js/issues/135
[Issue #137]:https://github.com/oakmac/standard-clojure-style-js/issues/137
[Issue #140]:https://github.com/oakmac/standard-clojure-style-js/issues/140
[Issue #142]:https://github.com/oakmac/standard-clojure-style-js/issues/142
[Issue #145]:https://github.com/oakmac/standard-clojure-style-js/issues/145
[Issue #152]:https://github.com/oakmac/standard-clojure-style-js/issues/152
[Issue #153]:https://github.com/oakmac/standard-clojure-style-js/issues/153
[Issue #158]:https://github.com/oakmac/standard-clojure-style-js/issues/158
[Issue #161]:https://github.com/oakmac/standard-clojure-style-js/issues/161
[Issue #162]:https://github.com/oakmac/standard-clojure-style-js/issues/162
[Issue #165]:https://github.com/oakmac/standard-clojure-style-js/issues/165
[Issue #166]:https://github.com/oakmac/standard-clojure-style-js/issues/166
[Issue #178]:https://github.com/oakmac/standard-clojure-style-js/issues/178
[Issue #181]:https://github.com/oakmac/standard-clojure-style-js/issues/181

[commit #db857ff4]:https://github.com/oakmac/standard-clojure-style-js/commit/db857ff413f0a8625c0cd0c975684244d875705e

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
[PR-110]:https://github.com/oakmac/standard-clojure-style-js/pull/110
[PR-115]:https://github.com/oakmac/standard-clojure-style-js/pull/115
[PR-116]:https://github.com/oakmac/standard-clojure-style-js/pull/116
[PR-117]:https://github.com/oakmac/standard-clojure-style-js/pull/117
[PR-118]:https://github.com/oakmac/standard-clojure-style-js/pull/118
[PR-119]:https://github.com/oakmac/standard-clojure-style-js/pull/119
[PR-120]:https://github.com/oakmac/standard-clojure-style-js/pull/120
[PR-122]:https://github.com/oakmac/standard-clojure-style-js/pull/122
[PR-124]:https://github.com/oakmac/standard-clojure-style-js/pull/124
[PR-127]:https://github.com/oakmac/standard-clojure-style-js/pull/127
[PR-128]:https://github.com/oakmac/standard-clojure-style-js/pull/128
[PR-130]:https://github.com/oakmac/standard-clojure-style-js/pull/130
[PR-131]:https://github.com/oakmac/standard-clojure-style-js/pull/131
[PR-133]:https://github.com/oakmac/standard-clojure-style-js/pull/133
[PR-134]:https://github.com/oakmac/standard-clojure-style-js/pull/134
[PR-138]:https://github.com/oakmac/standard-clojure-style-js/pull/138
[PR-141]:https://github.com/oakmac/standard-clojure-style-js/pull/141
[PR-147]:https://github.com/oakmac/standard-clojure-style-js/pull/147
[PR-148]:https://github.com/oakmac/standard-clojure-style-js/pull/148
[PR-160]:https://github.com/oakmac/standard-clojure-style-js/pull/160
[PR-163]:https://github.com/oakmac/standard-clojure-style-js/pull/163
[PR-164]:https://github.com/oakmac/standard-clojure-style-js/pull/164
[PR-167]:https://github.com/oakmac/standard-clojure-style-js/pull/167
[PR-168]:https://github.com/oakmac/standard-clojure-style-js/pull/168
[PR-171]:https://github.com/oakmac/standard-clojure-style-js/pull/171
[PR-177]:https://github.com/oakmac/standard-clojure-style-js/pull/177
[PR-179]:https://github.com/oakmac/standard-clojure-style-js/pull/179
[PR-182]:https://github.com/oakmac/standard-clojure-style-js/pull/182
