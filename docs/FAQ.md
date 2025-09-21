# Frequently Asked Questions for Standard Clojure Style

## Is Standard Clojure Style a pretty-printer?

## Why is Standard Clojure Style written in JavaScript?

## Why does Standard Clojure Style not enforce a max line length?

Standard Clojure Style prioritizes simplicity, flexibility, and consistency by
not enforcing a maximum line length. Here’s why:

Implementation Complexity: Adding a max line length feature significantly complicates the formatter, increasing the risk of bugs and making maintenance harder.

No Universal Fit: Any specific limit would be arbitrary and might not suit all projects, conflicting with the goal of a broadly applicable formatting standard.

Conflict with Rules: It could clash with existing alignment rules (e.g., Rule 3), leading to unnecessary code changes and potential user frustration.

Practical Focus: Extremely long lines often signal deeper code structure issues better addressed through review and refactoring, not just automated formatting.

For projects where line length is a priority, tools like zprint offer configurable line length enforcement as an alternative.
