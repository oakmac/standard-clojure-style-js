# clojurefmt-js

Tonsky's [clojurefmt](https://tonsky.me/blog/clojurefmt/) written in JavaScript.

## TODO

- [ ] need to add additional cases for namespace maps (what is allowed?)
- [ ] PR upstream to Clojure-Sublimed the option map for Repeat (can remove Repeat1)
- [ ] chat with Nikita about what he wants to do about emoji length inside of Strings

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
- [emoji length article](https://hsivonen.fi/string-length/)

## Development

```sh
## run unit tests
bun test

## lint JS
bun run lint
```

## License

[ISC License](LICENSE.md)
