import type {
  Atom,
  BindDeclaration,
  Declaration,
  Grammar,
  GroupAtom,
  LockAtom,
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

export type CompileWarningCode = "unfold-assign" | "useless-unfold";

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
  warnings: CompileWarning[];
}

export class CompileError extends Error {
  readonly range: SourceRange;

  constructor(message: string, range: SourceRange) {
    super(message);
    this.name = "CompileError";
    this.range = range;
  }
}

export function compileGrammar(grammar: Grammar): CompiledGrammar {
  return compileGrammarWithInfo(grammar).compiled;
}

export function compileGrammarWithInfo(grammar: Grammar): CompileResult {
  const context = createCompileContext();
  validateGrammar(grammar, context);
  const env = extendSourceEnv(new Map(), grammar.declarations);

  return {
    compiled: {
      declarations: compileDeclarations(grammar.declarations, env),
      range: grammar.range,
      type: "compiled-grammar"
    },
    warnings: context.warnings
  };
}

function createCompileContext(): CompileContext {
  return { warnings: [] };
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
  env: SourceEnv
): CompiledDeclaration[] {
  return declarations.map((declaration) =>
    compileDeclaration(declaration, env)
  );
}

function compileDeclaration(
  declaration: Declaration,
  env: SourceEnv
): CompiledDeclaration {
  if (declaration.type === "import") {
    throw new CompileError(
      "Import declarations are not supported yet.",
      declaration.range
    );
  }

  return {
    mode: declaration.mode,
    production: compileProduction(declaration.production, env),
    symbol: declaration.symbol,
    type: "compiled-bind"
  };
}

function compileProduction(
  production: Production,
  env: SourceEnv
): CompiledProduction {
  return {
    alternatives: production.alternatives.flatMap((sequence) =>
      compileSequence(sequence, env)
    ),
    type: "compiled-production"
  };
}

function compileSequence(
  sequence: Sequence,
  env: SourceEnv
): CompiledSequence[] {
  const positionalVariants = resolvePositionalVariants(sequence);
  const compiledSequences: CompiledSequence[] = [];

  for (const atoms of positionalVariants) {
    const placementMatrix = atoms.map((atom) => compileAtom(atom, env));
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

function compileAtom(atom: Atom, env: SourceEnv): Placement[] {
  switch (atom.type) {
    case "terminal":
      return [{ atom: compileTerminal(atom), mobile: false }];

    case "nonterm":
      return [{ atom: compileNonterminal(atom, env), mobile: false }];

    case "select":
      return compileSelect(atom, env);

    case "multiselect":
      return compileMultiselect(atom, env);

    case "lock":
      return compileLocked(atom, env);

    case "unfold":
      return compileUnfold(atom, env);

    case "group":
      return compileGroup(atom, env);
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
  env: SourceEnv
): CompiledAtom {
  if (atom.path.segments.length !== 1) {
    throw new CompileError(
      "Imported or nested non-terminal paths are not supported yet.",
      atom.range
    );
  }

  const symbol = atom.path.segments[0];

  if (symbol === undefined || !env.has(symbol)) {
    throw new CompileError(
      `Undefined non-terminal '${symbol ?? "<missing>"}'.`,
      atom.range
    );
  }

  return {
    path: atom.path.segments,
    type: "compiled-nonterm"
  };
}

function compileSelect(atom: SelectAtom, env: SourceEnv): Placement[] {
  validateSelectionLabel(atom.target, atom.label, env, atom.range);

  return compileAtom(atom.target, env).map((placement) =>
    atom.label === undefined
      ? {
          atom: {
            target: placement.atom,
            type: "compiled-select"
          },
          mobile: placement.mobile
        }
      : {
          atom: {
            label: atom.label,
            target: placement.atom,
            type: "compiled-select"
          },
          mobile: placement.mobile
        }
  );
}

function compileMultiselect(
  atom: SelectAtom | { labels: string[]; target: Atom; type: "multiselect" },
  env: SourceEnv
): Placement[] {
  if (atom.type !== "multiselect") {
    throw new Error("Expected multiselect atom.");
  }

  for (const label of atom.labels) {
    validateSelectionLabel(atom.target, label, env, atom.target.range);
  }

  return compileAtom(atom.target, env).map((placement) => ({
    atom: {
      labels: [...atom.labels],
      target: placement.atom,
      type: "compiled-multiselect"
    },
    mobile: placement.mobile
  }));
}

function validateSelectionLabel(
  target: Atom,
  label: string | undefined,
  env: SourceEnv,
  range: SourceRange
): void {
  if (label === undefined) {
    return;
  }

  const availableLabels = getAvailableLabels(target, env);

  if (availableLabels === null) {
    return;
  }

  if (!availableLabels.has(label)) {
    throw new CompileError(
      `Label '${label}' is not available on the selected target.`,
      range
    );
  }
}

function getAvailableLabels(target: Atom, env: SourceEnv): Set<string> | null {
  switch (target.type) {
    case "terminal":
      return new Set();

    case "nonterm": {
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
      return getAvailableLabels(target.target, env);
  }
}

function getProductionLabels(production: Production): Set<string> {
  return new Set(
    production.alternatives.flatMap((sequence) =>
      sequence.label === undefined ? [] : [sequence.label]
    )
  );
}

function compileLocked(atom: LockAtom, env: SourceEnv): Placement[] {
  return atom.target.type === "nonterm"
    ? [{ atom: compileNonterminal(atom.target, env), mobile: false }]
    : compileGroup(atom.target, env, true);
}

function compileUnfold(atom: UnfoldAtom, env: SourceEnv): Placement[] {
  if (atom.target.type === "nonterm") {
    const declaration = lookupBinding(env, atom.target);
    const compiledProduction = compileProduction(declaration.production, env);

    return compiledProduction.alternatives.map((sequence) => ({
      atom: createSubgrammarAtom([], {
        alternatives: [cloneSequence(sequence)],
        type: "compiled-production"
      }),
      mobile: false
    }));
  }

  return compileGroup(atom.target, env, false, true);
}

function compileGroup(
  group: GroupAtom,
  env: SourceEnv,
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
    localEnv
  );
  const production = compileProduction(normalizedGroup.production, localEnv);

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
