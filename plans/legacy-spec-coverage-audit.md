# Legacy Spec Coverage Audit

This note compares the historical English specification in `docs/polygen-spec_EN.html` against:

1. the current TypeScript implementation in `typescript/packages/polygen`
2. the current rewrite docs in `typescript/apps/docs`

It is meant to answer three questions feature by feature:

1. Is the legacy behavior implemented in the TypeScript port?
2. Is it documented in the rewrite docs?
3. If it is documented, is the current description exhaustive enough compared with the historical spec?

## Sources Read

- `plans/typescript-rewrite-checklist.md`
- `plans/typescript-rewrite-agent-brief.md`
- `plans/polygen-parity-notes.md`
- `plans/less-strict-mode-exploration.md`
- `docs/polygen-spec_EN.html`
- `typescript/packages/polygen/src/*.ts`
- `typescript/packages/polygen/test/index.test.ts`
- `typescript/apps/docs/content/docs/**/*.md`

## Status Legend

- Implementation: `yes`, `partial`, `no`
- Docs: `yes`, `partial`, `no`

## High-Level Findings

- The current TypeScript port covers much more of the historical language than the current docs admit.
- The largest remaining gaps are now mostly implementation-parity gaps rather than missing user-facing documentation. The rewrite docs now cover the language guide, techniques, diagnostics, and appendix-style reference material, but some historical checker behaviors still do not exist in code.
- The largest implementation gaps against the historical spec are in static validation parity, not in core parsing syntax.
- The current rewrite docs are good as an introduction, but they are not yet exhaustive enough to claim spec-level completeness.

## Legacy Option References

These are the user-facing options explicitly referenced by the historical English spec itself.

| Legacy option or convention                 | Legacy ref | Implementation | Docs | Notes                                                                                               |
| ------------------------------------------- | ---------- | -------------- | ---- | --------------------------------------------------------------------------------------------------- |
| Default start symbol is `S`                 | 1          | yes            | yes  | Documented in grammar basics and API.                                                               |
| Alternate start symbol via program options  | 1          | yes            | yes  | Documented in quick start and grammar basics with a dedicated example using `start`.                |
| `-info` flow depends on defining symbol `I` | 4.2.2.1    | no             | no   | The library-first rewrite does not expose the historical `-info` mode or the `I`-symbol convention. |

No other CLI or runtime options are described in `polygen-spec_EN.html` with the same explicitness.

## Feature Matrix

### 1. Basics And Core Syntax

| Legacy feature                                                               | Legacy ref | Implementation | Docs | Notes                                                                                                                           |
| ---------------------------------------------------------------------------- | ---------- | -------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| Declarations with `::=` and alternatives with `\|`, terminated by `;`        | 1          | yes            | yes  | Covered, but current docs are much shorter than the historical walk-through.                                                    |
| Bare uppercase tokens are non-terminals; bare lowercase tokens are terminals | 1          | yes            | yes  | Grammar basics now explains the convention and the intentional Unicode-aware divergence from the original ASCII-oriented lexer. |
| Capitalized terminal words must be quoted                                    | 1          | yes            | yes  | Grammar basics now documents this explicitly with an example.                                                                   |
| Punctuation and keywords must be quoted to be emitted literally              | 1          | yes            | yes  | Grammar basics now calls out punctuation, syntax characters, and reserved words as quoting cases.                               |
| Parenthesized subproductions `( ... )`                                       | 1.1        | yes            | yes  | The rewrite docs mention grouped subgrammars, but not their probability consequences in detail.                                 |
| Optional subproductions `[ ... ]` with implicit 50% behavior                 | 1.2        | yes            | yes  | Grammar basics now explains the 50% body-vs-epsilon behavior and the equivalence to epsilon-based expansion.                    |
| Comments `(* ... *)`                                                         | 1.3        | yes            | yes  | Grammar basics now documents comment syntax and notes that nested comments are supported in the current tokenizer.              |

### 2. Advanced Language Features

