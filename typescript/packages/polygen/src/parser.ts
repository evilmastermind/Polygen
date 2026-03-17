import type {
  Atom,
  BindDeclaration,
  Declaration,
  Grammar,
  GroupAtom,
  GroupMode,
  LockAtom,
  MultiselectAtom,
  NonterminalAtom,
  NonterminalPath,
  Production,
  SelectAtom,
  Sequence,
  TerminalAtom,
  UnfoldAtom
} from "./ast";
import { createSegmentGrammar } from "./segment";
import {
  tokenize,
  type SourceRange,
  type Token,
  type TokenKind,
  TokenizerError
} from "./tokenizer";

export class ParserError extends Error {
  readonly range: SourceRange;

  constructor(message: string, range: SourceRange) {
    super(message);
    this.name = "ParserError";
    this.range = range;
  }
}

export function parseGrammar(source: string): Grammar {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  return parser.parseGrammar();
}

export function parseSegment(segment: string, start = "S"): Grammar {
  return parseGrammar(createSegmentGrammar(segment, { start }));
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parseGrammar(): Grammar {
    const start = this.peek();
    const declarations: Declaration[] = [];

    while (!this.check("eof")) {
      declarations.push(this.parseDeclaration());
      this.expect("eol", "Expected ';' after declaration.");
    }

    const end = this.expect("eof", "Expected end of grammar.");

    if (declarations.length === 0) {
      throw new ParserError(
        "Grammar must contain at least one declaration.",
        end.range
      );
    }

    return {
      declarations,
      range: { end: end.range.end, start: start.range.start },
      type: "grammar"
    };
  }

  private parseDeclaration(): Declaration {
    const start = this.peek();

    if (this.check("import")) {
      this.advance();
      const file = this.expect("quote", "Expected quoted import path.");
      this.expect("as", "Expected 'as' in import declaration.");
      const alias = this.expect(
        "nonterm",
        "Expected non-terminal alias after 'as'."
      );

      return {
        alias: this.requireValue(alias),
        range: { end: alias.range.end, start: start.range.start },
        source: this.requireValue(file),
        type: "import"
      };
    }

    const symbol = this.expect(
      "nonterm",
      "Expected non-terminal declaration head."
    );
    const modeToken = this.advance();

    if (modeToken.kind !== "def" && modeToken.kind !== "assign") {
      throw new ParserError(
        "Expected '::=' or ':=' after non-terminal name.",
        modeToken.range
      );
    }

    const declaration: BindDeclaration = {
      mode: modeToken.kind,
      production: this.parseProduction(),
      range: { end: symbol.range.end, start: start.range.start },
      symbol: this.requireValue(symbol),
      type: "bind"
    };
    declaration.range = {
      end: declaration.production.range.end,
      start: start.range.start
    };
    return declaration;
  }

  private parseProduction(): Production {
    const start = this.peek();
    const weightedSequences: Array<{ modifier: number; sequence: Sequence }> =
      [];

    weightedSequences.push(this.parseModifiedSequence());

    while (this.match("pipe")) {
      weightedSequences.push(this.parseModifiedSequence());
    }

    const alternatives = expandWeighted(weightedSequences);
    const end =
      alternatives[alternatives.length - 1]?.range.end ?? start.range.end;

    return {
      alternatives,
      range: { end, start: start.range.start },
      type: "production"
    };
  }

  private parseModifiedSequence(): { modifier: number; sequence: Sequence } {
    let modifier = 0;

    while (this.check("plus") || this.check("minus")) {
      modifier += this.advance().kind === "plus" ? 1 : -1;
    }

    return {
      modifier,
      sequence: this.parseSequence()
    };
  }

  private parseSequence(): Sequence {
    const start = this.peek();
    let label: string | undefined;

    if (
      (this.check("nonterm") || this.check("term")) &&
      this.peek(1).kind === "colon"
    ) {
      label = this.requireValue(this.advance());
      this.advance();
    }

    const positions: Atom[][] = [];
    positions.push(this.parseAtoms());

    while (this.isAtomStart(this.peek().kind)) {
      positions.push(this.parseAtoms());
    }

    const lastGroup = positions[positions.length - 1];
    const lastAtom = lastGroup?.[lastGroup.length - 1];
    const end = lastAtom?.range.end ?? start.range.end;

    return label === undefined
      ? {
          positions,
          range: { end, start: start.range.start },
          type: "sequence"
        }
      : {
          label,
          positions,
          range: { end, start: start.range.start },
          type: "sequence"
        };
  }

  private parseAtoms(): Atom[] {
    const atoms = [this.parseAtom()];

    while (this.match("comma")) {
      atoms.push(this.parseAtom());
    }

    return atoms;
  }

  private parseAtom(): Atom {
    const start = this.peek();
    let atom = this.parseAtomBase();

    while (true) {
      if (this.match("dot")) {
        const next = this.previous();
        atom = this.makeSelect(
          atom,
          undefined,
          start.range.start,
          next.range.end
        );
        continue;
      }

      if (this.check("dotlabel")) {
        const token = this.advance();
        atom = this.makeSelect(
          atom,
          this.requireValue(token),
          start.range.start,
          token.range.end
        );
        continue;
      }

      if (this.match("dotbra")) {
        const labels = this.parseLabels();
        const end = this.expect(
          "ket",
          "Expected ')' after multi-select labels."
        );
        atom = this.makeMultiselect(
          atom,
          labels,
          start.range.start,
          end.range.end
        );
        continue;
      }

      break;
    }

    return atom;
  }

  private parseAtomBase(): Atom {
    if (
      this.check("term") ||
      this.check("quote") ||
      this.check("import") ||
      this.check("as")
    ) {
      return this.makeTerminal(this.parseTermValue(), this.previous().range);
    }

    if (this.match("cap")) {
      return this.makeTerminal("concat", this.previous().range);
    }

    if (this.match("underscore")) {
      return this.makeTerminal("epsilon", this.previous().range);
    }

    if (this.match("backslash")) {
      return this.makeTerminal("capitalize", this.previous().range);
    }

    if (this.match("gt")) {
      const target = this.parseUnfoldable();
      return this.makeUnfold(
        target,
        this.previous().range.start,
        target.range.end
      );
    }

    if (this.match("lt")) {
      const target = this.parseUnfoldable();
      return this.makeLock(
        target,
        this.previous().range.start,
        target.range.end
      );
    }

    return this.parseUnfoldable();
  }

  private parseUnfoldable(): GroupAtom | NonterminalAtom {
    const start = this.peek();

    if (this.check("nonterm")) {
      const path = this.parsePath();
      const end = this.previous();

      return {
        path,
        range: { end: end.range.end, start: start.range.start },
        type: "nonterm"
      };
    }

    if (this.match("bra")) {
      const sub = this.parseSub();
      const close = this.expect("ket", "Expected ')' to close subgrammar.");

      if (this.match("plus")) {
        return this.makeGroup(
          "repeat-one-or-more",
          sub.declarations,
          sub.production,
          start.range.start,
          this.previous().range.end
        );
      }

      return this.makeGroup(
        "std",
        sub.declarations,
        sub.production,
        start.range.start,
        close.range.end
      );
    }

    if (this.match("sqbra")) {
      const sub = this.parseSub();
      const close = this.expect(
        "sqket",
        "Expected ']' to close optional subgrammar."
      );

      return this.makeGroup(
        "optional",
        sub.declarations,
        sub.production,
        start.range.start,
        close.range.end
      );
    }

    if (this.match("cbra")) {
      const sub = this.parseSub();
      const close = this.expect(
        "cket",
        "Expected '}' to close mobile subgrammar."
      );

      return this.makeGroup(
        "mob",
        sub.declarations,
        sub.production,
        start.range.start,
        close.range.end
      );
    }

    if (this.match("gtgt")) {
      const sub = this.parseSub();
      const close = this.expect(
        "ltlt",
        "Expected '<<' to close deep unfold subgrammar."
      );

      return this.makeGroup(
        "deep-unfold",
        sub.declarations,
        sub.production,
        start.range.start,
        close.range.end
      );
    }

    throw new ParserError(
      "Expected terminal or unfoldable expression.",
      start.range
    );
  }

  private parseSub(): { declarations: Declaration[]; production: Production } {
    const declarations: Declaration[] = [];

    while (this.looksLikeDeclaration()) {
      declarations.push(this.parseDeclaration());
      this.expect("eol", "Expected ';' after local declaration.");
    }

    return {
      declarations,
      production: this.parseProduction()
    };
  }

  private parsePath(): NonterminalPath {
    const segments = [
      this.requireValue(this.expect("nonterm", "Expected non-terminal path."))
    ];

    while (this.match("slash")) {
      segments.push(
        this.requireValue(
          this.expect("nonterm", "Expected non-terminal path segment.")
        )
      );
    }

    return { segments };
  }

  private parseLabels(): string[] {
    const weightedLabels: Array<{ modifier: number; sequence: string }> = [];
    weightedLabels.push(this.parseModifiedLabel());

    while (this.match("pipe")) {
      weightedLabels.push(this.parseModifiedLabel());
    }

    return expandWeighted(weightedLabels);
  }

  private parseModifiedLabel(): { modifier: number; sequence: string } {
    let modifier = 0;

    while (this.check("plus") || this.check("minus")) {
      modifier += this.advance().kind === "plus" ? 1 : -1;
    }

    return {
      modifier,
      sequence: this.parseLabelValue()
    };
  }

  private parseLabelValue(): string {
    if (this.check("nonterm") || this.check("term")) {
      return this.requireValue(this.advance());
    }

    throw new ParserError("Expected label name.", this.peek().range);
  }

  private parseTermValue(): string {
    if (this.check("term") || this.check("quote")) {
      return this.requireValue(this.advance());
    }

    if (this.match("import")) {
      return "import";
    }

    if (this.match("as")) {
      return "as";
    }

    throw new ParserError("Expected terminal value.", this.peek().range);
  }

  private looksLikeDeclaration(): boolean {
    if (this.check("nonterm")) {
      return this.peek(1).kind === "def" || this.peek(1).kind === "assign";
    }

    return (
      this.check("import") &&
      this.peek(1).kind === "quote" &&
      this.peek(2).kind === "as" &&
      this.peek(3).kind === "nonterm"
    );
  }

  private isAtomStart(kind: TokenKind): boolean {
    return (
      kind === "as" ||
      kind === "backslash" ||
      kind === "bra" ||
      kind === "cap" ||
      kind === "cbra" ||
      kind === "gt" ||
      kind === "gtgt" ||
      kind === "import" ||
      kind === "lt" ||
      kind === "nonterm" ||
      kind === "quote" ||
      kind === "sqbra" ||
      kind === "term" ||
      kind === "underscore"
    );
  }

  private makeTerminal(
    value: TerminalAtom["value"],
    range: SourceRange
  ): TerminalAtom {
    return { range, type: "terminal", value };
  }

  private makeSelect(
    target: Atom,
    label: string | undefined,
    start: SourceRange["start"],
    end: SourceRange["end"]
  ): SelectAtom {
    return label === undefined
      ? { range: { end, start }, target, type: "select" }
      : { label, range: { end, start }, target, type: "select" };
  }

  private makeMultiselect(
    target: Atom,
    labels: string[],
    start: SourceRange["start"],
    end: SourceRange["end"]
  ): MultiselectAtom {
    return { labels, range: { end, start }, target, type: "multiselect" };
  }

  private makeUnfold(
    target: GroupAtom | NonterminalAtom,
    start: SourceRange["start"],
    end: SourceRange["end"]
  ): UnfoldAtom {
    return { range: { end, start }, target, type: "unfold" };
  }

  private makeLock(
    target: GroupAtom | NonterminalAtom,
    start: SourceRange["start"],
    end: SourceRange["end"]
  ): LockAtom {
    return { range: { end, start }, target, type: "lock" };
  }

  private makeGroup(
    mode: GroupMode,
    declarations: Declaration[],
    production: Production,
    start: SourceRange["start"],
    end: SourceRange["end"]
  ): GroupAtom {
    return {
      declarations,
      mode,
      production,
      range: { end, start },
      type: "group"
    };
  }

  private requireValue(token: Token): string {
    if (token.value === undefined) {
      throw new ParserError(
        `Token ${token.kind} does not carry a value.`,
        token.range
      );
    }

    return token.value;
  }

  private check(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  private match(kind: TokenKind): boolean {
    if (!this.check(kind)) {
      return false;
    }

    this.advance();
    return true;
  }

  private expect(kind: TokenKind, message: string): Token {
    if (!this.check(kind)) {
      throw new ParserError(message, this.peek().range);
    }

    return this.advance();
  }

  private advance(): Token {
    const token = this.tokens[this.index];

    if (token === undefined) {
      throw new ParserError(
        "Unexpected end of token stream.",
        this.previous().range
      );
    }

    this.index += 1;
    return token;
  }

  private previous(): Token {
    return this.tokens[Math.max(0, this.index - 1)] as Token;
  }

  private peek(offset = 0): Token {
    return this.tokens[
      Math.min(this.index + offset, this.tokens.length - 1)
    ] as Token;
  }
}

function expandWeighted<T>(
  entries: Array<{ modifier: number; sequence: T }>
): T[] {
  if (entries.length === 0) {
    return [];
  }

  const baseline = Math.min(...entries.map((entry) => entry.modifier));
  const expanded: T[] = [];

  for (const entry of entries) {
    const count = entry.modifier - baseline + 1;

    for (let index = 0; index < count; index += 1) {
      expanded.push(entry.sequence);
    }
  }

  return expanded;
}

export { TokenizerError };
