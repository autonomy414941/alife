export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }

  nextU32(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  float(): number {
    return this.nextU32() / 0x100000000;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      throw new Error('maxExclusive must be positive');
    }
    return Math.floor(this.float() * maxExclusive);
  }

  pick<T>(values: T[]): T {
    return values[this.int(values.length)];
  }

  shuffle<T>(values: T[]): T[] {
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = this.int(i + 1);
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }
}
