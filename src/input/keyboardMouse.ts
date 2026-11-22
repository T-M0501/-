// キーボード・マウスの状態を InputCommand に変換する純粋ロジック（DOM/Phaser非依存）。
import controlsData from '../../data/controls.json';
import { emptyCommand, type InputCommand, type InputSource, type PollContext } from './types';

export interface KeyboardMouseConfig {
  keyboard: { up: string; down: string; left: string; right: string; reload: string };
  mouse: { fireButton: number };
}

export class KeyboardMouseInput implements InputSource {
  private keys = new Set<string>();
  private reloadPressed = false;
  private mouse: { x: number; y: number } | null = null;
  private fireDown = false;

  constructor(private config: KeyboardMouseConfig = controlsData) {}

  keyDown(code: string): void {
    if (code === this.config.keyboard.reload && !this.keys.has(code)) this.reloadPressed = true;
    this.keys.add(code);
  }

  keyUp(code: string): void {
    this.keys.delete(code);
  }

  /** マウス位置（照準の計算に使う座標系と同じもの） */
  mouseMove(x: number, y: number): void {
    this.mouse = { x, y };
  }

  mouseDown(button: number): void {
    if (button === this.config.mouse.fireButton) this.fireDown = true;
  }

  mouseUp(button: number): void {
    if (button === this.config.mouse.fireButton) this.fireDown = false;
  }

  /** フォーカスを失ったとき等に押しっぱなしを解除する */
  reset(): void {
    this.keys.clear();
    this.fireDown = false;
    this.reloadPressed = false;
  }

  poll(ctx: PollContext): InputCommand {
    const k = this.config.keyboard;
    let x = (this.keys.has(k.right) ? 1 : 0) - (this.keys.has(k.left) ? 1 : 0);
    let y = (this.keys.has(k.down) ? 1 : 0) - (this.keys.has(k.up) ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    const cmd = emptyCommand();
    cmd.move = { x, y };
    if (this.mouse) cmd.aimAngle = Math.atan2(this.mouse.y - ctx.playerY, this.mouse.x - ctx.playerX);
    cmd.firing = this.fireDown;
    cmd.reload = this.reloadPressed;
    this.reloadPressed = false;
    return cmd;
  }
}
