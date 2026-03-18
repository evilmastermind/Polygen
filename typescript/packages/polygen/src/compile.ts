import type {
  Atom,
  BindDeclaration,
  Declaration,
  Grammar,
  GroupAtom,
  LockAtom,
  MultiselectAtom,
  NonterminalAtom,
  Production,
  SelectAtom,
  Sequence,
  TerminalAtom,
  UnfoldAtom
} from "./ast";
import type {
  CompiledAtom,
  CompiledDeclaration,
  CompiledGrammar,
  CompiledProduction,
  CompiledRepeatAtom,
  CompiledSequence,
  CompiledSubgrammarAtom,
  CompiledTerminalAtom
} from "./compiled";
import type { SourceRange } from "./tokenizer";

type Placement = {
  atom: CompiledAtom;
  mobile: boolean;
};

type SourceEnv = Map<string, BindDeclaration>;

export type CompilePolicyPreset = "compat" | "strict";
export type UndefinedNonterminalPolicy = "error" | "warn-as-terminal";
export type InvalidSelectionLabelPolicy = "error" | "warn-ignore";

export interface CompilePolicy {
  invalidSelectionLabel?: InvalidSelectionLabelPolicy;
  preset?: CompilePolicyPreset;
  undefinedNonterminal?: UndefinedNonterminalPolicy;
}

export type CompileWarningCode =
  | "invalid-label-selection-fallback"
  | "undefined-nonterminal-fallback"
  | "unfold-assign"
  | "useless-unfold";

export interface CompileWarning {
  code: CompileWarningCode;
  message: string;
  range: SourceRange;
  severity: "warning";
}

export interface CompileResult {
  compiled: CompiledGrammar;
  warnings: CompileWarning[];
}

interface CompileContext {
  policy: NormalizedCompilePolicy;
  warnings: CompileWarning[];
}

interface NormalizedCompilePolicy {
  invalidSelectionLabel: InvalidSelectionLabelPolicy;
  preset: CompilePolicyPreset;
  undefinedNonterminal: UndefinedNonterminalPolicy;
}

type SelectionDecision =
  | { type: "clear-active-labels" }
  | { type: "preserve-target" }
  | { label: string; type: "select-label" };

type MultiselectDecision =
  | { type: "preserve-target" }
  | { labels: string[]; type: "select-labels" };

export class CompileError extends Error {
  readonly range: SourceRange;

  constructor(message: string, range: SourceRange) {
    super(message);
    this.name = "CompileError";
    this.range = range;
  }
}

export function compileGrammar(
  grammar: Grammar,
  policy?: CompilePolicy
): CompiledGrammar {
  return compileGrammarWithInfo(grammar, policy).compiled;
}

export function compileGrammarWithInfo(
  grammar: Grammar,
  policy?: CompilePolicy
): CompileResult {
  const context = createCompileContext(policy);
  validateGrammar(grammar, context);
  const env = extendSourceEnv(new Map(), grammar.declarations);

  return {
    compiled: {
      declarations: compileDeclarations(grammar.declarations, env, context),
      range: grammar.range,
      type: "compiled-grammar"
    },
    warnings: context.warnings
  };
}

function createCompileContext(policy?: CompilePolicy): CompileContext {
  return {
    policy: normalizeCompilePolicy(policy),
    warnings: []
  };
}

function normalizeCompilePolicy(
  policy?: CompilePolicy
): NormalizedCompilePolicy {
  const preset = policy?.preset ?? "strict";
  const defaults =
    preset === "compat"
      ? {
          invalidSelectionLabel: "warn-ignore" as const,
          undefinedNonterminal: "warn-as-terminal" as const
        }
      : {
          invalidSelectionLabel: "error" as const,
          undefinedNonterminal: "error" as const
        };

  return {
    invalidSelectionLabel:
      policy?.invalidSelectionLabel ?? defaults.invalidSelectionLabel,
    preset,
    undefinedNonterminal:
      policy?.undefinedNonterminal ?? defaults.undefinedNonterminal
  };
}

function validateGrammar(grammar: Grammar, context: CompileContext): void {
  validateDeclarationScope(grammar.declarations);
  validateUnfoldingDeclarations(
    grammar.declarations,
    extendSourceEnv(new Map(), grammar.declarations),
    [],
    context
  );
}

