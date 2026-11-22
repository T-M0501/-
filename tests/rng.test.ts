import { describe, expect, it } from 'vitest';
import { createRng } from '../src/systems/rng';

describe('rng', () => {
  it('同じシードなら同じ列', () => {
    const a = createRng(123), b = createRng(123);
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next());
  });
  it('違うシードなら違う列', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('next は [0,1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('range / int の範囲', () => {
    const r = createRng(9);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const f = r.range(5, 10);
      expect(f).toBeGreaterThanOrEqual(5);
      expect(f).toBeLessThan(10);
      const n = r.int(1, 3);
      expect(Number.isInteger(n)).toBe(true);
      seen.add(n);
    }
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
  it('chance の端', () => {
    const r = createRng(3);
    for (let i = 0; i < 100; i++) {
      expect(r.chance(0)).toBe(false);
      expect(r.chance(1)).toBe(true);
    }
  });
  it('pick と空配列エラー', () => {
    const r = createRng(5);
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    expect(() => r.pick([])).toThrow();
  });
  it('getState で途中から再現できる', () => {
    const a = createRng(42);
    a.next();
    const b = createRng(a.getState());
    expect(b.next()).toBe(a.next());
  });
});
