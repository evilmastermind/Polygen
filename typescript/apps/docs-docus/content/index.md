---
title: "Polygen Docs"
description: "Browser-compatible TypeScript rewrite of the Polygen grammar generator."
navigation: false
---

## ::u-page-hero

orientation: horizontal
links:

- label: Get Started
  trailingIcon: i-heroicons-arrow-right-20-solid
  to: /docs/getting-started
  size: lg
- label: Original Project
  icon: i-simple-icons-github
  size: lg
  variant: ghost
  color: neutral
  to: https://github.com/alvisespano/Polygen
  target: \_blank
  ui:
  container: "relative overflow-hidden py-10 flex flex-col md:flex-row items-center gap-4"
  description: "text-xl max-w-2xl leading-normal mb-10"

---

#top
:::div{class="absolute z-[-1] rounded-full bg-(--ui-primary) blur-[260px] size-56 sm:size-72 transform -translate-x-1/2 left-1/2 -translate-y-64"}
:::
:::div{class="absolute -z-10 inset-0 h-full w-full bg-[radial-gradient(circle,var(--ui-color-primary-900)_1px,transparent_1px)] bg-[size:20px_20px] opacity-35"}
:::

#title
Polygen for modern browser and Node projects

#description
Polygen is a browser-compatible TypeScript rewrite of the original OCaml grammar generator. It keeps the grammar-driven workflow, preserves deterministic seeded runs, supports replayable unseeded runs, and documents the current compatibility boundary explicitly.

```ts [Example]
import { polygenWithInfo } from "polygen";

const result = polygenWithInfo(
  'S ::= Greeting Target; Greeting ::= "Hello" | "Welcome"; Target ::= traveler | world;'
);
```

::

## ::u-page-section

## title: What you get

::u-page-grid
::u-page-card

---

icon: i-lucide-package
to: /docs/getting-started

---

#title
Library-first package

#description
Import Polygen in modern ESM projects without relying on the legacy CLI.
::

::u-page-card

---

icon: i-lucide-dices
to: /docs/getting-started/randomness

---

#title
Reproducible randomness

#description
Keep deterministic seeds when needed and replay unseeded runs through the resolved seed.
::

::u-page-card

---

icon: i-lucide-file-code-2
to: /docs/guides/grammar-basics

---

#title
Polygen grammar guides

#description
Learn labels, groups, operators, recursion boundaries, and current runtime semantics.
::

::u-page-card

---

icon: i-lucide-shield-alert
to: /docs/project/status-compatibility

---

#title
Explicit compatibility notes

#description
See what already matches the historical project, what changed intentionally, and what remains deferred.
::
::
::

## ::u-page-section

## title: Project notes

- The rewrite preserves the original project's licensing direction as `GPL-2.0-or-later`.
- Main public docs and readmes disclose that the TypeScript rewrite is being developed with AI assistance.
- The historical project and specification remain the reference for parity work.
  ::