function validateDeclarationScope(declarations: Declaration[]): void {
  const symbols = new Set<string>();

  for (const declaration of declarations) {
    if (declaration.type !== "bind") {
      continue;
    }

    if (symbols.has(declaration.symbol)) {
      throw new CompileError(
        `Overriding of non-terminal symbol '${declaration.symbol}' is not allowed within the same scope.`,
        declaration.range
      );
    }

    symbols.add(declaration.symbol);
  }
}

function validateUnfoldingDeclarations(
  declarations: Declaration[],
  env: SourceEnv,
  unfoldingPath: string[],
  context: CompileContext
): void {
  for (const declaration of declarations) {
    if (declaration.type !== "bind") {
      continue;
    }

    validateProductionUnfolding(
      declaration.production,
      env,
      unfoldingPath,
      context
    );
  }
}

function validateProductionUnfolding(
  production: Production,
  env: SourceEnv,
  unfoldingPath: string[],
  context: CompileContext
): void {
  for (const sequence of production.alternatives) {
    for (const position of sequence.positions) {
      for (const atom of position) {
        validateAtomUnfolding(atom, env, unfoldingPath, context);
      }
    }
  }
}

function validateAtomUnfolding(
  atom: Atom,
  env: SourceEnv,
  unfoldingPath: string[],
  context: CompileContext
): void {
  switch (atom.type) {
    case "terminal":
    case "nonterm":
      return;

    case "select":
    case "multiselect":
      validateAtomUnfolding(atom.target, env, unfoldingPath, context);
      return;

    case "lock":
      if (atom.target.type === "group") {
        validateGroupUnfolding(atom.target, env, unfoldingPath, context);
      }
      return;

    case "group":
      validateGroupUnfolding(atom, env, unfoldingPath, context);
      return;

    case "unfold":
      validateUnfoldTarget(atom, env, unfoldingPath, context);
      return;
  }
}

function validateGroupUnfolding(
  group: GroupAtom,
  env: SourceEnv,
  unfoldingPath: string[],
  context: CompileContext
): void {
  validateDeclarationScope(group.declarations);
  const localEnv = extendSourceEnv(env, group.declarations);
  validateUnfoldingDeclarations(
    group.declarations,
    localEnv,
    unfoldingPath,
    context
  );
  validateProductionUnfolding(
    group.production,
    localEnv,
    unfoldingPath,
    context
  );
}

function validateUnfoldTarget(
  atom: UnfoldAtom,
  env: SourceEnv,
  unfoldingPath: string[],
  context: CompileContext
): void {
  if (atom.target.type === "group") {
    if (atom.target.production.alternatives.length === 1) {
      addCompileWarning(
        context,
        "useless-unfold",
        "Unfolding a group with a single alternative is unnecessary.",
        atom.range
      );
    }

    validateGroupUnfolding(atom.target, env, unfoldingPath, context);
    return;
  }

  const symbol =
    atom.target.path.segments[atom.target.path.segments.length - 1];

  if (symbol === undefined) {
    return;
  }

  if (unfoldingPath.includes(symbol)) {
    throw new CompileError(
      `Cyclic unfolding of symbol '${symbol}'.`,
      atom.range
    );
  }

  const declaration = env.get(symbol);

  if (declaration === undefined) {
    return;
  }

  if (declaration.mode === "assign") {
    addCompileWarning(
      context,
      "unfold-assign",
      `Unfolding assignment-bound symbol '${symbol}' uses a memoized binding.`,
      atom.range
    );
  }

  validateProductionUnfolding(
    declaration.production,
    env,
    [...unfoldingPath, symbol],
    context
  );
}

function addCompileWarning(
  context: CompileContext,
  code: CompileWarningCode,
  message: string,
  range: SourceRange
): void {
  context.warnings.push({
    code,
    message,
    range,
    severity: "warning"
  });
}

function compileDeclarations(
  declarations: Declaration[],
  env: SourceEnv,
  context: CompileContext
): CompiledDeclaration[] {
  return declarations.map((declaration) =>
    compileDeclaration(declaration, env, context)
  );
}

function compileDeclaration(
  declaration: Declaration,
  env: SourceEnv,
  context: CompileContext
): CompiledDeclaration {
  if (declaration.type === "import") {
    throw new CompileError(
      "Import declarations are not supported yet.",
      declaration.range
    );
  }

  return {
    mode: declaration.mode,
    production: compileProduction(declaration.production, env, context),
    symbol: declaration.symbol,
    type: "compiled-bind"
  };
}

