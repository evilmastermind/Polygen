---
title: Grammar Basics
description: Core Polygen grammar syntax supported by the current TypeScript port.
---

# Grammar Basics

## Rules

Rules are written as non-terminals on the left and productions on the right.

```text
S ::= Greeting Target;
Greeting ::= "Hello" | "Welcome";
Target ::= traveler | world;
```

The default start symbol is `S`.

## Terminals and Non-Terminals

- Quoted text like `"Hello"` is emitted literally.
- Bare lowercase words like `traveler` are also terminals.
- Bare uppercase identifiers like `Greeting` are non-terminals.

Unicode content is supported in terminals and quoted text.

## Useful Operators

| Syntax | Meaning                                              |
| ------ | ---------------------------------------------------- |
| `\|`   | Alternative                                          |
| `_`    | Epsilon, meaning no output                           |
| `^`    | Concatenate with no space                            |
| `\`    | Capitalize the next terminal output                  |
| `[X]`  | Optional group                                       |
| `{X}`  | Mobile group that can permute position               |
| `>X`   | Unfold target at compile time into a subgrammar form |
| `<X`   | Lock a target against unfolding                      |

See [Operators](/operators) for detailed examples and caveats.

## Labels

Labels let you filter alternatives.

```text
S ::= Greeting;
Greeting ::= formal: "Good day" | casual: "Hi" | "Hello";
```

Generation with `labels: ["formal"]` keeps the `formal` branch and still allows unlabeled branches.

See [Labels and Scoping](/labels-scoping) for more detail on explicit selection, multiselect, and nested declarations.

## Assign vs Define

```text
S ::= X X;
X := one | two;
```

`:=` memoizes the chosen value within a generation run, so both `X` expansions match. Use `::=` when you want each expansion to be chosen independently.

## Segments

If you only have a production body such as `alpha | beta | gamma`, use `polygenSegment(...)` instead of manually wrapping it into a full grammar string.
