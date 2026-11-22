// 銃の状態（装弾数・連射間隔・リロード）。純粋ロジック。
// TODO(仕様未定): 予備弾薬・インベントリとの連携はM4以降。今はリロードで常に満タンになる。
import type { WeaponDef } from './weapon';

export interface GunState {
  ammo: number;
  cooldown: number; // 次に撃てるまでの秒
  reloadRemaining: number; // 0 = リロード中でない
}

export function createGun(w: WeaponDef): GunState {
  return { ammo: w.magSize, cooldown: 0, reloadRemaining: 0 };
}

export interface GunUpdate {
  shot: boolean;
  reloadStarted: boolean;
  reloadFinished: boolean;
}

/** 1フレーム分の更新。1回の呼び出しで撃つのは最大1発。弾切れで撃とうとすると自動でリロードする。 */
export function updateGun(
  w: WeaponDef,
  g: GunState,
  dt: number,
  wantFire: boolean,
  wantReload: boolean,
): GunUpdate {
  const out: GunUpdate = { shot: false, reloadStarted: false, reloadFinished: false };
  g.cooldown = Math.max(0, g.cooldown - dt);

  if (g.reloadRemaining > 0) {
    g.reloadRemaining -= dt;
    if (g.reloadRemaining <= 0) {
      g.reloadRemaining = 0;
      g.ammo = w.magSize;
      out.reloadFinished = true;
    }
    return out;
  }

  if ((wantReload && g.ammo < w.magSize) || (wantFire && g.ammo === 0)) {
    g.reloadRemaining = w.reloadTime;
    out.reloadStarted = true;
    return out;
  }

  if (wantFire && g.ammo > 0 && g.cooldown === 0) {
    g.ammo -= 1;
    g.cooldown = 1 / w.fireRate;
    out.shot = true;
  }
  return out;
}