| Legacy feature                                         | Legacy ref | Implementation | Docs | Notes                                                                                                                            |
| ------------------------------------------------------ | ---------- | -------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| Concatenation `^`                                      | 2.1        | yes            | yes  | Operators now document prefix, suffix, infix usage and the fact that repeated carets collapse to the same pending concat effect. |
| Epsilon `_`                                            | 2.2        | yes            | yes  | Operators now explain epsilon as absence of output and connect it to optional-group semantics.                                   |
| Production probability modifiers `+` and `-`           | 2.3        | yes            | yes  | Operators now document the weighting feature and the current parser's relative-share expansion rule.                             |
| Unfolding `>` on non-terminals                         | 2.4.1      | yes            | yes  | Operators now describe the flattening role of unfold and its probability-distribution effect on non-terminal references.         |
| Unfolding `>` on grouped subproductions                | 2.4.2      | yes            | yes  | Operators now explain how grouped alternatives are lifted into the surrounding series.                                           |
| Unfolding optional groups                              | 2.4.3      | yes            | yes  | Operators now document that optional groups are also unfoldable.                                                                 |
| Unfolding mobile/permutable groups                     | 2.4.4      | yes            | yes  | Operators now document the permutation-plus-unfold interaction for mobile groups.                                                |
| Unfolding deeply unfolded groups                       | 2.4.5      | yes            | yes  | Operators now document `> >> ... <<` as a meaningful composition.                                                                |
| Labels on productions                                  | 2.5.1      | yes            | yes  | Labels/scoping now explains labeled alternatives, active-label filtering, and selection propagation.                             |
| Explicit label selection with `.label`                 | 2.5.1      | yes            | yes  | Labels/scoping now documents propagation semantics, strict failures, and compat-mode fallback behavior.                          |
| Multiple selection with `.(a\|b)`                      | 2.5.2      | yes            | yes  | Labels/scoping now documents multi-selection as the compact multi-path selection form.                                           |
| Probability modifiers inside multi-selection labels    | 2.5.2      | yes            | yes  | Labels/scoping now documents weighted label choices in multi-selection.                                                          |
| Selection reset with bare `.`                          | 2.5.3      | yes            | yes  | Labels/scoping now documents reset semantics and gives a concrete example.                                                       |
| Capitalization `\\`                                    | 2.6        | yes            | yes  | Operators now explains that capitalization stays pending until the next emitted terminal.                                        |
| Permutation with mobile groups `{ ... }`               | 2.7        | yes            | yes  | Operators now documents that permutation is sequence-local and limited to mobile groups in the same sequence.                    |
| Deep unfolding `>> ... <<`                             | 2.8        | yes            | yes  | Operators now documents deep-unfold as recursive flattening with the current implementation's behavior.                          |
| Folding / lock `<`                                     | 2.9        | yes            | yes  | Operators now documents lock as the escape hatch inside unfolded or deep-unfolded regions.                                       |
| Weak binding / closure `::=`                           | 2.10.1     | yes            | yes  | Labels/scoping now documents closure semantics explicitly.                                                                       |
| Strong binding / suspension `:=`                       | 2.10.2     | yes            | yes  | Labels/scoping now documents assignment/suspension behavior and the first-expansion memoization model.                           |
| Top-level mutual-recursive environment                 | 2.11.1     | yes            | yes  | Labels/scoping now documents top-level mutual visibility.                                                                        |
| Local bindings inside subproductions                   | 2.11.2     | yes            | yes  | Labels/scoping now documents local declarations inside grouped subgrammars.                                                      |
| Static lexical scoping and shadowing                   | 2.11.3     | yes            | yes  | Labels/scoping now documents lexical scoping, closure behavior, and inner-scope shadowing.                                       |
| Positional generation with comma-separated atom groups | 2.12       | yes            | yes  | Operators now documents positional generation and the equal-width requirement enforced by the compiler.                          |
| Iteration `( ... )+`                                   | 2.13       | yes            | yes  | Operators now documents one-or-more grouped repetition and its interaction with assignment bindings.                             |

### 3. Historical Techniques And Semantic Guidance

| Legacy feature or technique                                                               | Legacy ref | Implementation | Docs | Notes                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ---------- | -------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Recursion as a grammar technique                                                          | 3.1        | partial        | yes  | Advanced Techniques now documents recursive authoring patterns, runtime safeguards, and the parity gap versus the historical static checker. |
| Grouping as a probability-shaping technique                                               | 3.2        | yes            | yes  | Advanced Techniques now explains grouping as a probability-distribution tool rather than just a structural convenience.                      |
| Controlling optional-group probability by expanding to epsilon plus weighted alternatives | 3.3        | yes            | yes  | Advanced Techniques now documents the epsilon-plus-weighting rewrite for non-50% optional behavior.                                          |

### 4. Static Validation And Diagnostics Parity

