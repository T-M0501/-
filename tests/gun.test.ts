import { describe, expect, it } from 'vitest';
import { createGun, updateGun } from '../src/systems/weapon/gun';
import { getWeapon } from '../src/systems/weapon/weapon';

const w = getWeapon('ar_ar4');

describe('gun', () => {
  it('撃つと弾が減り、連射間隔の間は撃てない', () => {
    const g = createGun(w);
    expect(updateGun(w, g, 0.016, true, false).shot).toBe(true);
    expect(g.ammo).toBe(w.magSize - 1);
    expect(updateGun(w, g, 0.016, true, false).shot).toBe(false);
    expect(updateGun(w, g, 1 / w.fireRate, true, false).shot).toBe(true);
  });
  it('押していなければ撃たない', () => {
    const g = createGun(w);
    expect(updateGun(w, g, 1, false, false).shot).toBe(false);
  });
  it('リロード中は撃てず、時間が経つと満タン', () => {
    const g = createGun(w);
    updateGun(w, g, 0.016, true, false);
    const r = updateGun(w, g, 0.016, false, true);
    expect(r.reloadStarted).toBe(true);
    expect(updateGun(w, g, 0.016, true, false).shot).toBe(false);
    const done = updateGun(w, g, w.reloadTime, false, false);
    expect(done.reloadFinished).toBe(true);
    expect(g.ammo).toBe(w.magSize);
  });
  it('満タンならリロードしない', () => {
    const g = createGun(w);
    expect(updateGun(w, g, 0.016, false, true).reloadStarted).toBe(false);
  });
  it('弾切れで撃とうとすると自動リロード', () => {
    const g = createGun(w);
    g.ammo = 0;
    expect(updateGun(w, g, 0.016, true, false).reloadStarted).toBe(true);
  });
});
