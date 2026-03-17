# Polygen TypeScript Rewrite: Agent Brief

## Mission

Rewrite Polygen from its current OCaml implementation into a TypeScript library that can be installed from npm and imported from browser-compatible JavaScript or TypeScript projects.

The target user experience is:

```ts
import { polygen } from "polygen";

const grammar = "<my grammar>";
const sentence = polygen(grammar);
```

This rewrite is not a CLI preservation project. The first release should focus on a library-first developer experience, modern packaging, solid tests, and user-ready documentation.

## Primary Deliverables

1. A pnpm workspace under `typescript/` that becomes the active development structure for the rewrite.
2. A TypeScript package published as `polygen`.
3. A browser-compatible and modern Node ESM runtime.
4. A readable, maintainable implementation of the PML parsing and generation pipeline.
5. A Nuxt 4 + Nuxt Content documentation site written in English.
6. A detailed checklist that is kept current across sessions and interruptions.

## Product Scope

### In Scope

1. A TypeScript rewrite of the Polygen library behavior.
2. A public API centered on `polygen(grammar, options?)`.
3. Support for browser-compatible bundlers and modern Node ESM consumers.
4. ESLint, Prettier, TypeScript type-checking, and Vitest.
5. English documentation rewritten from the existing project materials.
6. Grammar compatibility with the existing PML language as far as practical for the initial release.

### Out of Scope for the First Release

1. Rebuilding the legacy CLI unless priorities change later.
2. Preserving the OCaml source as the active implementation.
3. Reproducing every legacy packaging artifact in the repository root.

## Required Repository Shape

Use a pnpm workspace monorepo contained inside a dedicated subfolder so the new TypeScript code does not mix with the legacy OCaml project files at the repository root.

Recommended layout:

```text
.
├── typescript/
│   ├── apps/
│   │   └── docs/
│   ├── packages/
│   │   └── polygen/
│   └── package.json
├── plans/
└── ...legacy reference material...
```

The existing OCaml code and HTML documentation remain in the repository root as reference material during the rewrite. New TypeScript, npm, and Nuxt files should live under `typescript/` unless there is a strong reason not to.

## Reference Material

Treat the current implementation and documentation as the semantic source of truth until the TypeScript rewrite reaches parity.

Priority reference files:

1. `src/polygen_lib.mli`
2. `src/polygen_lib.ml`
3. `src/polygen_js.ml`
4. `src/absyn.ml`
5. `src/lexer.mll`
6. `src/parser.mly`
7. `src/pre.ml`
8. `src/check.ml`
9. `src/gen.ml`
10. `docs/polygen-spec_EN.html`
11. `docs/polygen-spec_IT.html`
12. `README.md`
13. `grammars/en/test.grm`
14. `src/test.grm`

## Required Behavioral Commitments

### Grammar and Runtime

1. Preserve the PML grammar language and existing grammar authoring model.
2. Preserve the default start symbol behavior of `S` unless explicitly overridden.
3. Preserve the meaningful semantics of labels, concatenation, epsilon, unfolding, binding, optional groups, and recursion handling.
4. Preserve seeded determinism when a seed is explicitly provided.
5. Accept full grammar source without requiring callers to flatten newlines or otherwise "clean" valid grammar formatting first.
6. Avoid ASCII-only sanitization rules and support a broad Unicode character range so grammars can be written in many languages.

### Grammar Input Ergonomics

The rewrite must remove the need for legacy caller-side grammar sanitation or structure hacks.

1. Valid grammars must not need newline stripping before parsing.
2. Valid grammars must not need accent removal before parsing.
3. The parser and tokenizer should be designed with multilingual grammar content in mind.
4. If there are unavoidable limits, they must be implementation limits with tests and documentation, not ad hoc caller-side cleanup rules.

### Randomness

The legacy system sometimes felt predictably random. The rewrite must improve this.

