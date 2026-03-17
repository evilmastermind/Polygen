export type {
  Atom,
  BindDeclaration,
  BindMode,
  Declaration,
  Grammar,
  GroupAtom,
  GroupMode,
  ImportDeclaration,
  LockAtom,
  MultiselectAtom,
  NonterminalAtom,
  NonterminalPath,
  Production,
  SelectAtom,
  Sequence,
  TerminalAtom,
  TerminalValue,
  UnfoldAtom
} from "./ast";
export type {
  CompiledAtom,
  CompiledDeclaration,
  CompiledGrammar,
  CompiledProduction,
  CompiledSequence,
  CompiledTerminalAtom
} from "./compiled";
export {
  compileGrammar,
  compileGrammarWithInfo,
  CompileError,
  type CompileResult,
  type CompileWarning,
  type CompileWarningCode
} from "./compile";
export {
  generateCompiled,
  GenerationError,
  type GenerateOptions
} from "./generator";
export { parseGrammar, parseSegment, ParserError } from "./parser";
import { compileGrammarWithInfo, type CompileWarning } from "./compile";
import { generateCompiled } from "./generator";
import { parseGrammar } from "./parser";
import { createSegmentGrammar } from "./segment";
import { createRandomSource } from "./random";
export {
  createRandomSource,
  type RandomInfo,
  type RandomSource
} from "./random";
export { createSegmentGrammar, type SegmentOptions } from "./segment";
export {
  tokenize,
  TokenizerError,
  type SourcePosition,
  type SourceRange,
  type Token,
  type TokenKind
} from "./tokenizer";

export interface PolygenOptions {
  labels?: string[];
  maxExpansions?: number;
  seed?: number;
  start?: string;
}

export interface PolygenResult {
  resolvedSeed: number;
  text: string;
  warnings: CompileWarning[];
}

export function polygen(grammar: string, options: PolygenOptions = {}): string {
  return polygenWithInfo(grammar, options).text;
}

export function polygenWithInfo(
  grammar: string,
  options: PolygenOptions = {}
): PolygenResult {
  const parsed = parseGrammar(grammar);
  const compilation = compileGrammarWithInfo(parsed);
  const random = createRandomSource(options.seed);
  const generateOptions = {
    random: random.random
  } as {
    labels?: string[];
    maxExpansions?: number;
    random: typeof random.random;
    start?: string;
  };

  if (options.labels !== undefined) {
    generateOptions.labels = options.labels;
  }

  if (options.start !== undefined) {
    generateOptions.start = options.start;
  }

  if (options.maxExpansions !== undefined) {
    generateOptions.maxExpansions = options.maxExpansions;
  }

  return {
    resolvedSeed: random.resolvedSeed,
    text: generateCompiled(compilation.compiled, generateOptions),
    warnings: compilation.warnings
  };
}

export function polygenSegment(
  segment: string,
  options: PolygenOptions = {}
): string {
  return polygenSegmentWithInfo(segment, options).text;
}

export function polygenSegmentWithInfo(
  segment: string,
  options: PolygenOptions = {}
): PolygenResult {
  const grammar =
    options.start === undefined
      ? createSegmentGrammar(segment)
      : createSegmentGrammar(segment, { start: options.start });

  return polygenWithInfo(grammar, options);
}
