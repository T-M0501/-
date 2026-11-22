// シード付き乱数 (mulberry32)。ゲームの乱数はすべてここを経由する。
export interface Rng {
  /** [0,1) */
  next(): number;
  /** [min,max) */
  range(min: number, max: number): number;
  /** min以上max以下の整数 */
  int(min: number, max: number): number;
  /** 確率 p で true */
  chance(p: number): boolean;
  /** 配列から1つ選ぶ（空配列はエラー） */
  pick<T>(items: readonly T[]): T;
  /** 同じシードから同じ列を再現するための現在状態 */
  getState(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick: empty array');
      return items[Math.floor(next() * items.length)];
    },
    getState: () => s,
  };
}