1. Preserve an explicit seeding option as a supported feature.
2. When no seed is provided, generation must default to non-predictable randomness.
3. When a seed is provided, generation must remain reproducible for testing and user control.
4. The implementation should use high-entropy seeding where available, including browser and modern Node environments.
5. The tests must prove both seeded reproducibility and non-trivial unseeded variability.

## API Direction

The simplest public API should look like this:

```ts
import { polygen } from "polygen";

const output = polygen(grammar, {
  start: "S",
  labels: ["foo", "bar"],
  seed: 12345,
});
```

If `seed` is omitted, the runtime should use true randomness.

Lower-level APIs may also be exposed if they clearly help maintainability and advanced use cases, for example:

1. `parse(grammar)`
2. `compile(grammar)`
3. `generate(compiled, options)`
4. `createGenerator(compiled, options)`
5. `createSegmentGrammar(segment, options?)`
6. `polygenSegment(segment, options?)`

The segment utility should accept either a grouped body like `(A | B | C)` or an ungrouped body like `A | B | C`, then make that usable without requiring callers to wrap it into a full grammar manually.

Do not add surface area just because the original code had separate internal phases. Only expose lower-level APIs if they materially improve ergonomics, testing, or documentation.

## Engineering Constraints

1. Prefer readability and maintainability over micro-optimizations.
2. Keep the architecture explicit and developer-friendly.
3. Avoid unnecessary dependencies.
4. Keep the runtime browser-safe.
5. Avoid Node-only APIs in the published runtime path.
6. Keep the rewrite incremental and verifiable.

## Documentation Requirements

Create a new English documentation site inside this repository using Nuxt 4 and Nuxt Content.

Documentation goals:

1. Quick start for npm installation and import usage.
2. API reference for the TypeScript library.
3. Grammar basics and operator reference.
4. Advanced guides for labels, recursion, probability, and scoping.
5. Troubleshooting and error explanations.
6. Real examples sourced from the project grammars where appropriate.

The new docs should be Markdown-first and user-ready. The existing HTML specs are source material, not the final documentation experience.

## Working Method

1. Build the isolated `typescript/` workspace and tooling first.
2. Inventory the legacy behavior before implementing the parser and generator.
3. Port the language pipeline in layers: tokenizer, parser, preprocessing, validation, generator.
4. Write tests continuously instead of postponing verification.
5. Connect docs examples to the actual library package to reduce drift.
6. Keep the checklist current at all times.

## Session Continuity Rule

This project is expected to span multiple interrupted sessions.

At the end of each work session:

1. Update the checklist file.
2. Mark completed items accurately.
3. Expand the next major task into smaller tasks when enough context exists.
4. Record any important decisions or scope changes directly in the checklist.

Do not rely on chat history as the only source of project state.

## Verification Standard

Before closing any major milestone, verify all of the following where relevant:

1. `pnpm lint`
2. `pnpm format --check`
3. `pnpm test`
4. TypeScript type-checking
5. Package build output
6. Nuxt documentation build
7. Consumer install smoke test from a clean sample project

## Initial Execution Order

1. Scaffold the pnpm workspace inside `typescript/`.
2. Add shared TypeScript, ESLint, Prettier, and Vitest configuration.
3. Create the `polygen` package skeleton.
4. Create the Nuxt 4 + Nuxt Content docs app skeleton.
5. Port and test the tokenizer.
6. Port and test the parser.
7. Port and test preprocessing and validation.
8. Port and test generation semantics.
9. Finalize the public API and packaging.
10. Rewrite and publish the docs content.

## Definition of Done

The first release is done when:

1. A consumer can install `polygen` and call `polygen(grammar)` from a browser-compatible TypeScript project.
2. The runtime handles the supported PML feature set with strong test coverage.
3. Default randomness is not predictably repeated across unseeded runs.
4. Seeded runs are reproducible.
5. The docs site is usable as the primary documentation entry point.
6. The checklist reflects the actual current state of the rewrite.
