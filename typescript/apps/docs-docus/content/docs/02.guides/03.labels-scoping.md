---
title: Labels and Scoping
description: How labels, explicit selection, multiselect, and nested scopes work.
---

# Labels and Scoping

## Labeled Alternatives

Labels attach metadata to a sequence.

```text
S ::= Greeting;
Greeting ::= formal: "Good day" | casual: "Hi" | "Hello";
```

At generation time, labels act as a filter over alternatives.

## Active Label Environments

```ts
import { polygen } from "polygen";

const text = polygen(grammar, {
  labels: ["formal"]
});
```

With active labels, a sequence is eligible when it is:

- unlabeled, or
- labeled with one of the active labels

This matches the current legacy-compatible behavior of the port.

## Explicit Label Selection

```text
S ::= Greeting.formal;
Greeting ::= formal: "Good day" | "Hello";
```

Explicit selection activates a label for the selected target.

If the label is not available on the target and the compiler can determine that statically, compilation fails with `CompileError`.

## Multi-Selection

```text
S ::= Greeting.(formal|casual);
```

Multi-selection chooses one of the provided labels at generation time and activates it for the selected target.

## Nested Scopes

Grouped subgrammars can declare local symbols.

```text
S ::= (S ::= "inner"; >S) | "outer";
```

Nested scopes may shadow outer declarations. The compiler rejects duplicate declarations only within the same scope.

## Assignment Scope

```text
S ::= X X;
X := one | two;
```

Assignment bindings memoize within a single generation run. They are useful when several expansions must agree on one generated value.
