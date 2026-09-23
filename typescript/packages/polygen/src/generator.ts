import type {
  CompiledAtom,
  CompiledDeclaration,
  CompiledGrammar,
  CompiledProduction,
  CompiledSequence,
  CompiledTerminalAtom
} from "./compiled";
import type { RandomSource } from "./random";

type RuntimeTerminal = CompiledTerminalAtom["value"];
type LabelSet = Set<string>;
type GeneratorThunk = (
  labels: LabelSet,
  state: GenerationState
) => RuntimeTerminal[];

interface GenerationState {
  activeSymbols: string[];
  expansionsRemaining: number;
  maxExpansions: number;
  symbolCounts: Map<string, number>;
}

export interface GenerateOptions {
  labels?: string[];
  maxExpansions?: number;
  random: RandomSource;
  start?: string;
}

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

export function generateCompiled(
  grammar: CompiledGrammar,
  options: GenerateOptions
): string {
  const labels = new Set(options.labels ?? []);
  const start = options.start ?? "S";
  const state = createGenerationState(options.maxExpansions);
  const env = declare(new Map(), labels, grammar.declarations, options.random);
  const entry = env.get(start);

  if (entry === undefined) {
    throw new GenerationError(`Start symbol '${start}' is not defined.`);
  }

  return post(entry(labels, state));
}

function declare(
  env: Map<string, GeneratorThunk>,
  scopeLabels: LabelSet,
  declarations: CompiledDeclaration[],
  random: RandomSource
): Map<string, GeneratorThunk> {
  const nextEnv = new Map(env);

  for (const declaration of declarations) {
    if (declaration.mode === "def") {
      nextEnv.set(declaration.symbol, (labels, state) =>
        runSymbol(state, declaration.symbol, () =>
          generateProduction(
            nextEnv,
            labels,
            declaration.production,
            random,
            state
          )
        )
      );
      continue;
    }

    let memoized: RuntimeTerminal[] | undefined;
    nextEnv.set(declaration.symbol, (_, state) => {
      if (memoized === undefined) {
        memoized = runSymbol(state, declaration.symbol, () =>
          generateProduction(
            nextEnv,
            scopeLabels,
            declaration.production,
            random,
            state
          )
        );
      }

      return memoized;
    });
  }

  return nextEnv;
}

function generateProduction(
  env: Map<string, GeneratorThunk>,
  labels: LabelSet,
  production: CompiledProduction,
  random: RandomSource,
  state: GenerationState
): RuntimeTerminal[] {
  const eligible =
    labels.size === 0
      ? production.alternatives
      : production.alternatives.filter(
          (sequence) =>
            sequence.label === undefined || labels.has(sequence.label)
        );

  if (eligible.length === 0) {
    return ["epsilon"];
  }

  const selected = selectSequence(
    preferTerminatingSequences(eligible, state),
    random
  );
  return generateSequence(env, labels, selected, random, state);
}

function selectSequence(
  sequences: CompiledSequence[],
  random: RandomSource
): CompiledSequence {
  if (sequences.length === 1) {
    const only = sequences[0];

    if (only === undefined) {
      throw new GenerationError("Cannot select from an empty sequence list.");
    }

    only.visits += 1;
    return only;
  }

  const sorted = [...sequences].sort(
    (left, right) => left.visits - right.visits
  );
  const maxVisits = sorted[sorted.length - 1]?.visits ?? 0;
  const total = sorted.reduce(
    (sum, sequence) => sum + (maxVisits - sequence.visits + 1),
    0
  );

  let remaining = random.int(total);

  for (const sequence of sorted) {
    remaining -= maxVisits - sequence.visits + 1;

    if (remaining < 0) {
      sequence.visits += 1;
      return sequence;
    }
  }

  const fallback = sorted[sorted.length - 1] as CompiledSequence;
  fallback.visits += 1;
  return fallback;
}

function generateSequence(
  env: Map<string, GeneratorThunk>,
  labels: LabelSet,
  sequence: CompiledSequence,
  random: RandomSource,
  state: GenerationState
): RuntimeTerminal[] {
  return sequence.atoms.flatMap((atom) =>
    generateAtom(env, labels, atom, random, state)
  );
}

