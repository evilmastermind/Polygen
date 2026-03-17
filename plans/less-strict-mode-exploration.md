# Less-Strict Mode Exploration

This note records the current feasibility assessment for an optional less-strict compatibility mode.

## User Goal

Example target behavior:

- today, a bare token such as `Hello` is tokenized as a non-terminal because it starts with an uppercase letter
- if that symbol is not declared, compilation raises `CompileError: Undefined non-terminal 'Hello'`
- a less-strict mode might instead treat `Hello` as a terminal literal and continue

## Current Constraint

The strict uppercase/lowercase split is decided in the tokenizer.

- uppercase or titlecase starts become `nonterm`
- lowercase or uncased starts become `term`

That means a future less-strict mode is not just a small change to one compile error. The ambiguity begins before compilation.

## Feasible Design Directions

### Option 1: Compile-Time Fallback For Undefined Non-Terminals

Keep tokenization as it is today, but add a less-strict compile option such as `strictness: "strict" | "compat"`.

In `compat` mode:

- if a `nonterm` reference appears in expression position and is undefined in scope, compile it as a terminal literal instead of throwing
- emit a warning such as `undefined-nonterm-fallback`

Benefits:

- smallest implementation change
- directly addresses the `Hello` example
- keeps declaration heads strict

Limits:

- only affects unresolved references in atom position
- does not change how declaration heads, import aliases, path segments, or labels are tokenized

### Option 2: Tokenizer-Level Ambiguous Identifier Mode

Introduce a third identifier token kind such as `identifier`, then let the parser or compiler decide whether a token is terminal-like or non-terminal-like based on context and known declarations.

Benefits:

- more principled long-term model
- could support broader compatibility behavior consistently

Costs:

- much larger refactor
- affects parser assumptions throughout declaration, path, and label parsing
- higher risk of unintended grammar ambiguity

## Candidate Rules That Could Potentially Become Optional

These are the safest candidates to explore first.

1. Undefined non-terminal fallback in expression position.
2. Invalid explicit label selection fallback to the unselected target, with a warning instead of an error.
3. Unsupported import declarations staying as hard errors in strict mode but becoming ignored-with-warning in a future compatibility experiment.

## Rules That Should Probably Stay Strict

These look too risky to relax without changing the language substantially.

1. Tokenizer errors such as unterminated comments or illegal quote escapes.
2. Parser structure errors such as missing `;` or broken grouping delimiters.
3. Cyclic unfolding errors.
4. Invalid runtime option values such as bad seeds or non-positive `maxExpansions`.
5. Duplicate declarations in the same scope, unless the compatibility target is explicitly documented as last-definition-wins.
6. Missing start symbols, unless the mode also defines a deterministic fallback policy.

## Recommended Next Step

If this mode is explored in code, start with Option 1 only:

- scope it to undefined non-terminals in atom position
- keep it opt-in
- surface a warning for every fallback site
- do not relax parser or tokenizer syntax yet

That would test the usefulness of a less-strict mode without forcing a whole-parser redesign.
