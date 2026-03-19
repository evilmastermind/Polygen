# Polygen TypeScript Rewrite Checklist

This checklist is the operational source of truth for the rewrite. Keep it updated at the end of every work session.

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` completed

## Global Rules

- Keep the library browser-compatible and modern Node ESM compatible.
- Prefer readability over cleverness.
- Preserve PML behavior unless an intentional change is documented here.
- Preserve an explicit seeding option.
- Default generation without a seed must use non-predictable randomness.
- Seeded generation must remain reproducible.
- Do not require callers to strip newlines, accents, or non-ASCII characters from valid grammars.
- Keep docs examples aligned with the real package implementation.
- Give visible credit in every main documentation page or README to the original creators, including links to polygen.org and github.com/alvisespano/Polygen.
- Clearly indicate in main documentation pages and readmes that the rewrite is being developed with AI assistance.
- Expand the next major task into smaller tasks as soon as enough context exists.

## Current Decisions

- [x] Workspace shape: pnpm workspace monorepo inside `typescript/`.
- [x] Primary package goal: publish `polygen`.
- [x] Runtime target: browser + modern Node ESM.
- [x] First release scope: library-first, no legacy CLI requirement.
- [x] Docs stack: Nuxt 4 + Nuxt Content.
- [x] Docs migration approach: build a staged Docus app alongside the current docs app before any cutover.
- [x] Randomness policy: preserve the seeding feature, but use high-entropy true randomness when no seed is provided.
- [x] Grammar input policy: valid grammars should be accepted without caller-side newline flattening or accent stripping.
- [x] API direction: include a utility for working from a grammar segment, not only full grammar files.

## Phase 1: Workspace and Tooling

- [x] Create the `typescript/` workspace folder.
- [x] Create the pnpm workspace files inside `typescript/`.
- [x] Add a `typescript/package.json` with shared scripts.
- [x] Add `typescript/pnpm-workspace.yaml`.
- [x] Define the supported Node and pnpm versions.
- [x] Add a shared TypeScript base config.
- [x] Add shared ESLint configuration.
- [x] Add shared Prettier configuration.
- [x] Add shared Vitest configuration where appropriate.
- [x] Create `typescript/packages/polygen`.
- [x] Create `typescript/apps/docs`.
- [x] Ensure workspace scripts can run lint, format, type-check, test, build, and docs tasks.
- [x] Update the root README to explain the isolated TypeScript workspace layout and rewrite scope.

## Phase 2: Legacy Inventory and Parity Contract

- [x] Read and summarize the OCaml public surface from `src/polygen_lib.mli` and `src/polygen_js.ml`.
- [x] Inventory lexical rules from `src/lexer.mll`.
- [x] Inventory grammar rules from `src/parser.mly`.
- [x] Inventory AST layers from `src/absyn.ml`.
- [x] Inventory preprocessing behavior from `src/pre.ml`.
- [x] Inventory semantic checks from `src/check.ml`.
- [x] Inventory generation behavior from `src/gen.ml`.
- [x] Inventory user-facing language semantics from `docs/polygen-spec_EN.html`.
- [ ] Cross-check unclear parts against `docs/polygen-spec_IT.html`.
- [x] Write a parity notes document inside the project.
- [x] Classify features into exact parity, intentional changes, and deferred work.
- [x] Document the intentional randomness change clearly.

## Phase 3: Fixtures and Test Inputs

- [x] Select a minimal smoke-test grammar fixture set.
- [x] Select an intermediate feature fixture set.
- [ ] Select an advanced feature fixture set.
- [x] Include fixtures for labels and label selection.
- [ ] Include fixtures for concatenation and epsilon.
- [ ] Include fixtures for recursion and termination behavior.
- [ ] Include fixtures for unfolding and binding semantics.
- [x] Include fixtures for string escape handling.
- [x] Include fixtures with multilingual and accented text.
- [x] Include fixtures with multiline formatting that should parse without preprocessing.
- [x] Include fixtures for standalone grammar segments with and without wrapping parentheses.
- [ ] Include at least one fixture that historically exposed weak randomness perception.
- [x] Organize fixtures for reuse by unit tests and docs examples.

## Phase 4: TypeScript Domain Model

- [x] Define tokenizer token types.
- [x] Define source location types.
- [x] Define parser AST types.
- [x] Define preprocessed grammar model types.
- [x] Define generation-time model types.
- [x] Define error and diagnostic types.
- [x] Define public option types for the library.
- [x] Define types for standalone grammar segment utilities.
- [ ] Keep the types readable and explicitly named.

## Phase 5: Tokenizer

- [x] Implement comment handling.
- [x] Implement quoted string tokenization.
- [x] Implement escape sequence parsing.
- [x] Implement non-terminal tokenization.
- [x] Implement terminal tokenization.
- [x] Ensure tokenization handles Unicode text in grammar terminals and comments.
- [x] Implement operator tokenization.
- [x] Implement label-related tokenization.
- [x] Preserve source positions for syntax errors.
- [x] Add tokenizer unit tests for all major token categories.
- [x] Add tokenizer unit tests for malformed input.

## Phase 6: Parser

- [x] Implement declaration parsing.
- [x] Implement production and alternative parsing.
- [x] Implement grouped subproduction parsing.
- [x] Implement optional group parsing.
- [x] Implement concatenation parsing.
- [x] Implement label selection parsing.
- [x] Implement unfolding and related operator parsing.
- [x] Implement binding-related syntax parsing.
- [x] Implement parsing entry points for standalone grammar segments with and without surrounding parentheses.
- [x] Produce useful syntax errors with locations.
- [x] Add parser tests for valid grammar fixtures.
- [x] Add parser tests for invalid grammar fixtures.

## Phase 7: Preprocessing and Validation

- [x] Port the preprocessing rules needed to canonicalize parsed grammars.
- [x] Implement mobile atom handling if supported in the initial release.
- [x] Normalize equivalent syntax forms where the legacy implementation does.
- [x] Implement undefined symbol checks.
- [x] Implement malformed label usage checks.
- [x] Implement duplicate declaration checks within a scope.
- [x] Implement cyclic unfolding checks.
- [~] Implement other high-value semantic validation rules.
- [x] Decide how warnings are represented and surfaced.
- [ ] Add tests for preprocessing outputs.
- [x] Add tests for semantic validation errors.

## Phase 8: Generator Runtime

- [x] Implement declaration storage and lookup.
- [x] Implement label environment handling.
- [x] Implement sequence evaluation.
- [x] Implement alternation selection.
- [x] Implement concatenation behavior.
- [x] Implement epsilon behavior.
- [x] Implement capitalization behavior.
- [x] Implement label filtering behavior.
- [x] Implement unfolding behavior.
- [x] Implement binding and memoization behavior.
- [x] Implement recursion safeguards.
- [x] Implement output post-processing.
- [x] Add tests for runtime semantics using explicit seeds where needed.

## Phase 9: Randomness and Seeding

- [x] Design the random source abstraction.
- [x] Preserve a public seed option for deterministic generation.
- [x] Use browser or Node cryptographic entropy when available when no seed is provided.
- [x] Add a safe fallback strategy only if necessary.
- [x] Expose explicit seed control for reproducible runs.
- [x] Verify repeated seeded runs are identical.
- [x] Verify repeated unseeded runs are not trivially predictable.
- [x] Expose the resolved seed so unseeded runs can be replayed.
- [x] Document the randomness behavior in the package docs.

## Phase 10: Public API and Packaging

- [x] Implement the top-level `polygen(grammar, options?)` API.
- [ ] Decide whether the convenience API throws on invalid grammar or delegates to lower-level helpers.
- [ ] Implement lower-level helpers only if justified.
- [x] Implement the standalone grammar segment utility API.
- [x] Add package export maps.
- [x] Generate declaration files.
- [x] Ensure the published runtime path is browser-safe.
- [x] Add package metadata suitable for npm publication.
- [x] Add package README content or link strategy if needed.
- [x] Add consumer-facing usage examples.

## Phase 11: Test Suite and Verification

- [x] Set up Vitest in the workspace.
- [x] Add unit tests for tokenizer.
- [x] Add unit tests for parser.
- [x] Add unit tests for preprocessing.
- [x] Add unit tests for validation.
- [x] Add unit tests for generation semantics.
- [x] Add seeded regression tests.
- [x] Add unseeded variability tests.
- [x] Add tests proving valid multiline grammars parse without caller-side normalization.
- [x] Add tests proving multilingual grammar content is accepted without accent stripping.
- [x] Add tests for standalone grammar segment utilities.
- [x] Add browser-compatibility checks where practical.
- [x] Add clean consumer smoke tests.

## Phase 12: Documentation Site

- [x] Scaffold the Nuxt 4 app.
- [x] Add Nuxt Content.
- [x] Create the docs navigation structure.
- [x] Create a landing page.
- [x] Write the quick-start guide.
- [x] Write installation and import guidance.
- [x] Write the API reference.
- [x] Write the grammar basics guide.
- [x] Write the operators reference.
- [x] Write labels and scoping documentation.
- [x] Write recursion and probability guidance.
- [x] Write troubleshooting and error documentation.
- [x] Write example-driven pages using real grammar snippets.
- [x] Ensure all code examples reflect the actual library API.
- [x] Build the docs successfully.
- [x] Analyze the Docus reference app used by the Nuxt i18n-style example.
- [x] Scaffold a staged `apps/docs-docus` app without replacing the current docs app.
- [x] Migrate the current docs content into a Docus section tree.
- [x] Add Polygen branding and landing-page copy to the staged Docus app.
- [x] Build the staged Docus app successfully.
- [x] Remove out-of-scope Docus features from the staged docs app so it stays a user-facing docs site only.
- [~] Refine the staged Docus app to more closely match the intended Nuxt i18n-style information architecture.

## Phase 13: Migration and Release Readiness

- [x] Rewrite the root README for the new project direction.
- [x] Explain the relationship between legacy OCaml sources and the new TypeScript workspace.
- [x] Document the library-first scope change.
- [x] Document any intentionally deferred language features.
- [x] Verify linting passes.
- [x] Verify formatting checks pass.
- [x] Verify tests pass.
- [x] Verify type-checking passes.
- [x] Verify the package builds.
- [x] Verify the docs build.
- [x] Verify installability from a clean external sample project.

## Expansion Backlog

Only expand these after the first release scope is under control.

- [ ] Optional thin compatibility CLI.
- [ ] Optional interactive docs playground.
- [ ] Optional compiled grammar import or caching strategies.
- [ ] Optional deeper semantic analysis beyond the first release checks.
- [~] Optional less-strict compatibility mode.

## Session Log

Update this section briefly at the end of each session.

- [x] Initial rewrite plan and checklist created in `plans/`.
- [x] Randomness policy clarified: keep explicit seeding support, default to true randomness when no seed is provided.
- [x] Workspace direction clarified: keep the new implementation isolated inside a `typescript/` subfolder instead of mixing TypeScript workspace files into the repository root.
- [x] Added requirements for multilingual grammar input and standalone grammar segment utilities.
- [x] Scaffolded the isolated TypeScript workspace, validated lint/test/typecheck/build, and added initial segment helper and multilingual-input placeholder coverage.
- [x] Added parity notes, a Unicode-aware tokenizer, and a first recursive-descent grammar parser with tested segment parsing entry points.
- [x] Replaced the placeholder runtime with an initial compile-and-generate pipeline supporting seeded generation, label handling, unfold/basic preprocessing behavior, and tested core sentence generation semantics.
- [x] Added semantic validation for malformed label selection and explicit unseeded variability coverage while keeping the package lint/test/typecheck/build clean.
- [x] Added recursion-aware generation safeguards with an explicit expansion budget, plus multiline generation coverage.
- [x] Exposed resolved seed metadata for replayable unseeded runs and validated seed input handling.
- [x] Added compile-time checks for duplicate declarations in the same scope and cyclic unfold chains.
- [x] Added project-owned legacy grammar fixtures and smoke tests for real grammar inputs, including the legacy unfold example.
- [x] Replaced the placeholder docs with a navigable first-pass documentation set covering quick start, API, grammar basics, randomness, and troubleshooting.
- [x] Added shared original-project credits to the docs shell and expanded docs coverage with operators and labels/scoping pages.
- [x] Added an example-driven docs page based on the same legacy fixtures used by the package smoke tests.
- [x] Rewrote the root README and added a package README so the repository and npm package both describe the TypeScript workspace, scope, and original-project credits.
- [x] Added a visible AI-development disclosure to the shared docs shell and both public readmes.
- [x] Added a clean consumer smoke-test script that packs the library and exercises it from a temporary external project.
- [x] Verified clean external installability by packing `polygen`, installing it into a temporary project, and running its public API successfully.
- [x] Added a packaged browser smoke test, expanded fixture coverage for labels, multilingual input, multiline input, escapes, and segments, and documented the current parity boundary plus deferred warning-model work.
- [x] Analyzed the Docus example app, scaffolded a staged `apps/docs-docus` migration target, migrated the current docs content into Docus sections, and fixed the first staged build blockers by adding direct CSS dependencies required under pnpm.
- [x] Reworked `apps/docs-docus` from the full Docus layer into a slim Nuxt UI plus Nuxt Content docs app with the Docus-style sectioned information architecture, removing AI assistant, MCP, LLM, OG-image, and raw-markdown routes from the build output.
- [x] Started the compiler-owned less-strict compatibility layer with an opt-in `compilePolicy`, plus warning-backed fallbacks for undefined non-terminals in atom position and invalid explicit label selection.
- [x] Verified the first compatibility-policy slice: strict mode stayed intact, compat-mode fallback tests passed, and the full workspace verification stack remained green.
- [x] Re-ran workspace verification successfully: format check, lint, tests, typecheck, package build, docs build, consumer smoke, and browser smoke all passed.
- [x] Added a real compile warnings surface, exposed warnings through `compileGrammarWithInfo(...)` and top-level `...WithInfo(...)` APIs, and wrote initial exploration notes for a future less-strict compatibility mode.
- [x] Re-verified the warnings release after implementation: 44 package tests passed, docs build passed, and both consumer/browser smoke tests still passed.
- [x] Documented the first compatibility-policy implementation across quick start, API, troubleshooting, compatibility status, and public readmes so the new warning-backed fallbacks are discoverable.
- [x] Aligned the TypeScript rewrite's public licensing story with the original project: package metadata now uses `GPL-2.0-or-later`, the package carries its own `LICENSE` file, and the repo/docs/readmes now mention the GPL license explicitly.
- [x] Audited the historical English spec against the TypeScript implementation and current docs, then recorded a feature-by-feature coverage matrix in `plans/legacy-spec-coverage-audit.md`.
