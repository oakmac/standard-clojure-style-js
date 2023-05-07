# clojurefmt-js

Tonsky's [clojurefmt](https://tonsky.me/blog/clojurefmt/) written in JavaScript.

## TODO

- [ ] copy over [parsing test suite](https://github.com/tonsky/Clojure-Sublimed/tree/master/test_parser) from [Clojure-Sublimed](https://github.com/tonsky/Clojure-Sublimed)
- [ ] integrate test suite with `npm test` harness
- [x] write JS module boilerplate
- [ ] start passing the test suite

## Notes

- follows Simple Clojure Formatting Rules
- alphabetically sorts namespaces
- trims strings of trailing whitespace
- converts all tabs to spaces
- inserts newline at the bottom of the file
- what to do about width?
- should apply parinfer-style closing parens at the end of forms?
  - I think "yes"
  - ie: "fold"

## Development

```sh
npm test
```

## License

[ISC License](LICENSE.md)
