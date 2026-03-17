---
title: Quick Start
description: Install Polygen and generate your first sentence.
---

# Quick Start

## Install

```bash
pnpm add polygen
```

Polygen ships as an ESM package intended for browsers and modern Node runtimes.

## Generate a Sentence

```ts
import { polygen } from "polygen";

const grammar =
  'S ::= Greeting Target; Greeting ::= "Hello" | "Welcome"; Target ::= world | traveler;';

const text = polygen(grammar);
```

`polygen(...)` parses the grammar, compiles it, and generates one sentence.

## Make Runs Reproducible

```ts
import { polygen } from "polygen";

const grammar = "S ::= red | blue | green;";

const text = polygen(grammar, { seed: 42 });
```

Providing the same seed and grammar yields the same result.

## Replay an Unseeded Run

```ts
import { polygen, polygenWithInfo } from "polygen";

const grammar = "S ::= red | blue | green;";

const first = polygenWithInfo(grammar);
const replay = polygen(grammar, { seed: first.resolvedSeed });
```

`polygenWithInfo(...)` returns both the text and the resolved seed used for generation.

## Generate from a Grammar Segment

```ts
import { polygenSegment } from "polygen";

const text = polygenSegment("(Adventuringgear | Valuables | Furniture)");
```

This is useful when you want to generate from a single production body without writing the full `S ::= ...;` wrapper yourself.
