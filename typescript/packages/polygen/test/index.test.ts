import { describe, expect, it } from "vitest";

import { readFixture } from "./fixtures";

import {
  compileGrammar,
  compileGrammarWithInfo,
  createSegmentGrammar,
  CompileError,
  generateCompiled,
  GenerationError,
  parseGrammar,
  parseSegment,
  ParserError,
  polygen,
  polygenSegmentWithInfo,
  polygenWithInfo,
  polygenSegment,
  tokenize,
  TokenizerError
} from "../src/index";

describe("polygen", () => {
  it("generates a literal sentence", () => {
    expect(polygen('S ::= "hello";')).toBe("hello");
  });

  it("supports the segment convenience API", () => {
    const segment = readFixture("segment-ungrouped.txt").trim();

    expect(polygenSegment(segment, { seed: 7 })).toMatch(
      /^(adventuringgear|valuables|furniture)$/
    );
  });

  it("returns metadata for the segment convenience API", () => {
    const result = polygenSegmentWithInfo('"Valuables" | "Furniture"', {
      seed: 7
    });

    expect(result.resolvedSeed).toBe(7);
    expect(["Valuables", "Furniture"]).toContain(result.text);
  });

  it("wraps an ungrouped segment into a temporary grammar", () => {
    expect(
      createSegmentGrammar(readFixture("segment-ungrouped.txt").trim())
    ).toBe("S ::= (adventuringgear | valuables | furniture);");
  });

  it("accepts a grouped segment without double-wrapping it", () => {
    expect(
      createSegmentGrammar(readFixture("segment-grouped.txt").trim())
    ).toBe("S ::= (adventuringgear | valuables | furniture);");
  });

  it("preserves multilingual content in the wrapped grammar", () => {
    expect(createSegmentGrammar("Épée | niño | 東京 | Δώρο")).toContain(
      "Épée | niño | 東京 | Δώρο"
    );
  });

  it("produces deterministic output when a seed is provided", () => {
    const grammar = "S ::= foo | bar | baz;";

    expect(polygen(grammar, { seed: 42 })).toBe(polygen(grammar, { seed: 42 }));
  });

  it("returns the resolved seed alongside generated output", () => {
    const result = polygenWithInfo("S ::= foo | bar | baz;");

    expect(Number.isInteger(result.resolvedSeed)).toBe(true);
    expect(result.resolvedSeed).toBeGreaterThanOrEqual(0);
    expect(result.resolvedSeed).toBeLessThan(0x1_0000_0000);
    expect(["foo", "bar", "baz"]).toContain(result.text);
    expect(result.warnings).toEqual([]);
  });

  it("can replay an unseeded run through the resolved seed", () => {
    const grammar = "S ::= foo | bar | baz;";
    const first = polygenWithInfo(grammar);

    expect(polygen(grammar, { seed: first.resolvedSeed })).toBe(first.text);
  });

  it("supports assign bindings as memoized values", () => {
    const output = polygen("S ::= X X; X := one | two;", { seed: 1 });

    expect(output === "one one" || output === "two two").toBe(true);
  });

  it("supports concat and capitalize terminals", () => {
    expect(polygen('S ::= \\ hello ^ "!";')).toBe("Hello!");
  });

  it("supports label filtering at generation time", () => {
    const output = polygen(
      'S ::= Greeting; Greeting ::= formal: "Good day" | casual: "Hi" | "Hello";',
      { labels: ["formal"], seed: 2 }
    );

    expect(["Good day", "Hello"]).toContain(output);
  });

  it("supports explicit label selection", () => {
    const grammar = readFixture("labels-selection.grm");

    expect(["Good day", "Hi"].includes(polygen(grammar))).toBe(true);
  });

  it("throws for malformed explicit label selection", () => {
    expect(() =>
      polygen('S ::= Greeting.missing; Greeting ::= formal: "Good day" | "Hi";')
    ).toThrow(CompileError);
  });

  it("surfaces a warning when unfolding an assignment-bound symbol", () => {
    const result = polygenWithInfo("S ::= >X; X := one | two;", { seed: 1 });

    expect(["one", "two"]).toContain(result.text);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: "unfold-assign",
        severity: "warning"
      })
    ]);
  });

  it("surfaces a warning when unfolding a single-alternative group", () => {
    const result = compileGrammarWithInfo(parseGrammar('S ::= >("hello");'));

    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: "useless-unfold",
        severity: "warning"
      })
    ]);
  });

  it("supports compile and generate as separate steps", () => {
    const compiled = compileGrammar(parseGrammar('S ::= "hello";'));

    expect(
      generateCompiled(compiled, {
        random: { int: () => 0 }
      })
    ).toBe("hello");
  });

  it("prefers terminating alternatives once recursion is active", () => {
    const compiled = compileGrammar(parseGrammar('S ::= S | "done";'));

    expect(
      generateCompiled(compiled, {
        maxExpansions: 10,
        random: { int: () => 0 }
      })
    ).toBe("done");
  });

  it("throws when recursion exhausts the expansion budget", () => {
    const compiled = compileGrammar(parseGrammar("S ::= S;"));

    expect(() =>
      generateCompiled(compiled, {
        maxExpansions: 4,
        random: { int: () => 0 }
      })
    ).toThrow(GenerationError);
  });

  it("generates from the legacy English smoke fixture", () => {
    const grammar = readFixture("legacy-en-test.grm");
    const output = polygen(grammar, { seed: 9 });

    expect(output.length).toBeGreaterThan(0);
  });

  it("supports the legacy unfold fixture from src/test.grm", () => {
    const grammar = readFixture("legacy-src-test.grm");

    expect(polygen(grammar, { seed: 0 })).toBe("ciao y ciao x");
  });

  it("parses a simple grammar", () => {
    const grammar = parseGrammar('S ::= "hello" | Name; Name ::= "world";');

    expect(grammar.declarations).toHaveLength(2);
    expect(grammar.declarations[0]?.type).toBe("bind");
    expect(grammar.declarations[1]?.type).toBe("bind");
  });

  it("parses unicode terminals without sanitation", () => {
    const grammar = parseGrammar(readFixture("multilingual.grm"));
    const declaration = grammar.declarations[0];

    expect(declaration?.type).toBe("bind");
    if (declaration?.type !== "bind") {
      throw new Error("Expected a bind declaration.");
    }
    expect(declaration.production.alternatives).toHaveLength(1);
  });

  it("parses standalone segments", () => {
    const grammar = parseSegment("Adventuringgear | Valuables | Tools");

    expect(grammar.declarations).toHaveLength(1);
  });

  it("expands probability modifiers in productions", () => {
    const grammar = parseGrammar("S ::= +good | bad | --worse;");
    const declaration = grammar.declarations[0];

    expect(declaration?.type).toBe("bind");
    if (declaration?.type !== "bind") {
      throw new Error("Expected a bind declaration.");
    }
    expect(declaration.production.alternatives).toHaveLength(8);
  });

  it("parses optional and grouped subgrammars", () => {
    const grammar = parseGrammar('S ::= ["x"] (T ::= "y"; T);');
    const declaration = grammar.declarations[0];

    expect(declaration?.type).toBe("bind");
    if (declaration?.type !== "bind") {
      throw new Error("Expected a bind declaration.");
    }
    expect(declaration.production.alternatives[0]?.positions).toHaveLength(2);
  });

  it("throws for invalid grammar structure", () => {
    expect(() => parseGrammar('S ::= "hello"')).toThrow(ParserError);
  });

  it("throws for undefined non-terminals during compilation", () => {
    expect(() => compileGrammar(parseGrammar("S ::= Missing;"))).toThrow(
      CompileError
    );
  });

  it("throws for duplicate declarations in the same scope", () => {
    expect(() =>
      compileGrammar(parseGrammar('S ::= "one"; S ::= "two";'))
    ).toThrow(CompileError);
  });

  it("throws for cyclic unfolding", () => {
    expect(() => compileGrammar(parseGrammar("S ::= >S;"))).toThrow(
      CompileError
    );
  });

  it("allows nested scopes to shadow outer declarations", () => {
    expect(polygen('S ::= (S ::= "inner"; >S) | "outer";', { seed: 0 })).toBe(
      "inner"
    );
  });

  it("throws for missing start symbols during generation", () => {
    const compiled = compileGrammar(parseGrammar('S ::= "hello";'));

    expect(() =>
      generateCompiled(compiled, {
        random: { int: () => 0 },
        start: "Missing"
      })
    ).toThrow(GenerationError);
  });

  it("varies across repeated unseeded runs", () => {
    const outputs = new Set(
      Array.from({ length: 12 }, () => polygen("S ::= alpha | beta | gamma;"))
    );

    expect(outputs.size).toBeGreaterThan(1);
  });

  it("parses and generates multiline grammars without normalization", () => {
    const output = polygen(readFixture("multiline.grm"), {
      seed: 3
    });

    expect(["ciao", "hola", "bonjour"]).toContain(output);
  });

  it("generates from a multilingual fixture without input sanitation", () => {
    const output = polygen(readFixture("multilingual.grm"), { seed: 2 });

    expect([
      "Olá mundo",
      "Olá façade",
      "Olá 東京",
      "crème brûlée mundo",
      "crème brûlée façade",
      "crème brûlée 東京",
      "niño mundo",
      "niño façade",
      "niño 東京"
    ]).toContain(output);
  });

  it("tokenizes multiline grammars without newline flattening", () => {
    const tokens = tokenize('S ::= "ciao";\nT ::= "hola";');

    expect(tokens.map((token) => token.kind)).toEqual([
      "nonterm",
      "def",
      "quote",
      "eol",
      "nonterm",
      "def",
      "quote",
      "eol",
      "eof"
    ]);
  });

  it("tokenizes nested comments", () => {
    const tokens = tokenize('(* outer (* inner *) outer *) S ::= "ok";');

    expect(tokens.map((token) => token.kind)).toEqual([
      "nonterm",
      "def",
      "quote",
      "eol",
      "eof"
    ]);
  });

  it("tokenizes unicode bare terms and quoted text", () => {
    const tokens = tokenize('S ::= niño | 東京 | "crème brûlée";');

    expect(tokens[2]?.kind).toBe("term");
    expect(tokens[2]?.value).toBe("niño");
    expect(tokens[4]?.kind).toBe("term");
    expect(tokens[4]?.value).toBe("東京");
    expect(tokens[6]?.kind).toBe("quote");
    expect(tokens[6]?.value).toBe("crème brûlée");
  });

  it("supports legacy quote escapes including octal escapes", () => {
    const tokens = tokenize(readFixture("string-escapes.grm"));
    const quoteToken = tokens.find((token) => token.kind === "quote");

    expect(quoteToken?.value).toBe("line\nAA");
  });

  it("tracks source locations", () => {
    const tokens = tokenize('S ::= "x";\nT ::= "y";');
    const secondRule = tokens.find(
      (token) => token.kind === "nonterm" && token.value === "T"
    );

    expect(secondRule?.range.start.line).toBe(2);
    expect(secondRule?.range.start.column).toBe(1);
  });

  it("throws for unterminated comments", () => {
    expect(() => tokenize("(* unterminated")).toThrow(TokenizerError);
  });

  it("throws for illegal quote escapes", () => {
    expect(() => tokenize('S ::= "\\x";')).toThrow(TokenizerError);
  });

  it("rejects invalid maxExpansions values", () => {
    expect(() =>
      polygen('S ::= "ok";', {
        maxExpansions: 0
      })
    ).toThrow(GenerationError);
  });

  it("rejects invalid seed values", () => {
    expect(() =>
      polygen('S ::= "ok";', {
        seed: Number.NaN
      })
    ).toThrow("seed must be a finite integer.");
  });
});
