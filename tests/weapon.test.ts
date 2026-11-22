import { describe, expect, it } from 'vitest';
import {
  createSpreadState, currentSpread, damageAt, damageMultiplier, getWeapon,
  maxRange, onShot, recover, shotAngle, weaponData,
} from '../src/systems/weapon/weapon';

const p9 = getWeapon('hg_p9');
const ar4 = getWeapon('ar_ar4');
const kr47 = getWeapon('ar_kr47');

describe('range', () => {
  it('ジャンル順: ハンドガン < アサルトライフル', () => {
    expect(maxRange(p9)).toBeLessThan(maxRange(ar4));
    expect(maxRange(kr47)).toBeLessThan(maxRange(ar4)); // KR-47は中
  });
  it('射程内は威力維持、射程超えは0、最大射程で最小威力', () => {
    const r = maxRange(ar4);
    expect(damageMultiplier(ar4, 0)).toBe(1);
    expect(damageMultiplier(ar4, r * ar4.falloffStartRatio)).toBe(1);
    expect(damageMultiplier(ar4, r)).toBeCloseTo(ar4.minDamageRatio);
    expect(damageMultiplier(ar4, r + 1)).toBe(0);
  });
  it('減衰は単調', () => {
    const r = maxRange(ar4);
    expect(damageAt(ar4, r * 0.8)).toBeGreaterThan(damageAt(ar4, r * 0.9));
  });
  it('不明な武器/ジャンルはエラー', () => {
    expect(() => getWeapon('nope')).toThrow();
    expect(() => maxRange({ ...p9, genre: 'x' }, weaponData)).toThrow();
  });
});

describe('spread', () => {
  it('初期はbaseSpread、撃つたびにspreadPerShot増加', () => {
    const s = createSpreadState();
    expect(currentSpread(ar4, s)).toBe(ar4.baseSpread);
    onShot(ar4, s);
    expect(currentSpread(ar4, s)).toBeCloseTo(ar4.baseSpread + ar4.spreadPerShot);
  });
  it('maxSpreadで頭打ち', () => {
    const s = createSpreadState();
    for (let i = 0; i < 100; i++) onShot(kr47, s);
    expect(currentSpread(kr47, s)).toBe(kr47.maxSpread);
    expect(currentSpread(kr47, s, 'sprinting')).toBe(kr47.maxSpread);
  });
  it('時間で戻り、0未満にならない', () => {
    const s = createSpreadState();
    for (let i = 0; i < 5; i++) onShot(ar4, s);
    const before = currentSpread(ar4, s);
    recover(ar4, s, 0.1);
    expect(currentSpread(ar4, s)).toBeCloseTo(before - ar4.spreadRecovery * 0.1);
    recover(ar4, s, 100);
    expect(currentSpread(ar4, s)).toBe(ar4.baseSpread);
  });
  it('移動・ダッシュでブレが大きくなる', () => {
    const s = createSpreadState();
    const idle = currentSpread(ar4, s, 'idle');
    const mv = currentSpread(ar4, s, 'moving');
    const sp = currentSpread(ar4, s, 'sprinting');
    expect(mv).toBeGreaterThan(idle);
    expect(sp).toBeGreaterThan(mv);
  });
  it('武器の特徴: P-9はブレ小、KR-47は連射でAR-4より大きく乱れる', () => {
    expect(p9.baseSpread).toBeLessThan(ar4.baseSpread);
    const a = createSpreadState(), k = createSpreadState();
    for (let i = 0; i < 5; i++) { onShot(ar4, a); onShot(kr47, k); }
    expect(currentSpread(kr47, k)).toBeGreaterThan(currentSpread(ar4, a));
    expect(kr47.damage).toBeGreaterThan(ar4.damage);
  });
});

describe('shotAngle', () => {
  it('乱数で再現可能、範囲は±spread/2', () => {
    const s = createSpreadState();
    const half = (currentSpread(ar4, s) * Math.PI) / 180 / 2;
    expect(shotAngle(1, ar4, s, 'idle', () => 0.5)).toBeCloseTo(1);
    expect(shotAngle(1, ar4, s, 'idle', () => 0)).toBeCloseTo(1 - half);
    expect(shotAngle(1, ar4, s, 'idle', () => 1)).toBeCloseTo(1 + half);
  });
});
