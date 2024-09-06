# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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

[Unreleased]:https://github.com/oakmac/standard-clojure-style-js/compare/v0.2.0...HEAD
[0.2.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.2.0
[0.1.2]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.2
[0.1.1]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.1
[0.1.0]:https://github.com/oakmac/standard-clojure-style-js/releases/tag/v0.1.0

[Issue #48]:https://github.com/oakmac/standard-clojure-style-js/issues/48
[Issue #67]:https://github.com/oakmac/standard-clojure-style-js/issues/67
[Issue #68]:https://github.com/oakmac/standard-clojure-style-js/issues/68
[Issue #69]:https://github.com/oakmac/standard-clojure-style-js/issues/69
[Issue #74]:https://github.com/oakmac/standard-clojure-style-js/issues/74
[Issue #75]:https://github.com/oakmac/standard-clojure-style-js/issues/75
[Issue #76]:https://github.com/oakmac/standard-clojure-style-js/issues/76

[PR-72]:https://github.com/oakmac/standard-clojure-style-js/pull/72
[PR-79]:https://github.com/oakmac/standard-clojure-style-js/pull/79
[PR-80]:https://github.com/oakmac/standard-clojure-style-js/pull/80
[PR-82]:https://github.com/oakmac/standard-clojure-style-js/pull/82
[PR-83]:https://github.com/oakmac/standard-clojure-style-js/pull/83
[PR-84]:https://github.com/oakmac/standard-clojure-style-js/pull/84
