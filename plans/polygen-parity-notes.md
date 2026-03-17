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

## Status

### Completed

1. Workspace scaffold under `typescript/`
2. Initial public TypeScript package skeleton
3. Initial Nuxt docs scaffold
4. First tokenizer implementation target identified and started

### Next Parity Work

1. Inventory AST layers from `src/absyn.ml`
2. Inventory parser productions from `src/parser.mly`
3. Inventory preprocessing from `src/pre.ml`
4. Inventory generator semantics from `src/gen.ml`
5. Classify exact-parity versus intentional behavior differences beyond lexing
