// タッチ操作 → InputCommand。左半分=移動スティック、右側=照準スティック、リロードボタン。
import controlsData from '../../data/controls.json';
import { FloatingStick } from './stick';
import { emptyCommand, type InputCommand, type InputSource, type PollContext } from './types';

export type TouchConfig = typeof controlsData.touch;

export class TouchInput implements InputSource {
  readonly moveStick: FloatingStick;
  readonly aimStick: FloatingStick;
  private reloadPointer: number | null = null;
  private reloadPressed = false;

  constructor(private config: TouchConfig = controlsData.touch) {
    this.moveStick = new FloatingStick(config.stickRadius, config.deadzone);
    this.aimStick = new FloatingStick(config.stickRadius, config.deadzone);
  }

  private inReloadButton(x: number, y: number): boolean {
    const b = this.config.reloadButton;
    return Math.hypot(x - b.x, y - b.y) <= b.radius;
  }

  pointerDown(id: number, x: number, y: number): void {
    if (this.inReloadButton(x, y)) {
      if (this.reloadPointer === null) {
        this.reloadPointer = id;
        this.reloadPressed = true;
      }
      return;
    }
    if (x < this.config.screenWidth * this.config.moveAreaRatio) this.moveStick.begin(id, x, y);
    else this.aimStick.begin(id, x, y);
  }

  pointerMove(id: number, x: number, y: number): void {
    this.moveStick.move(id, x, y);
    this.aimStick.move(id, x, y);
  }

  pointerUp(id: number): void {
    this.moveStick.end(id);
    this.aimStick.end(id);
    if (this.reloadPointer === id) this.reloadPointer = null;
  }

  /** アプリが裏に回った等で、触れている指をすべて離した扱いにする */
  reset(): void {
    this.moveStick.reset();
    this.aimStick.reset();
    this.reloadPointer = null;
    this.reloadPressed = false;
  }

  get reloadHeld(): boolean {
    return this.reloadPointer !== null;
  }

  poll(_ctx: PollContext): InputCommand {
    const cmd = emptyCommand();
    cmd.move = { x: this.moveStick.x, y: this.moveStick.y };
    if (this.aimStick.magnitude > 0) {
      cmd.aimAngle = Math.atan2(this.aimStick.y, this.aimStick.x);
      cmd.firing = this.aimStick.magnitude >= this.config.fireThreshold;
    }
    cmd.reload = this.reloadPressed;
    this.reloadPressed = false;
    return cmd;
  }
}
