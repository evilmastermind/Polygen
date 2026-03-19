---
title: Randomness
description: How seeding, entropy, and replayability work in the TypeScript rewrite.
---

# Randomness

## Seeded Runs

When you pass `seed`, Polygen uses a deterministic pseudo-random generator.

```ts
import { polygen } from "polygen";

const grammar = "S ::= alpha | beta | gamma;";

const first = polygen(grammar, { seed: 42 });
const second = polygen(grammar, { seed: 42 });
```

`first` and `second` will match.

## Unseeded Runs

When you do not pass a seed, Polygen derives one from runtime entropy.

- In browsers and modern Node, it uses `globalThis.crypto.getRandomValues(...)` when available.
- If that is unavailable, it falls back to `Math.random()` only to obtain the initial seed.

The generator itself still runs from a resolved 32-bit seed after that point.

This is an intentional change from the historical project direction: the rewrite keeps explicit seeding, but unseeded runs are meant to feel genuinely random while still remaining replayable afterward.

## Replayability

```ts
import { polygen, polygenWithInfo } from "polygen";

const grammar = "S ::= alpha | beta | gamma;";

const run = polygenWithInfo(grammar);
const replay = polygen(grammar, { seed: run.resolvedSeed });
```

This is the recommended way to keep an apparently random run and replay it later.

## Recursion Budget

Polygen also exposes `maxExpansions`.

```ts
import { polygen } from "polygen";

const text = polygen(grammar, {
  maxExpansions: 500,
  seed: 42
});
```

This does not change the random source. It caps how many symbol expansions a single generation may perform before the runtime throws `GenerationError`.