function compileProduction(
  production: Production,
  env: SourceEnv,
  context: CompileContext
): CompiledProduction {
  return {
    alternatives: production.alternatives.flatMap((sequence) =>
      compileSequence(sequence, env, context)
    ),
    type: "compiled-production"
  };
}

function compileSequence(
  sequence: Sequence,
  env: SourceEnv,
  context: CompileContext
): CompiledSequence[] {
  const positionalVariants = resolvePositionalVariants(sequence);
  const compiledSequences: CompiledSequence[] = [];

  for (const atoms of positionalVariants) {
    const placementMatrix = atoms.map((atom) =>
      compileAtom(atom, env, context)
    );
    const placementCombos = combine(placementMatrix);

    for (const combo of placementCombos) {
      const arrangements = arrange(combo);

      for (const arrangedAtoms of arrangements) {
        compiledSequences.push(
          sequence.label === undefined
            ? createCompiledSequence(arrangedAtoms)
            : createCompiledSequence(arrangedAtoms, sequence.label)
        );
      }
    }
  }

  return compiledSequences;
}

function resolvePositionalVariants(sequence: Sequence): Atom[][] {
  const width = Math.max(
    ...sequence.positions.map((position) => position.length)
  );

  if (width === 1) {
    return [
      sequence.positions.map((position) => {
        const atom = position[0];

        if (atom === undefined) {
          throw new CompileError(
            "Empty positional atom group.",
            sequence.range
          );
        }

        return atom;
      })
    ];
  }

  return Array.from({ length: width }, (_, index) =>
    sequence.positions.map((position) => {
      if (position.length === 1) {
        return position[0] as Atom;
      }

      if (position.length !== width) {
        throw new CompileError(
          "Heterogeneous number of positional atoms in sequence.",
          sequence.range
        );
      }

      return position[index] as Atom;
    })
  );
}

function compileAtom(
  atom: Atom,
  env: SourceEnv,
  context: CompileContext
): Placement[] {
  switch (atom.type) {
    case "terminal":
      return [{ atom: compileTerminal(atom), mobile: false }];

    case "nonterm":
      return [{ atom: compileNonterminal(atom, env, context), mobile: false }];

    case "select":
      return compileSelect(atom, env, context);

    case "multiselect":
      return compileMultiselect(atom, env, context);

    case "lock":
      return compileLocked(atom, env, context);

    case "unfold":
      return compileUnfold(atom, env, context);

    case "group":
      return compileGroup(atom, env, context);
  }
}

function compileTerminal(atom: TerminalAtom): CompiledTerminalAtom {
  return {
    type: "compiled-terminal",
    value: atom.value
  };
}

function compileNonterminal(
  atom: NonterminalAtom,
  env: SourceEnv,
  context: CompileContext
): CompiledAtom {
  if (atom.path.segments.length !== 1) {
    throw new CompileError(
      "Imported or nested non-terminal paths are not supported yet.",
      atom.range
    );
  }

  const symbol = atom.path.segments[0];

  if (symbol === undefined) {
    throw new CompileError("Missing non-terminal symbol.", atom.range);
  }

  if (!env.has(symbol)) {
    if (context.policy.undefinedNonterminal === "warn-as-terminal") {
      addCompileWarning(
        context,
        "undefined-nonterminal-fallback",
        `Undefined non-terminal '${symbol}' was treated as terminal text in compatibility mode.`,
        atom.range
      );

      return createTerminalAtom(symbol);
    }

    throw new CompileError(`Undefined non-terminal '${symbol}'.`, atom.range);
  }

  return {
    path: atom.path.segments,
    type: "compiled-nonterm"
  };
}

function compileSelect(
  atom: SelectAtom,
  env: SourceEnv,
  context: CompileContext
): Placement[] {
  const decision = resolveSelectionDecision(
    atom.target,
    atom.label,
    env,
    atom.range,
    context
  );
  const compiledTarget = compileAtom(atom.target, env, context);

  if (decision.type === "preserve-target") {
    return compiledTarget;
  }

  return compiledTarget.map((placement) =>
    decision.type === "clear-active-labels"
      ? {
          atom: {
            target: placement.atom,
            type: "compiled-select"
          },
          mobile: placement.mobile
        }
      : {
          atom: {
            label: decision.label,
            target: placement.atom,
            type: "compiled-select"
          },
          mobile: placement.mobile
        }
  );
}