function generateAtom(
  env: Map<string, GeneratorThunk>,
  labels: LabelSet,
  atom: CompiledAtom,
  random: RandomSource,
  state: GenerationState
): RuntimeTerminal[] {
  switch (atom.type) {
    case "compiled-terminal":
      return [atom.value];

    case "compiled-nonterm": {
      const symbol = atom.path[atom.path.length - 1];
      const entry = symbol === undefined ? undefined : env.get(symbol);

      if (entry === undefined) {
        throw new GenerationError(
          `Undefined non-terminal '${symbol ?? "<missing>"}'.`
        );
      }

      return entry(labels, state);
    }

    case "compiled-select":
      return atom.label === undefined
        ? generateAtom(env, new Set(), atom.target, random, state)
        : generateAtom(
            env,
            new Set([...labels, atom.label]),
            atom.target,
            random,
            state
          );

    case "compiled-multiselect": {
      const label = atom.labels[random.int(atom.labels.length)] as string;
      return generateAtom(
        env,
        new Set([...labels, label]),
        atom.target,
        random,
        state
      );
    }

    case "compiled-subgrammar": {
      const scoped = declare(env, labels, atom.declarations, random);
      return generateProduction(scoped, labels, atom.production, random, state);
    }

    case "compiled-repeat": {
      const scoped = declare(env, labels, atom.declarations, random);
      const output = generateProduction(
        scoped,
        labels,
        atom.production,
        random,
        state
      );

      while (random.int(2) === 1) {
        output.push(
          ...generateProduction(scoped, labels, atom.production, random, state)
        );
      }

      return output;
    }
  }
}

function createGenerationState(
  maxExpansions: number | undefined
): GenerationState {
  const normalized = maxExpansions ?? 10_000;

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new GenerationError("maxExpansions must be a positive integer.");
  }

  return {
    activeSymbols: [],
    expansionsRemaining: normalized,
    maxExpansions: normalized,
    symbolCounts: new Map()
  };
}

function runSymbol<T>(
  state: GenerationState,
  symbol: string,
  callback: () => T
): T {
  if (state.expansionsRemaining <= 0) {
    throw new GenerationError(
      `Generation exceeded ${state.maxExpansions} symbol expansions. The grammar may be non-terminating.`
    );
  }

  state.expansionsRemaining -= 1;
  state.activeSymbols.push(symbol);
  state.symbolCounts.set(symbol, (state.symbolCounts.get(symbol) ?? 0) + 1);

  try {
    return callback();
  } finally {
    state.activeSymbols.pop();
    const nextCount = (state.symbolCounts.get(symbol) ?? 1) - 1;

    if (nextCount <= 0) {
      state.symbolCounts.delete(symbol);
    } else {
      state.symbolCounts.set(symbol, nextCount);
    }
  }
}

function preferTerminatingSequences(
  sequences: CompiledSequence[],
  state: GenerationState
): CompiledSequence[] {
  if (!hasActiveRecursion(state) || sequences.length < 2) {
    return sequences;
  }

  const activeSymbols = new Set(state.activeSymbols);
  const scored = sequences.map((sequence) => ({
    score: scoreSequenceRecursion(sequence, activeSymbols),
    sequence
  }));
  const minScore = Math.min(...scored.map((entry) => entry.score));

  return scored
    .filter((entry) => entry.score === minScore)
    .map((entry) => entry.sequence);
}

function hasActiveRecursion(state: GenerationState): boolean {
  for (const count of state.symbolCounts.values()) {
    if (count > 1) {
      return true;
    }
  }

  return false;
}

function scoreSequenceRecursion(
  sequence: CompiledSequence,
  activeSymbols: Set<string>
): number {
  return sequence.atoms.reduce(
    (score, atom) => score + scoreAtomRecursion(atom, activeSymbols),
    0
  );
}

function scoreAtomRecursion(
  atom: CompiledAtom,
  activeSymbols: Set<string>
): number {
  switch (atom.type) {
    case "compiled-terminal":
      return 0;

    case "compiled-nonterm": {
      const symbol = atom.path[atom.path.length - 1];
      return symbol !== undefined && activeSymbols.has(symbol) ? 1 : 0;
    }

    case "compiled-select":
      return scoreAtomRecursion(atom.target, activeSymbols);

    case "compiled-multiselect":
      return scoreAtomRecursion(atom.target, activeSymbols);

    case "compiled-subgrammar":
    case "compiled-repeat":
      return scoreProductionRecursion(atom.production, activeSymbols);
  }
}

function scoreProductionRecursion(
  production: CompiledProduction,
  activeSymbols: Set<string>
): number {
  if (production.alternatives.length === 0) {
    return 0;
  }

  return Math.min(
    ...production.alternatives.map((sequence) =>
      scoreSequenceRecursion(sequence, activeSymbols)
    )
  );
}

function post(tokens: RuntimeTerminal[]): string {
  return postRec(tokens, (value) => value, "");
}

function postRec(
  tokens: RuntimeTerminal[],
  capitalize: (value: string) => string,
  spacing: string
): string {
  const [first, ...rest] = tokens;

  if (first === undefined) {
    return "";
  }

  if (first === "epsilon") {
    return postRec(rest, capitalize, spacing);
  }

  if (first === "concat") {
    return postRec(rest, capitalize, "");
  }

  if (first === "capitalize") {
    return postRec(rest, (value) => capitalizeAscii(value), spacing);
  }

  return spacing + capitalize(first) + postRec(rest, (value) => value, " ");
}

function capitalizeAscii(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
