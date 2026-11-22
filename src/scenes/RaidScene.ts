import Phaser from 'phaser';
import controls from '../../data/controls.json';
import mapData from '../../data/temp-map.json';
import playerData from '../../data/player.json';
import { InputManager, KeyboardMouseInput, TouchInput, bindKeyboardMouse } from '../input';
import { createRng } from '../systems/rng';
import { moveCircle, pointInRects, type Rect } from '../systems/collision/walls';
import { createGun, updateGun } from '../systems/weapon/gun';
import {
  createSpreadState, getWeapon, maxRange, onShot, recover, shotAngle, type Movement,
} from '../systems/weapon/weapon';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  travelled: number;
}

// TODO(M2): 仮マップをTiledマップに置き換える
export class RaidScene extends Phaser.Scene {
  private keyboardMouse = new KeyboardMouseInput();
  private touch = new TouchInput();
  private manager = new InputManager([this.keyboardMouse, this.touch]);
  private unbind: (() => void) | null = null;

  private weapon = getWeapon(playerData.startWeapon);
  private gun = createGun(this.weapon);
  private spread = createSpreadState();
  private rng = createRng(Date.now()); // TODO(M3): レイド開始時にシードを決める
  private walls: Rect[] = [];
  private bullets: Bullet[] = [];
  private px = 0;
  private py = 0;
  private facing = 0;
  private followTarget = { x: 0, y: 0 };

  private dyn!: Phaser.GameObjects.Graphics;
  private ui!: Phaser.GameObjects.Graphics;
  private ammoText!: Phaser.GameObjects.Text;

  constructor() {
    super('Raid');
  }

  create(): void {
    const T = mapData.tileSize;
    this.walls = mapData.walls.map((w) => ({ x: w.x * T, y: w.y * T, w: w.w * T, h: w.h * T }));
    this.px = (mapData.playerStart.x + 0.5) * T;
    this.py = (mapData.playerStart.y + 0.5) * T;
    this.bullets = [];
    this.gun = createGun(this.weapon);
    this.spread = createSpreadState();

    // --- ワールド（ズームするカメラで映る） ---
    const floor = this.add.graphics();
    floor.fillStyle(0x2a2a2e).fillRect(0, 0, mapData.width * T, mapData.height * T);
    floor.lineStyle(1, 0x34343a);
    for (let x = 0; x <= mapData.width; x++) floor.lineBetween(x * T, 0, x * T, mapData.height * T);
    for (let y = 0; y <= mapData.height; y++) floor.lineBetween(0, y * T, mapData.width * T, y * T);
    floor.fillStyle(0x6a6a74);
    for (const w of this.walls) floor.fillRect(w.x, w.y, w.w, w.h);
    this.dyn = this.add.graphics();

    // --- 画面固定のUI（ズームしない別カメラで映る） ---
    this.ui = this.add.graphics();
    this.ammoText = this.add.text(1264, 16, '', { fontSize: '28px', color: '#fff' }).setOrigin(1, 0);
    const backText = this.add
      .text(0, 0, '戻る', { fontSize: '24px', color: '#fff' })
      .setOrigin(0.5)
      .setPosition(controls.touch.backButton.x + controls.touch.backButton.width / 2,
        controls.touch.backButton.y + controls.touch.backButton.height / 2);

    const W = this.scale.width;
    const H = this.scale.height;
    const world = this.cameras.main;
    world.setBounds(0, 0, mapData.width * T, mapData.height * T);
    world.setZoom(playerData.cameraZoom);
    this.followTarget = { x: this.px, y: this.py };
    world.startFollow(this.followTarget, true);
    const uiCam = this.cameras.add(0, 0, W, H);
    world.ignore([this.ui, this.ammoText, backText]);
    uiCam.ignore([floor, this.dyn]);

    // --- 入力 ---
    this.input.addPointer(2); // 同時に3本の指まで
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
    this.unbind = bindKeyboardMouse(this.keyboardMouse, this.game.canvas, { width: W, height: H });
    this.game.events.on('hidden', this.onHidden, this);

    this.events.once('shutdown', () => {
      this.unbind?.();
      this.game.events.off('hidden', this.onHidden, this);
      this.input.off('pointerdown', this.onPointerDown, this);
      this.input.off('pointermove', this.onPointerMove, this);
      this.input.off('pointerup', this.onPointerUp, this);
      this.input.off('pointerupoutside', this.onPointerUp, this);
      this.keyboardMouse.reset();
      this.touch.reset();
    });
  }

