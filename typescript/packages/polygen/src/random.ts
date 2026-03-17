export interface RandomSource {
  int(maxExclusive: number): number;
}

export interface RandomInfo {
  random: RandomSource;
  resolvedSeed: number;
}

export function createRandomSource(seed?: number): RandomInfo {
  const resolvedSeed =
    seed === undefined ? createEntropySeed() : normalizeSeed(seed);

  return {
    random: createMulberry32(resolvedSeed),
    resolvedSeed
  };
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
    throw new Error("seed must be a finite integer.");
  }

  return seed >>> 0;
}

function createMulberry32(seed: number): RandomSource {
  let state = seed >>> 0;

  return {
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) {
        throw new Error("maxExclusive must be greater than zero.");
      }

      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
      const normalized = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      return Math.floor(normalized * maxExclusive);
    }
  };
}

function createEntropySeed(): number {
  const cryptoObject = globalThis.crypto;

  if (cryptoObject?.getRandomValues !== undefined) {
    const values = new Uint32Array(1);
    cryptoObject.getRandomValues(values);
    return values[0] as number;
  }

  return Math.floor(Math.random() * 0x1_0000_0000);
}
