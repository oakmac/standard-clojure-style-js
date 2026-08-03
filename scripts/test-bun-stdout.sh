#!/usr/bin/env bash

set -euo pipefail

FORMS="${FORMS:-10000}"
RUNS="${RUNS:-20}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
BUN_BINARY="$TMP_DIR/standard-clj-bun"
INPUT_FILE="$TMP_DIR/input.clj"
EXPECTED_FILE="$TMP_DIR/expected.clj"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cd "$REPO_ROOT"

command -v bun >/dev/null 2>&1 || {
  echo "ERROR: bun is not installed"
  exit 1
}

command -v node >/dev/null 2>&1 || {
  echo "ERROR: node is not installed"
  exit 1
}

echo "Generating input with $FORMS forms ..."

node - "$FORMS" > "$INPUT_FILE" <<'NODE'
const forms = Number(process.argv[2])

for (let i = 0; i < forms; i++) {
  console.log(`(defn func-${i} [x] (+ x ${i}))`)
}
NODE

echo "Input size:"
wc -c "$INPUT_FILE"

echo
echo "Building Bun executable ..."

bun build ./cli.mjs \
  --compile \
  --outfile "$BUN_BINARY"

echo
echo "Generating expected output with Node ..."

# `cat` ensures stdout is a pipe rather than a regular file.
node ./cli.mjs fix - \
  < "$INPUT_FILE" \
  | cat > "$EXPECTED_FILE"

EXPECTED_BYTES="$(wc -c < "$EXPECTED_FILE")"

echo "Expected output: $EXPECTED_BYTES bytes"
echo

for run in $(seq 1 "$RUNS"); do
  ACTUAL_FILE="$TMP_DIR/actual-$run.clj"

  "$BUN_BINARY" fix - \
    < "$INPUT_FILE" \
    | cat > "$ACTUAL_FILE"

  ACTUAL_BYTES="$(wc -c < "$ACTUAL_FILE")"

  if cmp -s "$EXPECTED_FILE" "$ACTUAL_FILE"; then
    printf 'Run %02d/%02d: PASS (%s bytes)\n' \
      "$run" "$RUNS" "$ACTUAL_BYTES"
  else
    echo
    echo "Run $run/$RUNS: FAIL"
    echo "Expected: $EXPECTED_BYTES bytes"
    echo "Actual:   $ACTUAL_BYTES bytes"
    echo
    echo "Checksums:"
    sha256sum "$EXPECTED_FILE" "$ACTUAL_FILE"
    echo
    echo "First difference:"
    cmp "$EXPECTED_FILE" "$ACTUAL_FILE" || true
    echo
    echo "Failed output retained temporarily at:"
    echo "  $ACTUAL_FILE"
    exit 1
  fi
done

echo
echo "PASS: compiled Bun executable matched Node in all $RUNS runs."