  private onHidden(): void {
    this.keyboardMouse.reset();
    this.touch.reset();
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!p.wasTouch) return;
    const b = controls.touch.backButton;
    if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) {
      this.scene.start('Result');
      return;
    }
    this.touch.pointerDown(p.id, p.x, p.y);
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (p.wasTouch) this.touch.pointerMove(p.id, p.x, p.y);
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (p.wasTouch) this.touch.pointerUp(p.id);
  }

  update(_time: number, delta: number): void {
    // 縦持ちの間は止める（HTML側で「横にしてください」を表示している）
    if (window.matchMedia('(orientation: portrait)').matches) return;
    const dt = Math.min(delta / 1000, 0.05);
    const cam = this.cameras.main;
    const w = this.weapon;

    // 照準角の計算用に、プレイヤーの画面上の位置を渡す
    const cmd = this.manager.poll({
      playerX: (this.px - cam.worldView.x) * cam.zoom,
      playerY: (this.py - cam.worldView.y) * cam.zoom,
    });

    // 移動
    const len = Math.hypot(cmd.move.x, cmd.move.y);
    const step = playerData.moveSpeed * dt;
    const next = moveCircle(this.px, this.py, cmd.move.x * step, cmd.move.y * step, playerData.radius, this.walls);
    this.px = next.x;
    this.py = next.y;
    this.followTarget.x = this.px;
    this.followTarget.y = this.py;

    // 向き：照準があればそれ、なければ移動方向
    if (cmd.aimAngle !== null) this.facing = cmd.aimAngle;
    else if (len > 0) this.facing = Math.atan2(cmd.move.y, cmd.move.x);

    // 射撃
    const movement: Movement = len > 0 ? 'moving' : 'idle'; // TODO(M1以降): ダッシュ
    recover(w, this.spread, dt);
    const r = updateGun(w, this.gun, dt, cmd.firing, cmd.reload);
    if (r.shot && this.bullets.length < playerData.maxBullets) {
      const a = shotAngle(this.facing, w, this.spread, movement, () => this.rng.next());
      onShot(w, this.spread);
      this.bullets.push({
        x: this.px + Math.cos(a) * playerData.radius,
        y: this.py + Math.sin(a) * playerData.radius,
        vx: Math.cos(a) * w.bulletSpeed,
        vy: Math.sin(a) * w.bulletSpeed,
        travelled: 0,
      });
    }

    // 弾の移動（射程を超える・壁に当たると消える）
    const range = maxRange(w);
    this.bullets = this.bullets.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.travelled += w.bulletSpeed * dt;
      return b.travelled <= range && !pointInRects(b.x, b.y, this.walls);
    });

    this.draw();
  }

  private draw(): void {
    const g = this.dyn;
    g.clear();
    g.fillStyle(0xffd24a);
    for (const b of this.bullets) g.fillCircle(b.x, b.y, playerData.bulletRadius);
    g.fillStyle(0x4aa3ff).fillCircle(this.px, this.py, playerData.radius);
    g.lineStyle(4, 0xffffff).lineBetween(
      this.px, this.py,
      this.px + Math.cos(this.facing) * (playerData.radius + 10),
      this.py + Math.sin(this.facing) * (playerData.radius + 10),
    );

    // UI
    const u = this.ui;
    u.clear();
    const t = controls.touch;
    for (const s of [this.touch.moveStick, this.touch.aimStick]) {
      if (!s.active) continue;
      u.lineStyle(3, 0xffffff, 0.5).strokeCircle(s.originX, s.originY, t.stickRadius);
      u.fillStyle(0xffffff, 0.5).fillCircle(s.knobX, s.knobY, t.stickRadius * 0.4);
    }
    const b = t.reloadButton;
    u.fillStyle(0xffffff, this.touch.reloadHeld ? 0.5 : 0.25).fillCircle(b.x, b.y, b.radius);
    u.lineStyle(3, 0xffffff, 0.6).strokeCircle(b.x, b.y, b.radius);
    u.fillStyle(0x000000, 0.5).fillRect(t.backButton.x, t.backButton.y, t.backButton.width, t.backButton.height);

    const reloading = this.gun.reloadRemaining > 0;
    this.ammoText.setText(reloading ? 'リロード中…' : `${this.weapon.name}  ${this.gun.ammo}/${this.weapon.magSize}`);
  }
}