function compileMultiselect(
  atom: MultiselectAtom,
  env: SourceEnv,
  context: CompileContext
): Placement[] {
  const decision = resolveMultiselectDecision(
    atom.target,
    atom.labels,
    env,
    atom.range,
    context
  );

  if (decision.type === "preserve-target") {
    return compileAtom(atom.target, env, context);
  }

  return compileAtom(atom.target, env, context).map((placement) => ({
    atom: {
      labels: [...decision.labels],
      target: placement.atom,
      type: "compiled-multiselect"
    },
    mobile: placement.mobile
  }));
}

function resolveSelectionDecision(
  target: Atom,
  label: string | undefined,
  env: SourceEnv,
  range: SourceRange,
  context: CompileContext
): SelectionDecision {
  if (label === undefined) {
    return { type: "clear-active-labels" };
  }

  const availableLabels = getAvailableLabels(target, env, context);

  if (availableLabels === null) {
    return { label, type: "select-label" };
  }

  if (availableLabels.has(label)) {
    return { label, type: "select-label" };
  }

  if (context.policy.invalidSelectionLabel === "warn-ignore") {
    addCompileWarning(
      context,
      "invalid-label-selection-fallback",
      `Label '${label}' is not available on the selected target and was ignored in compatibility mode.`,
      range
    );

    return { type: "preserve-target" };
  }

  throw new CompileError(
    `Label '${label}' is not available on the selected target.`,
    range
  );
}

function resolveMultiselectDecision(
  target: Atom,
  labels: string[],
  env: SourceEnv,
  range: SourceRange,
  context: CompileContext
): MultiselectDecision {
  const availableLabels = getAvailableLabels(target, env, context);

  if (availableLabels === null) {
    return {
      labels: [...labels],
      type: "select-labels"
    };
  }

  const validLabels = labels.filter((label) => availableLabels.has(label));

  if (validLabels.length === labels.length) {
    return {
      labels: validLabels,
      type: "select-labels"
    };
  }

  if (context.policy.invalidSelectionLabel === "warn-ignore") {
    for (const label of labels) {
      if (!availableLabels.has(label)) {
        addCompileWarning(
          context,
          "invalid-label-selection-fallback",
          `Label '${label}' is not available on the selected target and was ignored in compatibility mode.`,
          range
        );
      }
    }

    return validLabels.length === 0
      ? { type: "preserve-target" }
      : {
          labels: validLabels,
          type: "select-labels"
        };
  }

  const invalidLabel = labels.find((label) => !availableLabels.has(label));

  throw new CompileError(
    `Label '${invalidLabel ?? "<missing>"}' is not available on the selected target.`,
    range
  );
}

function getAvailableLabels(
  target: Atom,
  env: SourceEnv,
  context: CompileContext
): Set<string> | null {
  switch (target.type) {
    case "terminal":
      return new Set();

    case "nonterm": {
      const symbol = target.path.segments[target.path.segments.length - 1];

      if (
        symbol !== undefined &&
        !env.has(symbol) &&
        context.policy.undefinedNonterminal === "warn-as-terminal"
      ) {
        return null;
      }

      const declaration = lookupBinding(env, target);
      return getProductionLabels(declaration.production);
    }

    case "group":
      return getProductionLabels(target.production);

    case "select":
      return target.label === undefined ? new Set() : new Set([target.label]);

    case "multiselect":
      return new Set(target.labels);

    case "lock":
    case "unfold":
      return getAvailableLabels(target.target, env, context);
  }
}

function getProductionLabels(production: Production): Set<string> {
  return new Set(
    production.alternatives.flatMap((sequence) =>
      sequence.label === undefined ? [] : [sequence.label]
    )
  );
}

function compileLocked(
  atom: LockAtom,
  env: SourceEnv,
  context: CompileContext
): Placement[] {
  return atom.target.type === "nonterm"
    ? [{ atom: compileNonterminal(atom.target, env, context), mobile: false }]
    : compileGroup(atom.target, env, context, true);
}

