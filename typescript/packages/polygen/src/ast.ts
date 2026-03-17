import type { SourceRange } from "./tokenizer";

export type BindMode = "assign" | "def";
export type GroupMode =
  | "deep-unfold"
  | "mob"
  | "optional"
  | "repeat-one-or-more"
  | "std";
export type TerminalValue = "capitalize" | "concat" | "epsilon" | string;

export interface Grammar {
  declarations: Declaration[];
  range: SourceRange;
  type: "grammar";
}

export type Declaration = BindDeclaration | ImportDeclaration;

export interface BindDeclaration {
  mode: BindMode;
  production: Production;
  range: SourceRange;
  symbol: string;
  type: "bind";
}

export interface ImportDeclaration {
  alias: string;
  range: SourceRange;
  source: string;
  type: "import";
}

export interface Production {
  alternatives: Sequence[];
  range: SourceRange;
  type: "production";
}

export interface Sequence {
  label?: string;
  positions: Atom[][];
  range: SourceRange;
  type: "sequence";
}

export type Atom =
  | GroupAtom
  | LockAtom
  | MultiselectAtom
  | NonterminalAtom
  | SelectAtom
  | TerminalAtom
  | UnfoldAtom;

export interface TerminalAtom {
  range: SourceRange;
  type: "terminal";
  value: TerminalValue;
}

export interface NonterminalPath {
  segments: string[];
}

export interface NonterminalAtom {
  path: NonterminalPath;
  range: SourceRange;
  type: "nonterm";
}

export interface SelectAtom {
  label?: string;
  range: SourceRange;
  target: Atom;
  type: "select";
}

export interface MultiselectAtom {
  labels: string[];
  range: SourceRange;
  target: Atom;
  type: "multiselect";
}

export interface UnfoldAtom {
  range: SourceRange;
  target: GroupAtom | NonterminalAtom;
  type: "unfold";
}

export interface LockAtom {
  range: SourceRange;
  target: GroupAtom | NonterminalAtom;
  type: "lock";
}

export interface GroupAtom {
  declarations: Declaration[];
  mode: GroupMode;
  production: Production;
  range: SourceRange;
  type: "group";
}
