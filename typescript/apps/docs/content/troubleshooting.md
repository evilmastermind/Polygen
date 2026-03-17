---
title: Troubleshooting
description: Common Polygen errors and what they usually mean.
---

# Troubleshooting

## `CompileError: Undefined non-terminal ...`

The grammar references a symbol that is not declared in the current scope.

Check spelling first, then verify that nested groups declare the symbol where you expect.

## `CompileError: Overriding of non-terminal symbol ...`

The same scope declares the same symbol more than once.

```text
S ::= one;
S ::= two;
```

Nested groups may shadow outer declarations, but the same declaration block cannot redefine a symbol.

## `CompileError: Cyclic unfolding of symbol ...`

An unfold path eventually points back to itself.

```text
S ::= >S;
```

Break the unfold chain or make one branch terminate without unfolding the same symbol again.

## `GenerationError: Start symbol ... is not defined`

You passed `start` to generation, but the compiled grammar does not define that symbol.

## `GenerationError: Generation exceeded ... symbol expansions`

The runtime hit the recursion safeguard.

That usually means the grammar has a recursive path with no realistic terminating alternative, or the budget is too small for the grammar size.

## Illegal quote escapes or unterminated comments

Those fail during tokenization. Check string escapes like `\n` or octal escapes, and make sure every `(* ... *)` comment is closed.

## Compile Warnings

`polygenWithInfo(...)`, `polygenSegmentWithInfo(...)`, and `compileGrammarWithInfo(...)` now expose compile warnings without converting them into hard failures.

Current warning cases include unfolding an assignment-bound symbol and unfolding an inline group that only has one alternative.

## Imports Or Additional Warning-Style Diagnostics

The current package is library-first and does not support import declarations yet.

The historical OCaml project also had more warning-style checker behavior for cases like destructive selection or useless permutations. The TypeScript package now has a real warnings API, but it still does not cover the full OCaml warning model.
