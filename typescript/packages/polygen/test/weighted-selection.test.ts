import { describe, expect, it } from "vitest";

import { compileGrammar, generateCompiled, parseGrammar } from "../src/index";

describe("weighted alternative selection", () => {
  it.each([
    { grammar: "S ::= a | b;", visits: [0, 0], expected: { a: 1, b: 1 } },
    {
      grammar: "S ::= a | a | b | b | b;",
      visits: [0, 0, 0, 0, 0],
      expected: { a: 2, b: 3 }
    },
    { grammar: "S ::= a | b;", visits: [0, 2], expected: { a: 3, b: 1 } }
  ])(
    "assigns exactly the intended shares for $grammar with visits $visits",
    ({ grammar, visits, expected }) => {
      const total = Object.values(expected).reduce(
        (sum, count) => sum + count,
        0
      );
      const counts: Record<string, number> = {};

      for (let draw = 0; draw < total; draw++) {
        const compiled = compileGrammar(parseGrammar(grammar));
        const alternatives = compiled.declarations[0]!.production.alternatives;

        alternatives.forEach((alternative, index) => {
          alternative.visits = visits[index]!;
        });

        const output = generateCompiled(compiled, {
          random: {
            int(maxExclusive) {
              expect(maxExclusive).toBe(total);
              return draw;
            }
          }
        });

        counts[output] = (counts[output] ?? 0) + 1;
      }

      expect(counts).toEqual(expected);
    }
  );
});
