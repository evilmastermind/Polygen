---
title: API Reference
description: Public API surface for the TypeScript Polygen package.
---

# API Reference

## Top-Level Helpers

### `polygen(grammar, options?)`

Parses a grammar string, compiles it, and generates one sentence.

```ts
import { polygen } from "polygen";

const result = polygen("S ::= hello | world;");
```

### `polygenWithInfo(grammar, options?)`

Same behavior as `polygen`, but returns `{ text, resolvedSeed, warnings }`.

```ts
import { polygenWithInfo } from "polygen";

const result = polygenWithInfo("S ::= hello | world;");
// { text: "hello", resolvedSeed: 1234567890, warnings: [] }
```

### `polygenSegment(segment, options?)`

Wraps a production body into a temporary grammar and generates one sentence.

```ts
import { polygenSegment } from "polygen";

const result = polygenSegment("alpha | beta | gamma");
```

### `polygenSegmentWithInfo(segment, options?)`

Segment-based generation plus resolved-seed metadata.

## `PolygenOptions`

| Field           | Type       | Meaning                                                        |
| --------------- | ---------- | -------------------------------------------------------------- |
| `seed`          | `number`   | Deterministic seed. Must be a finite integer.                  |
| `start`         | `string`   | Start symbol. Defaults to `S`.                                 |
| `labels`        | `string[]` | Active label environment for filtering alternatives.           |
| `maxExpansions` | `number`   | Hard generation budget used to stop non-terminating recursion. |

## Lower-Level Helpers

### `tokenize(grammar)`

Returns the token stream with source ranges. Useful when debugging parser behavior.

### `parseGrammar(grammar)` and `parseSegment(segment)`

Build the parsed AST without generating output.

### `compileGrammar(ast)`

Runs preprocessing and compile-time validation to produce a runtime-ready grammar.

### `compileGrammarWithInfo(ast)`

Compiles a grammar and returns `{ compiled, warnings }`.

Use this when you want a real diagnostics channel without changing strict error behavior.

### `generateCompiled(compiled, options)`

Generates text from a previously compiled grammar.

This is the lowest-level public path if you want to parse once and generate many times.

## Error Types

| Error             | When it happens                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `TokenizerError`  | Invalid lexical input such as illegal quote escapes or unterminated comments                                      |
| `ParserError`     | Invalid grammar structure                                                                                         |
| `CompileError`    | Invalid semantics such as missing symbols, duplicate declarations, malformed label selection, or cyclic unfolding |
| `GenerationError` | Missing start symbol, invalid runtime options, or exhausted recursion budget                                      |

## Warning Types

`polygenWithInfo(...)`, `polygenSegmentWithInfo(...)`, and `compileGrammarWithInfo(...)` expose a `warnings` array.

Current warning codes:

| Code             | Meaning                                                |
| ---------------- | ------------------------------------------------------ |
| `unfold-assign`  | An assignment-bound symbol is being unfolded           |
| `useless-unfold` | An inline unfolded group has only a single alternative |

## Scope Notes

The current API is intentionally library-first. Import declarations are still unsupported, and the full OCaml warning model is only partially surfaced today.

See the [Status and Compatibility](/status-compatibility) page for the current parity boundary.