| Legacy diagnostic behavior                               | Legacy ref | Implementation | Docs | Notes                                                                                                                                                |
| -------------------------------------------------------- | ---------- | -------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Undefined non-terminal is a hard error                   | 4.1.1      | yes            | yes  | Validation/Diagnostics now covers this explicitly, including the strict-vs-compat distinction.                                                       |
| Static detection of cyclic recursion / non-termination   | 4.1.2      | no             | yes  | Validation/Diagnostics now explicitly documents that the historical static checker is not yet matched and that runtime safeguards are used instead.  |
| Recursive unfoldings are hard errors                     | 4.1.3      | yes            | yes  | Validation/Diagnostics documents cyclic unfold chains as a compile-time error.                                                                       |
| Epsilon-only grammars are rejected                       | 4.1.4      | no             | yes  | Validation/Diagnostics now documents this as a historical checker rule that the TypeScript port has not yet implemented.                             |
| Duplicate declarations in the same scope are hard errors | 4.1.5      | yes            | yes  | Validation/Diagnostics documents this as a current compile-time error.                                                                               |
| Illegal character tokenizer errors                       | 4.1.6      | partial        | yes  | Validation/Diagnostics now explains tokenizer-stage failures, though a full lexical reference page is still missing.                                 |
| Unexpected token parser errors                           | 4.1.7      | partial        | yes  | Validation/Diagnostics now documents parser-stage structural failures as a distinct error class.                                                     |
| Warning levels 0 to 3                                    | 4.2        | no             | yes  | Validation/Diagnostics now explains that the historical warning-level hierarchy is not preserved and that the rewrite exposes warning codes instead. |
| Missing `I` symbol warning                               | 4.2.2.1    | no             | yes  | Validation/Diagnostics now documents this as part of the historical checker surface that is not relevant to the library-first rewrite.               |
| Potential epsilon-production warning                     | 4.2.2.2    | no             | yes  | Validation/Diagnostics now documents this as a historical warning not yet implemented in the TypeScript port.                                        |
| Destructive-selection warning                            | 4.2.2.3    | no             | yes  | Validation/Diagnostics and Labels/Scoping now both document this as a known parity gap.                                                              |
| Useless-permutation warning                              | 4.2.3.1    | no             | yes  | Validation/Diagnostics now documents this as a historical warning not yet emitted by the rewrite.                                                    |
| Useless-unfolding warning                                | 4.2.3.2    | yes            | yes  | Validation/Diagnostics now documents the current warning and its relationship to the historical useless-unfolding category.                          |
| Unfolding a suspended symbol warning                     | 4.2.4.1    | yes            | yes  | Validation/Diagnostics now documents the current `unfold-assign` warning as the rewrite equivalent of the historical category.                       |

### 5. Appendix And Reference-Parity Gaps

| Legacy reference section                | Legacy ref | Implementation | Docs | Notes                                                                                                                                                                                                    |
| --------------------------------------- | ---------- | -------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concrete syntax reference               | 5.1        | partial        | yes  | Syntax Reference now provides a rewrite-native EBNF-style grammar sketch matching the current parser, including the current import and path surface.                                                     |
| Abstract syntax reference               | 5.2        | yes            | yes  | Syntax Reference now documents the public AST shape, node kinds, group modes, and terminal special values.                                                                                               |
| Lexical rules reference                 | 5.3        | partial        | yes  | Syntax Reference now documents the Unicode-aware lexer rules and explicitly calls out the divergence from the older ASCII-oriented lexer.                                                                |
| Escape sequence reference               | 5.4        | partial        | yes  | Syntax Reference now lists the currently accepted escapes and records that the current tokenizer interprets three-digit numeric escapes as decimal codes.                                                |
| Translation rules / preprocessing order | 5.5        | partial        | yes  | Translation And Preprocessing now documents the current implementation order for weight expansion, deep-unfold normalization, positional variants, permutation, unfold, optional groups, and repetition. |

## Priority Documentation Gaps To Close Next

1. Decide whether the project wants to restore any of the historical checker features still marked above as `no`.
2. Expand the API docs where the appendix-level public type surface should be explained more explicitly.
3. Cross-check the rewritten diagnostics and reference pages against the Italian spec for any historical nuance not captured in the English HTML edition.
4. Verify the new reference pages against real fixtures and edge-case tests so the docs stay implementation-true.
5. Revisit the docs app landing page and overall IA once the reference material settles, so the new breadth remains easy to navigate.