function compileUnfold(
  atom: UnfoldAtom,
  env: SourceEnv,
  context: CompileContext
): Placement[] {
  if (atom.target.type === "nonterm") {
    const declaration = lookupBinding(env, atom.target);
    const compiledProduction = compileProduction(
      declaration.production,
      env,
      context
    );

    return compiledProduction.alternatives.map((sequence) => ({
      atom: createSubgrammarAtom([], {
        alternatives: [cloneSequence(sequence)],
        type: "compiled-production"
      }),
      mobile: false
    }));
  }

  return compileGroup(atom.target, env, context, false, true);
}

function compileGroup(
  group: GroupAtom,
  env: SourceEnv,
  context: CompileContext,
  forceLocked = false,
  unfold = false
): Placement[] {
  const normalizedGroup =
    group.mode === "deep-unfold"
      ? {
          ...group,
          mode: "std" as const,
          production: deepUnfoldProduction(group.production)
        }
      : group;

  const localEnv = extendSourceEnv(env, normalizedGroup.declarations);
  const declarations = compileDeclarations(
    normalizedGroup.declarations,
    localEnv,
    context
  );
  const production = compileProduction(
    normalizedGroup.production,
    localEnv,
    context
  );

  if (unfold) {
    if (normalizedGroup.mode === "repeat-one-or-more") {
      return [
        {
          atom: createRepeatAtom(declarations, production),
          mobile: false
        }
      ];
    }

    if (normalizedGroup.mode === "optional") {
      return [
        { atom: createTerminalAtom("epsilon"), mobile: false },
        ...production.alternatives.map((sequence) => ({
          atom: createSubgrammarAtom(declarations, {
            alternatives: [cloneSequence(sequence)],
            type: "compiled-production"
          }),
          mobile: false
        }))
      ];
    }

    return production.alternatives.map((sequence) => ({
      atom: createSubgrammarAtom(declarations, {
        alternatives: [cloneSequence(sequence)],
        type: "compiled-production"
      }),
      mobile: !forceLocked && normalizedGroup.mode === "mob"
    }));
  }

  switch (normalizedGroup.mode) {
    case "optional":
      return [
        { atom: createTerminalAtom("epsilon"), mobile: false },
        {
          atom: createSubgrammarAtom(declarations, production),
          mobile: false
        }
      ];

    case "repeat-one-or-more":
      return [
        {
          atom: createRepeatAtom(declarations, production),
          mobile: false
        }
      ];

    case "mob":
      return [
        {
          atom: createSubgrammarAtom(declarations, production),
          mobile: !forceLocked
        }
      ];

    case "std":
    default:
      return [
        {
          atom: createSubgrammarAtom(declarations, production),
          mobile: false
        }
      ];
  }
}

function createTerminalAtom(
  value: CompiledTerminalAtom["value"]
): CompiledTerminalAtom {
  return {
    type: "compiled-terminal",
    value
  };
}

function createSubgrammarAtom(
  declarations: CompiledDeclaration[],
  production: CompiledProduction
): CompiledSubgrammarAtom {
  return {
    declarations,
    production,
    type: "compiled-subgrammar"
  };
}

function createRepeatAtom(
  declarations: CompiledDeclaration[],
  production: CompiledProduction
): CompiledRepeatAtom {
  return {
    declarations,
    production,
    type: "compiled-repeat"
  };
}

function lookupBinding(env: SourceEnv, atom: NonterminalAtom): BindDeclaration {
  const symbol = atom.path.segments[atom.path.segments.length - 1];

  if (symbol === undefined) {
    throw new CompileError("Missing non-terminal symbol.", atom.range);
  }

  const declaration = env.get(symbol);

  if (declaration === undefined) {
    throw new CompileError(`Undefined non-terminal '${symbol}'.`, atom.range);
  }

  return declaration;
}

function extendSourceEnv(
  base: SourceEnv,
  declarations: Declaration[]
): SourceEnv {
  const env = new Map(base);

  for (const declaration of declarations) {
    if (declaration.type === "bind") {
      env.set(declaration.symbol, declaration);
    }
  }

  return env;
}

function combine<T>(lists: T[][]): T[][] {
  if (lists.length === 0) {
    return [];
  }

  return lists.reduce<T[][]>((accumulator, list) => {
    if (accumulator.length === 0) {
      return list.map((item) => [item]);
    }

    const next: T[][] = [];

    for (const prefix of accumulator) {
      for (const item of list) {
        next.push([...prefix, item]);
      }
    }

    return next;
  }, []);
}

