// 武器の射程・ブレの計算（純粋ロジック。Phaser非依存）。数値は data/weapons.json。
import raw from '../../../data/weapons.json';

export interface WeaponDef {
  name: string;
  genre: string;
  model: string;
  damage: number;
  fireRate: number; // 発/秒
  magSize: number;
  reloadTime: number;
  rangeMultiplier: number; // ジャンル基本射程への倍率
  falloffStartRatio: number; // 最大射程のこの割合から威力低下
  minDamageRatio: number; // 最大射程ちょうどでの威力割合
  baseSpread: number; // 度
  spreadPerShot: number;
  maxSpread: number;
  spreadRecovery: number; // 度/秒
  movingSpreadAdd: number;
  sprintingSpreadAdd: number;
  weight: number;
}

export interface WeaponData {
  genreRange: Record<string, number>;
  weapons: Record<string, WeaponDef>;
}

export const weaponData = raw as WeaponData;

export type Movement = 'idle' | 'moving' | 'sprinting';

export function getWeapon(id: string, data: WeaponData = weaponData): WeaponDef {
  const w = data.weapons[id];
  if (!w) throw new Error(`unknown weapon: ${id}`);
  return w;
}

/** 最大射程(px)。射程を超えた弾は消える。 */
export function maxRange(w: WeaponDef, data: WeaponData = weaponData): number {
  const base = data.genreRange[w.genre];
  if (base === undefined) throw new Error(`unknown genre: ${w.genre}`);
  return base * w.rangeMultiplier;
}

/** 距離に応じた威力倍率。falloff開始まで1、最大射程でminDamageRatio、超えたら0（弾消滅）。 */
export function damageMultiplier(w: WeaponDef, distance: number, data: WeaponData = weaponData): number {
  const max = maxRange(w, data);
  if (distance > max) return 0;
  const start = max * w.falloffStartRatio;
  if (distance <= start) return 1;
  const t = (distance - start) / (max - start);
  return 1 + (w.minDamageRatio - 1) * t;
}

export function damageAt(w: WeaponDef, distance: number, data: WeaponData = weaponData): number {
  return w.damage * damageMultiplier(w, distance, data);
}

/** 連射によるブレの蓄積量（度）。移動分は含まない。 */
export interface SpreadState {
  accumulated: number;
}

export function createSpreadState(): SpreadState {
  return { accumulated: 0 };
}

function movementAdd(w: WeaponDef, m: Movement): number {
  return m === 'sprinting' ? w.sprintingSpreadAdd : m === 'moving' ? w.movingSpreadAdd : 0;
}

/** 現在の拡散角（度）。maxSpreadで頭打ち。 */
export function currentSpread(w: WeaponDef, s: SpreadState, m: Movement = 'idle'): number {
  return Math.min(w.baseSpread + s.accumulated + movementAdd(w, m), w.maxSpread);
}

/** 1発撃ったときのブレ増加。 */
export function onShot(w: WeaponDef, s: SpreadState): void {
  s.accumulated = Math.min(s.accumulated + w.spreadPerShot, w.maxSpread - w.baseSpread);
}

/** 時間経過によるブレの回復。 */
export function recover(w: WeaponDef, s: SpreadState, dtSeconds: number): void {
  s.accumulated = Math.max(0, s.accumulated - w.spreadRecovery * dtSeconds);
}

/**
 * 射撃角度（ラジアン）。rng は systems/rng.ts 経由の [0,1) 乱数関数を渡す。
 * 拡散角は全幅（±spread/2）。
 */
export function shotAngle(
  aimAngle: number,
  w: WeaponDef,
  s: SpreadState,
  m: Movement,
  rng: () => number,
): number {
  const spreadRad = (currentSpread(w, s, m) * Math.PI) / 180;
  return aimAngle + (rng() - 0.5) * spreadRad;
}
