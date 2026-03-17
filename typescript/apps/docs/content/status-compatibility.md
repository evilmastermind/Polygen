---
title: Status And Compatibility
description: Current parity boundary, intentional changes, deferred features, and verification coverage.
---

# Status And Compatibility

This rewrite is intentionally not a line-for-line clone of the original OCaml project. The goal is a reliable browser-compatible library first, with parity work documented as it becomes verified.

## Verified In The Current TypeScript Package

- top-level APIs: `polygen`, `polygenWithInfo`, `polygenSegment`, `polygenSegmentWithInfo`
- lower-level APIs: `tokenize`, `parseGrammar`, `parseSegment`, `compileGrammar`, `compileGrammarWithInfo`, `generateCompiled`
- grammar handling for labels, grouped productions, optional groups, mobile groups, lock syntax, unfold syntax, concatenation, capitalization, epsilon, recursion safeguards, multiline grammars, and Unicode content
- deterministic seeded runs and replayable unseeded runs through `resolvedSeed`
- a real compile warnings channel for currently supported warning cases
- packaged installability from a clean external project
- packaged browser bundling with a real `platform=browser` smoke test

## Intentional Changes From The Historical OCaml Project

- the package accepts multilingual grammar input without caller-side accent stripping or newline flattening
- bare terminals and non-terminals are broader than the original ASCII-oriented lexer rules
- unseeded runs derive a high-entropy seed and return that resolved seed so the run can be replayed later
- a segment helper exists so callers can generate from a production body without writing a full temporary grammar manually
- the first release is library-first and does not aim to preserve the legacy CLI surface

## Deferred Or Incomplete Areas

- import declarations are still rejected
- the full OCaml warning model is not yet surfaced as a TypeScript diagnostics API
- warning-style checks such as useless permutations and destructive selection are still documented but not yet emitted by the package
- parity classification is still incomplete for every historical corner case in the original language specification

## Checker Parity Notes

The legacy checker actively enforced undefined-symbol and cyclic-unfolding errors. The TypeScript port also enforces undefined symbols, duplicate declarations within a scope, malformed explicit label selection where that can be known statically, and cyclic unfolding.

Some additional legacy checker behavior is warning-based rather than error-based. That matters because adding those as hard failures would change semantics. The package now exposes a real warnings surface for a small supported subset, while the rest remains documented rather than emitted.

## Verification Commands

From `typescript/`:

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm typecheck
pnpm build
pnpm smoke:consumer
pnpm smoke:browser
```
