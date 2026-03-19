---
title: Examples
description: Example-driven documentation based on the same legacy fixtures used by the test suite.
---

# Examples

This page uses the same real grammar inputs that back the package smoke tests. That keeps the docs grounded in behavior the project actually validates.

## Legacy English Smoke Grammar

This excerpt comes from the legacy English test fixture and shows several supported features together: quoted strings, optional groups, mobile groups, concatenation, and recursive phrase building.

```text
Phrase ::= "this is a test"
         | the quick brown {fox} jumped over the lazy {dog}
         | "it works!";

FooPhrase ::= foo [ bar [ baz ]];
KeyboardWord ::= qwer [^t[^y[^u[^i[^o[^p]]]]]];
KeyboardPhrase ::= KeyboardWord (_ | KeyboardPhrase);
```

What this demonstrates:

- simple literal alternatives
- optional groups with nested optionals
- mobile atoms with `{...}`
- concat with `^`
- recursion with an epsilon escape path

## Legacy Unfold Fixture

This smaller fixture comes from the original source tree and is useful because it exercises nested local declarations and unfold behavior in a compact form.

```text
S ::= (X ::= y; >Fx) (X ::= x; >Fx);

Fx ::= ciao >X;

X ::= dummy;
```

With a deterministic seed in the current port, this smoke fixture produces:

```text
ciao y ciao x
```

The important part is not the exact sentence shape by itself, but that the local `X` bindings shadow the outer `X` and survive unfolding correctly.

## Practical API Pairing

For one-shot generation, use the high-level helper:

```ts
import { polygen } from "polygen";

const text = polygen(grammar, { seed: 9 });
```

When you want to preserve the exact run for later replay, switch to:

```ts
import { polygenWithInfo } from "polygen";

const result = polygenWithInfo(grammar);
```

That gives you both the generated text and the resolved seed.
