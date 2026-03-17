# polygen

Browser-compatible TypeScript rewrite of Polygen.

This package and its accompanying documentation are being actively developed with AI assistance.

## Credit To The Original Project

This package builds on the original Polygen project created by Alvise Spano and the original contributors.

- Original website: <https://polygen.org>
- Original repository: <https://github.com/alvisespano/Polygen>

## Install

```bash
pnpm add polygen
```

## Quick Start

```ts
import { polygen, polygenWithInfo, polygenSegment } from "polygen";

const grammar =
  'S ::= Greeting Target; Greeting ::= "Hello" | "Welcome"; Target ::= traveler | world;';

const text = polygen(grammar);
const replayable = polygenWithInfo(grammar);
const segmentText = polygenSegment("alpha | beta | gamma");
```

## Main API

- `polygen(grammar, options?)`: parse, compile, and generate one sentence
- `polygenWithInfo(grammar, options?)`: same as `polygen`, but returns `{ text, resolvedSeed, warnings }`
- `polygenSegment(segment, options?)`: generate from a production body without writing a full grammar wrapper
- `polygenSegmentWithInfo(segment, options?)`: segment generation plus resolved-seed metadata

## Options

- `seed`: deterministic seed for reproducible generation
- `start`: explicit start symbol, defaulting to `S`
- `labels`: active label environment
- `maxExpansions`: recursion budget guard for non-terminating grammars

## Randomness

- Seeded runs are deterministic.
- Unseeded runs derive a seed from runtime entropy.
- `polygenWithInfo(...)` and `polygenSegmentWithInfo(...)` expose the resolved seed so an unseeded run can be replayed later.

## Documentation

The full rewrite documentation lives in the workspace docs app at `typescript/apps/docs` in the repository.

## Current Compatibility Boundary

Implemented in the current package:

- browser-compatible ESM output
- deterministic seeded generation and replayable unseeded runs
- labels, grouped productions, optional groups, mobile groups, lock and unfold syntax
- standalone segment helpers for grouped and ungrouped production bodies

Intentionally deferred for the first release:

- legacy CLI compatibility
- import declarations
- the full warning-model parity from the OCaml checker

Verification coverage in the repository workspace includes a clean external consumer install smoke test and a browser-platform bundle smoke test against the packed package.
