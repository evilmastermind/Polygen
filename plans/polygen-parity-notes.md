# Polygen TypeScript Parity Notes

This document records verified behavior from the legacy OCaml implementation and the intentional deviations adopted by the TypeScript rewrite.

## Legacy Front-End Surface

Primary sources reviewed:

1. `src/lexer.mll`
2. `src/parser.mly`
3. `src/polygen_lib.mli`
4. `src/polygen_js.ml`

## Legacy Public API

The OCaml library exposes three relevant entry points:

1. `pRNG_init(?seed)`
2. `load_decls(grammar)`
3. `generate(?lbs, ?start, declarations)`

The existing JavaScript wrapper exposes:

1. `Polygen.generate(grammar, { start?, lbs? })`
2. `Polygen.pRngInit(seed)`

## Verified Lexer Behavior From `src/lexer.mll`

### Whitespace and Comments

1. Spaces and tabs are ignored.
2. Newlines are ignored as separators but still update source locations.
3. OCaml-style comments `(* ... *)` are supported.
4. Comments can nest.

### Structural Tokens

The legacy lexer emits tokens for:

1. `;` as end-of-line token
2. `:`
3. `(` `)`
4. `[` `]`
5. `{` `}`
6. `::=` and `:=`
7. `|`
8. `>` and `>>`
9. `<` and `<<`
10. `*` `+` `-`
11. `^` `_` `.` `,` `\` `/`
12. `.(`

### Identifiers and Literals

1. Quoted strings are tokenized by a dedicated `quote` rule.
2. Supported quote escapes in the legacy lexer are `\"`, `\\`, `\n`, `\r`, `\b`, `\t`, and three-digit octal escapes.
3. Bare terminals are currently restricted in OCaml to lowercase ASCII letters, digits, and apostrophes in the first position, followed by ASCII letters, digits, and apostrophes.
4. Bare non-terminals are currently restricted in OCaml to uppercase ASCII initial characters followed by ASCII letters and digits.
5. Dot labels have the form `.label` and are emitted as a dedicated token.
6. `import` and `as` are reserved keywords.

## Intentional TypeScript Front-End Changes

### Unicode and Input Ergonomics

The TypeScript rewrite intentionally broadens accepted grammar input.

1. Valid grammars must be accepted without stripping newlines.
2. Valid grammars must be accepted without accent removal.
3. Quoted strings should accept broad Unicode text.
4. Bare terminals should accept Unicode lowercase and uncased letters, digits, apostrophes, and combining marks.
5. Bare non-terminals should accept Unicode uppercase or titlecase initial characters.
6. These changes are intentional improvements, not accidental incompatibilities.

### Segment Utility

The TypeScript package will also support standalone grammar segments.

1. Grouped bodies like `(A | B | C)` should be accepted.
2. Ungrouped bodies like `A | B | C` should be accepted.
3. The helper should wrap the segment into a valid temporary grammar without requiring caller-side boilerplate.

## Current Classification

### Verified Parity Or Equivalent Behavior

1. Grammar declarations, productions, alternatives, nested groups, lock syntax, and unfold syntax are supported in the TypeScript port.
2. Undefined non-terminals are rejected during compilation.
3. Cyclic unfolding is rejected during compilation.
4. String escape handling includes legacy-style escaped control characters and three-digit octal escapes.
5. Comments may nest.

### Intentional Changes

1. Unicode grammar input is accepted without caller-side normalization.
2. Unseeded generation derives a high-entropy runtime seed and exposes it as `resolvedSeed` for replayability.
3. A segment utility exists for grouped and ungrouped production bodies.
4. The rewrite is library-first rather than CLI-first.

### Deferred Or Incomplete Areas

1. Import declarations are parsed but intentionally unsupported in compilation.
2. The warning model from the OCaml checker is only partially surfaced so far.
3. Full feature-by-feature parity against the historical HTML specification is still incomplete; see `plans/legacy-spec-coverage-audit.md` for the current implementation/docs matrix.
4. Exact parity classification for every generator semantic corner case is still ongoing.
