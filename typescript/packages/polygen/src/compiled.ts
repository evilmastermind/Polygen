import type { SourceRange } from "./tokenizer";

export type CompiledAtom =
  | CompiledMultiselectAtom
  | CompiledNonterminalAtom
  | CompiledRepeatAtom
  | CompiledSelectAtom
  | CompiledSubgrammarAtom
  | CompiledTerminalAtom;

export interface CompiledGrammar {
  declarations: CompiledDeclaration[];
  range: SourceRange;
  type: "compiled-grammar";
}

export interface CompiledDeclaration {
  mode: "assign" | "def";
  production: CompiledProduction;
  symbol: string;
  type: "compiled-bind";
}

export interface CompiledProduction {
  alternatives: CompiledSequence[];
  type: "compiled-production";
}

export interface CompiledSequence {
  atoms: CompiledAtom[];
  label?: string;
  visits: number;
}

export interface CompiledTerminalAtom {
  type: "compiled-terminal";
  value: "capitalize" | "concat" | "epsilon" | string;
}

export interface CompiledNonterminalAtom {
  path: string[];
  type: "compiled-nonterm";
}

export interface CompiledSelectAtom {
  label?: string;
  target: CompiledAtom;
  type: "compiled-select";
}

export interface CompiledMultiselectAtom {
  labels: string[];
  target: CompiledAtom;
  type: "compiled-multiselect";
}

export interface CompiledSubgrammarAtom {
  declarations: CompiledDeclaration[];
  production: CompiledProduction;
  type: "compiled-subgrammar";
}

export interface CompiledRepeatAtom {
  declarations: CompiledDeclaration[];
  production: CompiledProduction;
  type: "compiled-repeat";
}
