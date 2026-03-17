const IDENTIFIER_CONTINUE = /^(?:[\p{L}\p{M}\p{Nd}]|')$/u;
const LABEL_CONTINUE = /^(?:[\p{L}\p{M}\p{Nd}]|_)$/u;
const LOWERCASE_OR_UNCASED = /^(?:\p{Ll}|\p{Lm}|\p{Lo}|\p{Nd}|')$/u;
const UPPERCASE_OR_TITLECASE = /^(?:\p{Lu}|\p{Lt})$/u;

export type TokenKind =
  | "assign"
  | "as"
  | "backslash"
  | "bra"
  | "cap"
  | "cbra"
  | "cket"
  | "colon"
  | "comma"
  | "def"
  | "dot"
  | "dotbra"
  | "dotlabel"
  | "eof"
  | "eol"
  | "gt"
  | "gtgt"
  | "import"
  | "ket"
  | "lt"
  | "ltlt"
  | "minus"
  | "nonterm"
  | "pipe"
  | "plus"
  | "quote"
  | "slash"
  | "sqbra"
  | "sqket"
  | "star"
  | "term"
  | "underscore";

export interface SourcePosition {
  column: number;
  line: number;
  offset: number;
}

export interface SourceRange {
  end: SourcePosition;
  start: SourcePosition;
}

export interface Token {
  kind: TokenKind;
  lexeme: string;
  range: SourceRange;
  value?: string;
}

export class TokenizerError extends Error {
  readonly range: SourceRange;

  constructor(message: string, range: SourceRange) {
    super(message);
    this.name = "TokenizerError";
    this.range = range;
  }
}

interface Cursor {
  column: number;
  line: number;
  offset: number;
}

const KEYWORDS = new Map<string, TokenKind>([
  ["as", "as"],
  ["import", "import"]
]);

const MULTI_CHAR_TOKENS: Array<[string, TokenKind]> = [
  ["::=", "def"],
  [":=", "assign"],
  [">>", "gtgt"],
  ["<<", "ltlt"],
  [".(", "dotbra"]
];

const SINGLE_CHAR_TOKENS = new Map<string, TokenKind>([
  [";", "eol"],
  [":", "colon"],
  ["(", "bra"],
  [")", "ket"],
  ["[", "sqbra"],
  ["]", "sqket"],
  ["|", "pipe"],
  [">", "gt"],
  ["<", "lt"],
  ["{", "cbra"],
  ["}", "cket"],
  ["*", "star"],
  ["+", "plus"],
  ["-", "minus"],
  ["^", "cap"],
  ["_", "underscore"],
  [".", "dot"],
  [",", "comma"],
  ["\\", "backslash"],
  ["/", "slash"]
]);

export function tokenize(input: string): Token[] {
  const tokenizer = new Tokenizer(input);
  return tokenizer.tokenize();
}

class Tokenizer {
  private readonly input: string;
  private index = 0;
  private readonly cursor: Cursor = { column: 1, line: 1, offset: 0 };

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      this.skipTrivia();

      if (this.isAtEnd()) {
        break;
      }

      tokens.push(this.readToken());
    }

    const eofPosition = this.snapshot();
    tokens.push({
      kind: "eof",
      lexeme: "",
      range: {
        end: eofPosition,
        start: eofPosition
      }
    });

    return tokens;
  }

  private readToken(): Token {
    const start = this.snapshot();

    for (const [lexeme, kind] of MULTI_CHAR_TOKENS) {
      if (this.input.startsWith(lexeme, this.index)) {
        this.advanceBy(lexeme);
        return this.createToken(kind, lexeme, start, this.snapshot());
      }
    }

    if (this.peek() === "." && this.isLabelStart(this.peek(1))) {
      this.advance();
      let lexeme = ".";

      while (this.isLabelContinue(this.peek())) {
        lexeme += this.advance();
      }

      return this.createToken(
        "dotlabel",
        lexeme,
        start,
        this.snapshot(),
        lexeme.slice(1)
      );
    }

    if (this.peek() === '"') {
      return this.readQuotedToken(start);
    }

    const single = SINGLE_CHAR_TOKENS.get(this.peek());

    if (single !== undefined) {
      const lexeme = this.advance();
      return this.createToken(single, lexeme, start, this.snapshot());
    }

    if (this.isNonterminalStart(this.peek())) {
      return this.readIdentifierToken(start, "nonterm");
    }

    if (this.isTermStart(this.peek())) {
      return this.readIdentifierToken(start, "term");
    }

    throw new TokenizerError(
      `Illegal character ${JSON.stringify(this.peek())}.`,
      { end: this.snapshot(), start }
    );
  }

  private readIdentifierToken(
    start: SourcePosition,
    fallbackKind: "term" | "nonterm"
  ): Token {
    let lexeme = this.advance();

    while (this.isIdentifierContinue(this.peek())) {
      lexeme += this.advance();
    }

    const keywordKind =
      fallbackKind === "term" ? KEYWORDS.get(lexeme) : undefined;
    const kind = keywordKind ?? fallbackKind;

    return this.createToken(kind, lexeme, start, this.snapshot(), lexeme);
  }

  private readQuotedToken(start: SourcePosition): Token {
    let lexeme = this.advance();
    let value = "";

    while (!this.isAtEnd()) {
      const character = this.peek();

      if (character === '"') {
        lexeme += this.advance();
        return this.createToken("quote", lexeme, start, this.snapshot(), value);
      }

      if (character === "\\") {
        lexeme += this.advance();
        const escaped = this.readEscapeSequence(start);
        lexeme += escaped.lexeme;
        value += escaped.value;
        continue;
      }

      if (character === "\n" || character === "\r") {
        throw new TokenizerError("Unterminated quoted string.", {
          end: this.snapshot(),
          start
        });
      }

      lexeme += this.advance();
      value += character;
    }

    throw new TokenizerError("Unterminated quoted string.", {
      end: this.snapshot(),
      start
    });
  }

  private readEscapeSequence(start: SourcePosition): {
    lexeme: string;
    value: string;
  } {
    if (this.isAtEnd()) {
      throw new TokenizerError("Unterminated escape sequence.", {
        end: this.snapshot(),
        start
      });
    }

    const next = this.advance();

    switch (next) {
      case '"':
        return { lexeme: next, value: '"' };
      case "\\":
        return { lexeme: next, value: "\\" };
      case "n":
        return { lexeme: next, value: "\n" };
      case "r":
        return { lexeme: next, value: "\r" };
      case "b":
        return { lexeme: next, value: "\b" };
      case "t":
        return { lexeme: next, value: "\t" };
      default:
        if (
          this.isDigit(next) &&
          this.isDigit(this.peek()) &&
          this.isDigit(this.peek(1))
        ) {
          const digitTwo = this.advance();
          const digitThree = this.advance();
          const lexeme = `${next}${digitTwo}${digitThree}`;
          const value = String.fromCharCode(Number.parseInt(lexeme, 10));
          return { lexeme, value };
        }

        throw new TokenizerError(`Illegal escape sequence \\${next}.`, {
          end: this.snapshot(),
          start
        });
    }
  }

  private skipTrivia(): void {
    while (!this.isAtEnd()) {
      if (this.peek() === " " || this.peek() === "\t") {
        this.advance();
        continue;
      }

      if (this.peek() === "\n") {
        this.advance();
        continue;
      }

      if (this.peek() === "\r" && this.peek(1) === "\n") {
        this.advance();
        this.advance();
        continue;
      }

      if (this.peek() === "(" && this.peek(1) === "*") {
        this.consumeComment();
        continue;
      }

      break;
    }
  }

  private consumeComment(): void {
    let depth = 0;

    while (!this.isAtEnd()) {
      if (this.peek() === "(" && this.peek(1) === "*") {
        this.advance();
        this.advance();
        depth += 1;
        continue;
      }

      if (this.peek() === "*" && this.peek(1) === ")") {
        this.advance();
        this.advance();
        depth -= 1;

        if (depth === 0) {
          return;
        }

        continue;
      }

      this.advance();
    }

    throw new TokenizerError("Unterminated comment.", {
      end: this.snapshot(),
      start: this.snapshot()
    });
  }

  private createToken(
    kind: TokenKind,
    lexeme: string,
    start: SourcePosition,
    end: SourcePosition,
    value?: string
  ): Token {
    return value === undefined
      ? { kind, lexeme, range: { end, start } }
      : { kind, lexeme, range: { end, start }, value };
  }

  private snapshot(): SourcePosition {
    return {
      column: this.cursor.column,
      line: this.cursor.line,
      offset: this.cursor.offset
    };
  }

  private advanceBy(text: string): void {
    for (const character of text) {
      this.advanceExpected(character);
    }
  }

  private advanceExpected(expected: string): void {
    const actual = this.advance();

    if (actual !== expected) {
      throw new Error(
        `Tokenizer internal error: expected ${expected} but found ${actual}.`
      );
    }
  }

  private advance(): string {
    const character = this.input[this.index] ?? "";
    this.index += 1;
    this.cursor.offset += 1;

    if (character === "\n") {
      this.cursor.line += 1;
      this.cursor.column = 1;
    } else {
      this.cursor.column += 1;
    }

    return character;
  }

  private peek(offset = 0): string {
    return this.input[this.index + offset] ?? "";
  }

  private isAtEnd(): boolean {
    return this.index >= this.input.length;
  }

  private isDigit(character: string): boolean {
    return character >= "0" && character <= "9";
  }

  private isIdentifierContinue(character: string): boolean {
    return character.length > 0 && IDENTIFIER_CONTINUE.test(character);
  }

  private isLabelContinue(character: string): boolean {
    return character.length > 0 && LABEL_CONTINUE.test(character);
  }

  private isLabelStart(character: string): boolean {
    return this.isLabelContinue(character) && character !== "_";
  }

  private isNonterminalStart(character: string): boolean {
    return character.length > 0 && UPPERCASE_OR_TITLECASE.test(character);
  }

  private isTermStart(character: string): boolean {
    return character.length > 0 && LOWERCASE_OR_UNCASED.test(character);
  }
}
