---
title: Polygen Docs
description: Browser-compatible TypeScript rewrite of the Polygen grammar generator.
---

# Polygen

Polygen is a browser-compatible TypeScript rewrite of the original OCaml random sentence generator. It keeps the grammar-driven workflow, keeps deterministic seeds when you want them, and defaults to entropy-backed randomness when you do not.

The original project is GPL-licensed, and this TypeScript rewrite preserves that licensing direction as GPL-2.0-or-later.

## What This Rewrite Is For

- Import a generator into any modern ESM project.
- Generate sentences in browsers and modern Node without the legacy CLI.
- Preserve the recognizable Polygen grammar style while making the API more explicit.
- Keep runs reproducible when you provide a seed.
- Make unseeded runs replayable by returning the resolved seed.

## Current Release Scope

The first release is library-first.

- Top-level helpers: `polygen`, `polygenWithInfo`, `polygenSegment`, `polygenSegmentWithInfo`
- Lower-level helpers: `parseGrammar`, `compileGrammar`, `generateCompiled`, `tokenize`
- Supported behavior: labels, grouped productions, optional groups, mobile groups, unfold and lock syntax, seeded and unseeded generation, recursion safeguards, Unicode grammar content
- Not yet covered: legacy CLI compatibility, imports, and the full warning-model parity from the OCaml checker

## License

- Original project license direction: GNU General Public License, version 2 or later
- TypeScript package SPDX identifier: `GPL-2.0-or-later`
- Repository license notice: root `License` file

## Read Next

- [Quick Start](/quick-start)
- [API Reference](/api)
- [Grammar Basics](/grammar-basics)
- [Operators](/operators)
- [Labels and Scoping](/labels-scoping)
- [Examples](/examples)
- [Status and Compatibility](/status-compatibility)
- [Randomness](/randomness)
- [Troubleshooting](/troubleshooting)
