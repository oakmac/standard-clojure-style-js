# clojurefmt-js

Tonsky's [clojurefmt](https://tonsky.me/blog/clojurefmt/) written in JavaScript.

## TODO

- [x] copy over [parsing test suite](https://github.com/tonsky/Clojure-Sublimed/tree/master/test_parser) from [Clojure-Sublimed](https://github.com/tonsky/Clojure-Sublimed)
- [x] integrate test suite with `npm test` harness
- [x] write JS module boilerplate
- [x] start passing the test suite
- [x] tokens - Division Symbol followed by delimiter
- [x] tokens - Special Chars
- [x] parens - Anonymous Function
- [ ] tokens - gensym'd symbol
- [ ] parens - Call with Symbol with Metadata
- [ ] parens - Eval
- [ ] brackets - Vector with Different Types

## Notes

- write the parser first, then the formatter
- follows Simple Clojure Formatting Rules
- alphabetically sorts namespaces
- trims strings of trailing whitespace
- "Remove leading and trailing newlines. Also remove some extra consecutive newlines." from [janet fmt]
- converts all tabs to spaces
- inserts newline at the bottom of the file
- what to do about width?
- should apply parinfer-style closing parens at the end of forms?
  - I think "yes"
  - ie: "fold"
- should allow to skip the next form via a comment
  - we definitely need this
  - only allow this for top-level forms?

[janet fmt]:https://raw.githubusercontent.com/janet-lang/spork/master/spork/fmt.janet

## References

- https://clojureverse.org/t/clj-commons-building-a-formatter-like-gofmt-for-clojure/3240/95
- https://github.com/clj-commons/formatter/issues/9
- https://tonsky.me/blog/clojurefmt/
- https://github.com/parinfer/parindent

## Development

```sh
## run unit tests
npm test

## lint JS
npm run lint
```

## License

[ISC License](LICENSE.md)