function arrange(placements: Placement[]): CompiledAtom[][] {
  const mobilePlacements = placements.filter((placement) => placement.mobile);
  const permutations = permute(mobilePlacements);

  if (permutations.length === 0) {
    return [projectArrangement(placements, [])];
  }

  return permutations.map((permutation) =>
    projectArrangement(placements, permutation)
  );
}

function projectArrangement(
  placements: Placement[],
  mobilePlacements: Placement[]
): CompiledAtom[] {
  const queue = [...mobilePlacements];

  return placements.map((placement) => {
    if (!placement.mobile) {
      return placement.atom;
    }

    const next = queue.shift();

    if (next === undefined) {
      throw new Error("Missing mobile placement during arrangement.");
    }

    return next.atom;
  });
}

function permute<T>(items: T[]): T[][] {
  if (items.length === 0) {
    return [];
  }

  if (items.length === 1) {
    return [[items[0] as T]];
  }

  const permutations: T[][] = [];

  for (let index = 0; index < items.length; index += 1) {
    const current = items[index] as T;
    const rest = items.slice(0, index).concat(items.slice(index + 1));

    for (const permutation of permute(rest)) {
      permutations.push([current, ...permutation]);
    }
  }

  return permutations;
}

function deepUnfoldProduction(production: Production): Production {
  return {
    alternatives: production.alternatives.map((sequence) => ({
      ...sequence,
      positions: sequence.positions.map((position) =>
        position.map((atom) => deepUnfoldAtom(atom))
      )
    })),
    range: production.range,
    type: "production"
  };
}

function deepUnfoldAtom(atom: Atom): Atom {
  switch (atom.type) {
    case "terminal":
    case "lock":
      return atom;

    case "select":
      return {
        ...atom,
        target: deepUnfoldAtom(atom.target)
      };

    case "multiselect":
      return {
        ...atom,
        target: deepUnfoldAtom(atom.target)
      };

    case "unfold":
      return {
        ...atom,
        target: deepUnfoldTarget(atom.target)
      };

    case "group":
    case "nonterm":
      return {
        range: atom.range,
        target: deepUnfoldTarget(atom),
        type: "unfold"
      };
  }
}

function deepUnfoldTarget(
  target: GroupAtom | NonterminalAtom
): GroupAtom | NonterminalAtom {
  if (target.type === "nonterm") {
    return target;
  }

  return {
    ...target,
    production: deepUnfoldProduction(target.production)
  };
}

function cloneSequence(sequence: CompiledSequence): CompiledSequence {
  return sequence.label === undefined
    ? createCompiledSequence(sequence.atoms.map((atom) => cloneAtom(atom)))
    : createCompiledSequence(
        sequence.atoms.map((atom) => cloneAtom(atom)),
        sequence.label
      );
}

function cloneAtom(atom: CompiledAtom): CompiledAtom {
  switch (atom.type) {
    case "compiled-terminal":
      return { ...atom };
    case "compiled-nonterm":
      return { path: [...atom.path], type: atom.type };
    case "compiled-select":
      return atom.label === undefined
        ? { target: cloneAtom(atom.target), type: atom.type }
        : {
            label: atom.label,
            target: cloneAtom(atom.target),
            type: atom.type
          };
    case "compiled-multiselect":
      return {
        labels: [...atom.labels],
        target: cloneAtom(atom.target),
        type: atom.type
      };
    case "compiled-subgrammar":
      return {
        declarations: atom.declarations.map((declaration) =>
          cloneDeclaration(declaration)
        ),
        production: cloneProduction(atom.production),
        type: atom.type
      };
    case "compiled-repeat":
      return {
        declarations: atom.declarations.map((declaration) =>
          cloneDeclaration(declaration)
        ),
        production: cloneProduction(atom.production),
        type: atom.type
      };
  }
}

function cloneDeclaration(
  declaration: CompiledDeclaration
): CompiledDeclaration {
  return {
    mode: declaration.mode,
    production: cloneProduction(declaration.production),
    symbol: declaration.symbol,
    type: declaration.type
  };
}

function cloneProduction(production: CompiledProduction): CompiledProduction {
  return {
    alternatives: production.alternatives.map((sequence) =>
      cloneSequence(sequence)
    ),
    type: production.type
  };
}

function createCompiledSequence(
  atoms: CompiledAtom[],
  label?: string
): CompiledSequence {
  return label === undefined
    ? {
        atoms,
        visits: 0
      }
    : {
        atoms,
        label,
        visits: 0
      };
}
