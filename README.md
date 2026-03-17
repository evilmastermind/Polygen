# Polygen

Polygen is a browser-compatible TypeScript rewrite of the original Polygen grammar generator.

This rewrite and its accompanying documentation are being actively developed with AI assistance.

This repository now contains two parallel tracks:

- the original OCaml implementation and historical project files in the repository root
- the new TypeScript workspace in `typescript/`, focused on an npm package and a modern docs site

## Credit To The Original Project

This rewrite builds on the original Polygen project created by Alvise Spano and the original contributors.

- Original website: <https://polygen.org>
- Original repository: <https://github.com/alvisespano/Polygen>

## Repository Layout

```text
.
├── src/                  # original OCaml implementation
├── docs/                 # original HTML specification and historical docs
├── grammars/             # historical grammar collection
└── typescript/
    ├── apps/docs         # Nuxt 4 + Nuxt Content documentation site
    └── packages/polygen  # browser-safe TypeScript library package
```

## Current Direction

The active rewrite work is in `typescript/`.

Current scope:

- publish a `polygen` npm package for browsers and modern Node ESM
- keep the grammar-driven Polygen workflow intact
- preserve deterministic seeding when requested
- default to entropy-backed randomness when no seed is provided
- expose resolved seeds so unseeded runs can be replayed later
- provide a docs site in English using Nuxt 4 and Nuxt Content

Intentionally not in first-release scope:

- legacy CLI compatibility
- import support
- the full warning-model parity from the OCaml checker

## TypeScript Workspace

The TypeScript rewrite uses a pnpm workspace rooted in `typescript/`.

Requirements:

- Node 24+
- pnpm 10+

Install workspace dependencies:

```bash
cd typescript
pnpm install
```

Common commands:

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm dev:docs
pnpm smoke:consumer
pnpm smoke:browser
```

Verification notes:

- `pnpm smoke:consumer` packs `polygen`, installs it into a temporary external project, and exercises the published API.
- `pnpm smoke:browser` packs `polygen`, installs it into a temporary external project, bundles that installed package for `platform=browser`, and executes the resulting bundle.

## Package Quick Start

```ts
import { polygen, polygenWithInfo } from "polygen";

const grammar =
  'S ::= Greeting Target; Greeting ::= "Hello" | "Welcome"; Target ::= traveler | world;';

const text = polygen(grammar);
const replayable = polygenWithInfo(grammar);
```

Segment helper:

```ts
import { polygenSegment } from "polygen";

const text = polygenSegment("alpha | beta | gamma");
```

## Documentation

The rewritten docs live in `typescript/apps/docs`.

Current coverage includes:

- quick start
- API reference
- grammar basics
- operators
- labels and scoping
- parity status and deferred features
- randomness and replayability
- troubleshooting
- example-driven pages based on real legacy fixtures

## Current Compatibility Boundary

Implemented and verified today:

- browser-safe ESM package output
- packaged consumer install smoke test
- packaged browser-bundle smoke test
- grammar parsing and generation for labels, groups, unfold and lock syntax, recursion guards, multiline grammars, and multilingual content

Still intentionally deferred:

- legacy CLI compatibility
- import declarations
- the full OCaml warning model parity and warning-reporting surface
- exact parity classification for every historical grammar feature

## Legacy Materials

The repository root still contains the original sources and historical assets.

- `src/` contains the OCaml implementation
- `docs/polygen-spec_EN.html` and `docs/polygen-spec_IT.html` contain the historical language specification
- `grammars/` contains the historical grammar collection

Those files remain important reference material for parity work, but the ongoing npm-focused implementation lives in `typescript/`.
